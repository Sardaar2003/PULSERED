const express = require('express');
const router = express.Router();
const { analyzePostAndDraftReply, generateCustomEmail } = require('../services/aiOutreachService');
const OutreachLead = require('../models/OutreachLead');
const ProspectiveBuyer = require('../models/ProspectiveBuyer');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../logger');
const { addLog, getLogs, clearLogs } = require('../services/agentLogger');

// @route   POST /api/outreach/analyze
// @desc    Analyze Reddit post, compute intent & proof of fit, and draft AI response
router.post('/analyze', protect, async (req, res) => {
  const { post, targetDomain = 'AlertCareLine.com', tone = 'helpful_expert' } = req.body;

  if (!post || !post.title) {
    return res.status(400).json({ error: 'Valid Reddit post object is required' });
  }

  try {
    const analysis = await analyzePostAndDraftReply(post, targetDomain, tone);
    return res.json({
      success: true,
      post,
      targetDomain,
      tone,
      analysis,
    });
  } catch (error) {
    logger.error('Error in outreach AI analysis', { error: error.message });
    return res.status(500).json({ error: 'Failed to generate AI analysis and draft reply.' });
  }
});

// @route   POST /api/outreach/bulk-queue-keyword
// @desc    Batch analyze search results for a keyword and automatically send qualified leads to Outreach Lead Station
router.post('/bulk-queue-keyword', protect, async (req, res) => {
  const userId = req.user.id;
  const { posts, targetDomain = 'AlertCareLine.com', tone = 'helpful_expert' } = req.body;

  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return res.status(400).json({ error: 'Array of posts is required for bulk queueing' });
  }

  try {
    addLog('LEAD_AGENT', `Starting Prowlo & OpenRouter buying intent scan for ${posts.length} Reddit items...`, 'info');
    const isDbConnected = getIsConnected();
    const queuedLeads = [];

    for (const post of posts) {
      const analysis = await analyzePostAndDraftReply(post, targetDomain, tone);

      const leadData = {
        userId,
        postId: post.id || `p_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        postTitle: post.title,
        subreddit: post.subreddit || 'Reddit',
        author: post.author || 'Reddit User',
        permalink: post.permalink || '',
        url: post.url || '',
        targetDomain,
        intentScore: analysis.intentScore || 75,
        intentBadge: analysis.intentBadge || 'High Buying Intent',
        extractedPainPoint: analysis.extractedPainPoint || '',
        productFitRationale: analysis.productFitRationale || '',
        writingStrategy: analysis.writingStrategy || '',
        draftReply: analysis.draftReply || '',
        status: 'pending',
      };

      if (isDbConnected) {
        const existing = await OutreachLead.findOne({ userId, postId: leadData.postId });
        if (!existing) {
          const created = await OutreachLead.create(leadData);
          queuedLeads.push(created);
        } else {
          queuedLeads.push(existing);
        }
      } else {
        const store = getMemoryStore();
        const existing = store.outreachLeads.find(l => l.userId === userId && l.postId === leadData.postId);
        if (!existing) {
          const newLead = { id: `ol_${Date.now()}_${Math.random().toString(36).substring(7)}`, ...leadData, createdAt: new Date() };
          store.outreachLeads.unshift(newLead);
          queuedLeads.push(newLead);
        } else {
          queuedLeads.push(existing);
        }
      }
    }

    addLog('LEAD_AGENT', `Scan complete! ${queuedLeads.length} leads populated into Lead Result Board`, 'success');
    addLog('MESSAGING_AGENT', `${queuedLeads.length} DMs auto-drafted requesting email IDs (Awaiting HIL approval)`, 'hil_waiting');
    logger.info(`Bulk queued ${queuedLeads.length} leads to Outreach Station for user ${userId}`);
    return res.json({
      success: true,
      message: `Successfully analyzed and queued ${queuedLeads.length} leads in Outreach Lead Station!`,
      leadsCount: queuedLeads.length,
      leads: queuedLeads,
    });
  } catch (error) {
    logger.error('Error in bulk outreach queueing', { error: error.message });
    return res.status(500).json({ error: 'Failed to bulk queue outreach leads.' });
  }
});

// @route   POST /api/outreach/queue
// @desc    Save/Queue a lead in Outreach Lead Station (HIL Workflow)
router.post('/queue', protect, async (req, res) => {
  const userId = req.user.id;
  const { post, targetDomain, analysis, draftReply } = req.body;

  if (!post || !post.title) {
    return res.status(400).json({ error: 'Post data is required' });
  }

  try {
    const isDbConnected = getIsConnected();
    const leadData = {
      userId,
      postId: post.id || `p_${Date.now()}`,
      postTitle: post.title,
      subreddit: post.subreddit || 'Reddit',
      author: post.author || 'Reddit User',
      permalink: post.permalink || '',
      url: post.url || '',
      targetDomain: targetDomain || 'AlertCareLine.com',
      intentScore: analysis?.intentScore || 75,
      intentBadge: analysis?.intentBadge || 'High Buying Intent',
      extractedPainPoint: analysis?.extractedPainPoint || '',
      productFitRationale: analysis?.productFitRationale || '',
      writingStrategy: analysis?.writingStrategy || '',
      draftReply: draftReply || analysis?.draftReply || '',
      status: 'pending',
    };

    if (isDbConnected) {
      const existing = await OutreachLead.findOne({ userId, postId: leadData.postId });
      if (existing) {
        existing.draftReply = leadData.draftReply;
        existing.targetDomain = leadData.targetDomain;
        await existing.save();
        return res.json({ message: 'Lead updated in Outreach Queue', lead: existing });
      }
      const lead = await OutreachLead.create(leadData);
      return res.status(201).json({ message: 'Lead added to Outreach Station', lead });
    } else {
      const store = getMemoryStore();
      const existingIdx = store.outreachLeads.findIndex(l => l.userId === userId && l.postId === leadData.postId);
      if (existingIdx !== -1) {
        store.outreachLeads[existingIdx].draftReply = leadData.draftReply;
        return res.json({ message: 'Lead updated in Outreach Queue', lead: store.outreachLeads[existingIdx] });
      }
      const newLead = { id: `ol_${Date.now()}`, ...leadData, createdAt: new Date() };
      store.outreachLeads.unshift(newLead);
      return res.status(201).json({ message: 'Lead added to Outreach Station', lead: newLead });
    }
  } catch (error) {
    logger.error('Error queuing outreach lead', { error: error.message });
    return res.status(500).json({ error: 'Server error adding lead to queue' });
  }
});

// @route   GET /api/outreach/queue
// @desc    Get user's Outreach Lead Station queue
router.get('/queue', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const leads = await OutreachLead.find({ userId }).sort({ createdAt: -1 });
      return res.json({ leads });
    } else {
      const store = getMemoryStore();
      const userLeads = store.outreachLeads.filter(l => l.userId === userId);
      return res.json({ leads: userLeads });
    }
  } catch (error) {
    logger.error('Error fetching outreach queue', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve outreach queue' });
  }
});

// @route   PATCH /api/outreach/queue/:id/status
// @desc    Update lead status (pending, posted, dismissed) or draft reply
router.patch('/queue/:id/status', protect, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { status, draftReply } = req.body;

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const lead = await OutreachLead.findOne({ _id: id, userId });
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      if (status) lead.status = status;
      if (status === 'posted') lead.postedAt = new Date();
      if (draftReply !== undefined) lead.draftReply = draftReply;
      await lead.save();
      return res.json({ message: 'Lead status updated', lead });
    } else {
      const store = getMemoryStore();
      const lead = store.outreachLeads.find(l => (l.id === id || l._id === id) && l.userId === userId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      if (status) lead.status = status;
      if (status === 'posted') lead.postedAt = new Date();
      if (draftReply !== undefined) lead.draftReply = draftReply;
      return res.json({ message: 'Lead status updated', lead });
    }
  } catch (error) {
    logger.error('Error updating lead status', { error: error.message });
    return res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// @route   DELETE /api/outreach/queue/:id
// @desc    Delete lead from queue
router.delete('/queue/:id', protect, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      await OutreachLead.deleteOne({ _id: id, userId });
      return res.json({ message: 'Lead removed from queue' });
    } else {
      const store = getMemoryStore();
      store.outreachLeads = store.outreachLeads.filter(l => !(l.id === id || l._id === id && l.userId === userId));
      return res.json({ message: 'Lead removed from queue' });
    }
  } catch (error) {
    logger.error('Error deleting lead', { error: error.message });
    return res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// @route   GET /api/outreach/logs
// @desc    Get real-time agent telemetry & debugging logs
router.get('/logs', protect, (req, res) => {
  return res.json({ logs: getLogs() });
});

// @route   POST /api/outreach/logs/clear
// @desc    Clear log buffer
router.post('/logs/clear', protect, (req, res) => {
  clearLogs();
  return res.json({ message: 'Logs cleared', logs: getLogs() });
});

// @route   POST /api/outreach/buyers
// @desc    Store prospective buyer (captured email address)
router.post('/buyers', protect, async (req, res) => {
  const userId = req.user.id;
  const { redditUsername, email, subreddit = 'Reddit', sourcePostTitle = '', painPoint = '' } = req.body;

  if (!email || !redditUsername) {
    return res.status(400).json({ error: 'Reddit username and Email address are required.' });
  }

  try {
    const isDbConnected = getIsConnected();
    const buyerData = {
      userId,
      redditUsername,
      email,
      subreddit,
      sourcePostTitle,
      painPoint,
      status: 'Captured',
    };

    let buyer;
    if (isDbConnected) {
      buyer = await ProspectiveBuyer.create(buyerData);
    } else {
      const store = getMemoryStore();
      buyer = { id: `pb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...buyerData, createdAt: new Date() };
      store.prospectiveBuyers = store.prospectiveBuyers || [];
      store.prospectiveBuyers.unshift(buyer);
    }

    addLog('EMAIL_AGENT', `Captured prospective buyer email: ${email} (u/${redditUsername})`, 'success', buyerData);
    return res.status(201).json({ message: 'Prospective buyer saved successfully!', buyer });
  } catch (error) {
    logger.error('Error saving prospective buyer', { error: error.message });
    addLog('EMAIL_AGENT', `Failed to save buyer: ${error.message}`, 'error');
    return res.status(500).json({ error: 'Failed to save prospective buyer.' });
  }
});

// @route   GET /api/outreach/buyers
// @desc    Get prospective buyers list
router.get('/buyers', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const buyers = await ProspectiveBuyer.find({ userId }).sort({ createdAt: -1 });
      return res.json({ buyers });
    } else {
      const store = getMemoryStore();
      const buyers = (store.prospectiveBuyers || []).filter(b => b.userId === userId);
      return res.json({ buyers });
    }
  } catch (error) {
    logger.error('Error fetching prospective buyers', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve prospective buyers.' });
  }
});

// @route   POST /api/outreach/generate-email
// @desc    Generate email draft for a prospective buyer
router.post('/generate-email', protect, async (req, res) => {
  const { prospectiveBuyer, targetDomain = 'AlertCareLine.com' } = req.body;
  if (!prospectiveBuyer || !prospectiveBuyer.email) {
    return res.status(400).json({ error: 'Valid prospective buyer object with email is required' });
  }

  try {
    addLog('EMAIL_AGENT', `Generating customized consultation email for ${prospectiveBuyer.email}`, 'info');
    const emailDraft = await generateCustomEmail(prospectiveBuyer, targetDomain);
    addLog('EMAIL_AGENT', `Email draft ready for ${prospectiveBuyer.email} [Subject: "${emailDraft.subject}"]`, 'hil_waiting');
    return res.json({ success: true, emailDraft });
  } catch (error) {
    logger.error('Error drafting custom email', { error: error.message });
    addLog('EMAIL_AGENT', `Email generation failed: ${error.message}`, 'error');
    return res.status(500).json({ error: 'Failed to generate email draft.' });
  }
});

module.exports = router;

