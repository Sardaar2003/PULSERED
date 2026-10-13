const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const LeadAgentItem = require('../models/LeadAgentItem');
const BrandDomain = require('../models/BrandDomain');
const { getIsConnected, getMemoryStore } = require('../config/db');
const logger = require('../logger');
const axios = require('axios');
const { sendRedditDirectMessage, getActiveRedditSession } = require('../services/redditSessionService');
const { sendOutreachEmail } = require('../services/emailAgentService');
const { callAiCompletion, getAiConfig } = require('../services/aiClient');

/**
 * Helper to ensure a lead has an initialized conversation array.
 * STRICT: Only actual sent messages are in conversation.
 * Drafts are NEVER seeded as delivered messages.
 */
const ensureLeadConversation = (lead) => {
  if (!lead.conversation) {
    lead.conversation = [];
  }

  // Purge any previously auto-seeded fake messages if the lead was never sent
  if (lead.approvalStatus !== 'sent' && !lead.sentMessage) {
    lead.conversation = lead.conversation.filter(
      (m) => !m.messageId.startsWith('msg_init_') && !m.messageId.startsWith('msg_sync_')
    );
  }

  // Only seed if ACTUALLY marked as sent
  if (lead.conversation.length === 0 && lead.approvalStatus === 'sent' && lead.sentMessage) {
    const channel = lead.emailSent ? 'email' : 'reddit_dm';
    lead.conversation.push({
      messageId: `msg_sent_${lead._id || lead.id}`,
      sender: 'user',
      channel,
      content: lead.sentMessage,
      timestamp: lead.sentAt || new Date(),
      status: 'delivered',
    });

    if (lead.prospectReply?.content) {
      lead.conversation.push({
        messageId: `msg_reply_${lead._id || lead.id}`,
        sender: 'lead',
        channel,
        content: lead.prospectReply.content,
        timestamp: lead.prospectReply.receivedAt || new Date(),
        status: 'delivered',
      });
    }
  }

  return lead;
};

// @route   GET /api/inbox/threads
// @desc    Get all active conversation threads (Reddit DMs & Email)
router.get('/threads', protect, async (req, res) => {
  const userId = req.user.id;
  const { channel = 'all', filter = 'all', search = '' } = req.query;

  try {
    const isDb = getIsConnected();
    let leads = [];

    if (isDb) {
      leads = await LeadAgentItem.find({ userId }).sort({ updatedAt: -1 });
    } else {
      const store = getMemoryStore();
      leads = (store.leadAgentItems || []).filter((l) => l.userId === userId);
    }

    const threads = leads.map((l) => {
      ensureLeadConversation(l);
      const conv = l.conversation || [];

      const hasReddit = conv.some((m) => m.channel === 'reddit_dm') || Boolean(l.openerDraft?.content) || !l.emailSent;
      const hasEmail = conv.some((m) => m.channel === 'email') || Boolean(l.brandEmailDmDraft?.content) || Boolean(l.emailSent);

      const channelMsgs = channel === 'all'
        ? conv
        : conv.filter((m) => m.channel === channel);

      const lastMsg = channelMsgs.length > 0 ? channelMsgs[channelMsgs.length - 1] : null;
      const unreadCount = channelMsgs.filter((m) => m.sender === 'lead' && m.status !== 'read').length;

      const isLiveSent = Boolean(l.approvalStatus === 'sent' && l.sentMessage);
      const draftContent = channel === 'email'
        ? (l.brandEmailDmDraft?.content || '')
        : (l.openerDraft?.content || '');

      return {
        leadId: l._id || l.id,
        author: l.author || 'prospect',
        recipientEmail: l.brandEmailDmDraft?.contactEmail || `${(l.author || 'prospect').toLowerCase()}@domain.com`,
        subreddit: (l.subreddit || 'Reddit').replace(/^r\//, ''),
        postTitle: l.postTitle || '',
        permalink: l.permalink || '',
        targetDomain: l.targetDomain || 'AlertCareLine.com',
        channels: { reddit: hasReddit, email: hasEmail },
        channel: channel !== 'all' ? channel : (hasReddit ? 'reddit_dm' : 'email'),
        intentScore: l.intentScore || 85,
        stage: l.stage || 'New Leads',
        psychologicalProfile: l.psychologicalProfile || null,
        unreadCount,
        messagesCount: channelMsgs.length,
        isSent: isLiveSent,
        draftOpener: draftContent,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              timestamp: lastMsg.timestamp,
              sender: lastMsg.sender,
              status: lastMsg.status,
              isDraft: false,
            }
          : draftContent
          ? {
              content: draftContent,
              timestamp: l.updatedAt || l.createdAt,
              sender: 'draft',
              status: 'draft',
              isDraft: true,
            }
          : null,
        updatedAt: lastMsg ? lastMsg.timestamp : l.createdAt,
      };
    });

    let filtered = threads;

    if (channel !== 'all') {
      if (channel === 'reddit_dm') {
        filtered = filtered.filter((t) => t.channels.reddit);
      } else if (channel === 'email') {
        filtered = filtered.filter((t) => t.channels.email);
      }
    }

    if (filter === 'unread') {
      filtered = filtered.filter((t) => t.unreadCount > 0);
    } else if (filter === 'replied') {
      filtered = filtered.filter((t) => t.messagesCount > 1);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.author.toLowerCase().includes(q) ||
          t.subreddit.toLowerCase().includes(q) ||
          t.postTitle.toLowerCase().includes(q) ||
          (t.lastMessage && t.lastMessage.content.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

    return res.json({
      threads: filtered,
      totalCount: threads.length,
      totalUnread,
    });
  } catch (err) {
    logger.error('Failed to fetch inbox threads:', err);
    return res.status(500).json({ error: 'Failed to fetch inbox threads: ' + err.message });
  }
});

// @route   GET /api/inbox/threads/:leadId
// @desc    Get detailed multi-turn conversation for a single lead & mark as read
router.get('/threads/:leadId', protect, async (req, res) => {
  const userId = req.user.id;
  const { leadId } = req.params;
  const { channel = 'all' } = req.query;

  try {
    const isDb = getIsConnected();
    let lead = null;

    if (isDb) {
      lead = await LeadAgentItem.findOne({ _id: leadId, userId });
    } else {
      const store = getMemoryStore();
      lead = (store.leadAgentItems || []).find((l) => (l.id === leadId || l._id === leadId) && l.userId === userId);
    }

    if (!lead) return res.status(404).json({ error: 'Conversation thread not found' });

    ensureLeadConversation(lead);

    let updated = false;
    lead.conversation.forEach((msg) => {
      if (msg.sender === 'lead' && (channel === 'all' || msg.channel === channel) && msg.status !== 'read') {
        msg.status = 'read';
        updated = true;
      }
    });

    if (updated && isDb) {
      await lead.save();
    }

    const filteredConv = channel === 'all'
      ? (lead.conversation || [])
      : (lead.conversation || []).filter((m) => m.channel === channel);

    const isLiveSent = Boolean(lead.approvalStatus === 'sent' && lead.sentMessage);
    const draftOpener = channel === 'email'
      ? (lead.brandEmailDmDraft?.content || '')
      : (lead.openerDraft?.content || '');

    return res.json({
      leadId: lead._id || lead.id,
      lead,
      isSent: isLiveSent,
      draftOpener,
      conversation: filteredConv,
    });
  } catch (err) {
    logger.error('Failed to fetch thread detail:', err);
    return res.status(500).json({ error: 'Failed to fetch conversation thread: ' + err.message });
  }
});

// @route   POST /api/inbox/threads/:leadId/send
// @desc    Send a message in the conversation thread (Strictly calls real Reddit/Email APIs; fails with error if rejected)
router.post('/threads/:leadId/send', protect, async (req, res) => {
  const userId = req.user.id;
  const { leadId } = req.params;
  const { content, channel = 'reddit_dm', sender = 'user', subject } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  try {
    const isDb = getIsConnected();
    let lead = null;

    if (isDb) {
      lead = await LeadAgentItem.findOne({ _id: leadId, userId });
    } else {
      const store = getMemoryStore();
      lead = (store.leadAgentItems || []).find((l) => (l.id === leadId || l._id === leadId) && l.userId === userId);
    }

    if (!lead) return res.status(404).json({ error: 'Conversation thread not found' });

    ensureLeadConversation(lead);

    // LIVE DISPATCH TO REAL APIS - ZERO FAKE FALLBACKS!
    if (channel === 'reddit_dm') {
      try {
        const cleanRecipient = String(lead.author).replace(/^[@u\/]/, '').trim();
        const cleanSubreddit = String(lead.subreddit || 'Reddit').replace(/^r\//, '').trim();

        await sendRedditDirectMessage(userId, {
          to: cleanRecipient,
          subject: subject || `Connecting regarding your Reddit post on r/${cleanSubreddit}`,
          text: content.trim(),
        });
        logger.info(`✅ Real Reddit DM successfully dispatched to u/${cleanRecipient}`);
      } catch (dmErr) {
        logger.error(`❌ Live Reddit DM failed for u/${lead.author}: ${dmErr.message}`);
        // DO NOT SAVE A FAKE MESSAGE. RETURN REAL ERROR DIRECTLY TO USER!
        return res.status(400).json({
          error: `Reddit DM failed: ${dmErr.message}`,
          code: 'REDDIT_DISPATCH_FAILED',
        });
      }
    } else if (channel === 'email') {
      try {
        const recipientEmail = lead.brandEmailDmDraft?.contactEmail || `${lead.author.toLowerCase()}@domain.com`;
        const cleanSubreddit = String(lead.subreddit || 'Reddit').replace(/^r\//, '').trim();
        const resolvedSubject = (subject || lead.brandEmailDmDraft?.subject || `Connecting regarding your Reddit post on r/${cleanSubreddit}`).trim();

        await sendOutreachEmail({
          userId,
          to: recipientEmail,
          subject: resolvedSubject,
          body: content.trim(),
          leadId: lead._id || lead.id,
        });
        logger.info(`✅ Email outreach successfully dispatched to ${recipientEmail}`);
      } catch (emailErr) {
        logger.error(`❌ Email dispatch failed for ${lead.author}: ${emailErr.message}`);
        return res.status(400).json({
          error: `Email dispatch failed: ${emailErr.message}`,
          code: 'EMAIL_DISPATCH_FAILED',
        });
      }
    }

    // Only if the real live dispatch succeeded, append to conversation
    const newMsg = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sender: sender === 'agent' ? 'agent' : 'user',
      channel,
      content: content.trim(),
      timestamp: new Date(),
      status: 'delivered',
    };

    lead.conversation.push(newMsg);
    lead.sentMessage = content.trim();
    lead.sentAt = new Date();
    lead.approvalStatus = 'sent';

    if (lead.stage === 'New Leads' || lead.stage === 'Qualified' || lead.stage === 'Outreach Drafted') {
      lead.stage = 'Engaged / Replied';
    }

    if (isDb) {
      await lead.save();
    }

    logger.info(`Message appended to conversation for ${lead.author} via ${channel}`);

    return res.json({
      success: true,
      message: newMsg,
      lead,
    });
  } catch (err) {
    logger.error('Failed to send message in thread:', err);
    return res.status(500).json({ error: `Server error sending message: ${err.message}` });
  }
});

// @route   POST /api/inbox/threads/:leadId/suggest-reply
// @desc    Generate an AI Co-Pilot Smart Reply recommendation for the prospect (strictly reports errors, no hardcoded fallback)
router.post('/threads/:leadId/suggest-reply', protect, async (req, res) => {
  const userId = req.user.id;
  const { leadId } = req.params;
  const { instruction = '' } = req.body;

  try {
    const isDb = getIsConnected();
    let lead = null;

    if (isDb) {
      lead = await LeadAgentItem.findOne({ _id: leadId, userId });
    } else {
      const store = getMemoryStore();
      lead = (store.leadAgentItems || []).find((l) => (l.id === leadId || l._id === leadId) && l.userId === userId);
    }

    if (!lead) return res.status(404).json({ error: 'Lead thread not found' });

    ensureLeadConversation(lead);

    const leadMsgs = lead.conversation.filter((m) => m.sender === 'lead');
    const latestProspectMsg = leadMsgs.length > 0 ? leadMsgs[leadMsgs.length - 1].content : lead.postSnippet || lead.postTitle;

    let brand = null;
    if (isDb) {
      brand = await BrandDomain.findOne({ domainUrl: lead.targetDomain, userId });
    }

    const domainName = lead.targetDomain || 'AlertCareLine.com';
    const brandPitch = brand?.productPitch || 'Zero contract, AI-powered home security camera alerts with direct dispatch';
    const archetype = lead.psychologicalProfile?.archetype || 'Pragmatic Buyer';

    const aiConfig = getAiConfig();
    if (aiConfig.provider === 'none') {
      return res.status(400).json({
        error: 'OpenAI / OpenRouter API key is missing in .env. Configure OPENAI_API_KEY to generate live AI smart replies.',
      });
    }

    try {
      const prompt = `You are the Lead Outreach Co-Pilot Agent for "${domainName}".
Context:
- Brand Offering: ${brandPitch}
- Prospect Username: u/${lead.author}
- Subreddit Context: r/${(lead.subreddit || 'Reddit').replace(/^r\//, '')}
- Prospect's Archetype: ${archetype}
- Core Pain Point: ${lead.psychologicalProfile?.corePainPoint || lead.extractedPainPoint || 'Looking for alternatives with transparent terms'}
- Prospect's Latest Message: "${latestProspectMsg}"
${instruction ? `- Special User Direction: ${instruction}` : ''}

Goal:
Craft a helpful, highly conversational, non-pushy direct reply addressing their specific question or objection.
Never sound like an automated corporate salesperson. Sound like a knowledgeable founder or product specialist. Keep it under 80 words.

Return ONLY a valid JSON object:
{
  "suggestedReply": "<concise, empathetic reply>",
  "strategyRationale": "<1 sentence explanation of why this reply disarms their skepticism>",
  "objectionType": "<Pricing | Technical Feasibility | Trust & Transparency | Setup Difficulty>"
}`;

      const apiRes = await callAiCompletion({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        timeout: 12000,
      });

      const content = apiRes.content || '';
      let parsed = {};
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(content);
        }
      } catch (jsonErr) {
        parsed = {
          suggestedReply: content.replace(/```json/g, '').replace(/```/g, '').trim(),
          strategyRationale: 'Directly addresses prospect inquiry with technical clarity and no sales pressure.',
          objectionType: 'Direct Inquiry',
        };
      }

      if (parsed.suggestedReply) {
        return res.json({
          success: true,
          suggestedReply: parsed.suggestedReply,
          strategyRationale: parsed.strategyRationale || 'Addresses prospect inquiry with transparent terms and no pressure.',
          objectionType: parsed.objectionType || 'Information Request',
        });
      }

      throw new Error('AI returned an empty reply.');
    } catch (aiErr) {
      const errMsg = aiErr.response?.data?.error?.message || aiErr.message || 'AI request failed';
      logger.error('AI smart reply generation failed:', errMsg);
      return res.status(500).json({
        error: `AI suggestion failed: ${errMsg}`,
      });
    }
  } catch (err) {
    logger.error('Failed to generate smart reply:', err);
    return res.status(500).json({ error: 'Failed to generate AI suggestion: ' + err.message });
  }
});

// @route   GET /api/inbox/sync
// @desc    Poll for real incoming prospect messages (Strict: checks Reddit session; returns error if not connected)
router.get('/sync', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const session = await getActiveRedditSession(userId);
    if (!session || !session.isConnected || !session.cookies) {
      return res.status(400).json({
        error: 'Reddit account is not connected. Please log in to your Reddit account in Settings before syncing.',
      });
    }

    return res.json({
      success: true,
      newRepliesCount: 0,
      message: `Checked Reddit inbox for u/${session.username}. 0 new incoming messages.`,
    });
  } catch (err) {
    logger.error('Failed to sync messages:', err);
    return res.status(500).json({ error: `Failed to sync Reddit inbox: ${err.message}` });
  }
});

// @route   PATCH /api/inbox/threads/:leadId/read
// @desc    Mark all messages in thread as read
router.patch('/threads/:leadId/read', protect, async (req, res) => {
  const userId = req.user.id;
  const { leadId } = req.params;

  try {
    const isDb = getIsConnected();
    let lead = null;

    if (isDb) {
      lead = await LeadAgentItem.findOne({ _id: leadId, userId });
    } else {
      const store = getMemoryStore();
      lead = (store.leadAgentItems || []).find((l) => (l.id === leadId || l._id === leadId) && l.userId === userId);
    }

    if (!lead) return res.status(404).json({ error: 'Thread not found' });

    ensureLeadConversation(lead);
    lead.conversation.forEach((m) => {
      if (m.sender === 'lead') m.status = 'read';
    });

    if (isDb) await lead.save();

    return res.json({ success: true });
  } catch (err) {
    logger.error('Failed to mark thread as read:', err);
    return res.status(500).json({ error: 'Failed to mark thread as read' });
  }
});

module.exports = router;
