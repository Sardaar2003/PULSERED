const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const logger = require('../logger');
const {
  generateHumanEmailWithStrategy,
  sendOutreachEmail,
  getSmtpStatus,
} = require('../services/emailAgentService');
const LeadAgentItem = require('../models/LeadAgentItem');
const { getIsConnected, getMemoryStore } = require('../config/db');

// @route   GET /api/email-agent/status
// @desc    Get SMTP server configuration status
router.get('/status', protect, async (req, res) => {
  try {
    const isDbConnected = getIsConnected();
    let userEmailSettings = null;
    const User = require('../models/User');

    if (isDbConnected) {
      const u = await User.findById(req.user.id).select('agentSettings');
      userEmailSettings = u?.agentSettings?.emailAgent;
    } else {
      const store = getMemoryStore();
      const u = store.users?.find(x => x.id === req.user.id || x._id === req.user.id);
      userEmailSettings = u?.agentSettings?.emailAgent;
    }

    const status = getSmtpStatus(userEmailSettings);
    return res.json(status);
  } catch (error) {
    logger.error('Error fetching SMTP status', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve SMTP configuration status' });
  }
});

// @route   POST /api/email-agent/generate
// @desc    Generate personalized human email connection strategy and 3 variations
router.post('/generate', protect, async (req, res) => {
  const userId = req.user.id;
  const {
    leadId,
    recipientEmail,
    recipientName,
    postTitle,
    postContent,
    subreddit,
    targetDomain = 'AlertCareLine.com',
    psychologicalProfile,
    tone = 'founder_peer',
    customInstruction = '',
  } = req.body;

  try {
    let resolvedEmail = recipientEmail;
    let resolvedName = recipientName;
    let resolvedTitle = postTitle;
    let resolvedContent = postContent;
    let resolvedSubreddit = subreddit;
    let resolvedDomain = targetDomain;
    let resolvedProfile = psychologicalProfile;

    // If leadId is provided, enrich with stored DB lead details
    if (leadId) {
      const isDbConnected = getIsConnected();
      let lead = null;
      if (isDbConnected) {
        lead = await LeadAgentItem.findOne({ _id: leadId, userId });
      } else {
        const store = getMemoryStore();
        lead = store.leadAgentItems?.find(l => (l.id === leadId || l._id === leadId) && l.userId === userId);
      }

      if (lead) {
        resolvedName = resolvedName || lead.author;
        resolvedTitle = resolvedTitle || lead.postTitle;
        resolvedContent = resolvedContent || lead.commentQuote || lead.postSnippet;
        resolvedSubreddit = resolvedSubreddit || lead.subreddit;
        resolvedDomain = resolvedDomain || lead.targetDomain;
        resolvedProfile = resolvedProfile || lead.psychologicalProfile;
      }
    }

    let userEmailSettings = null;
    const User = require('../models/User');
    if (isDbConnected) {
      const u = await User.findById(userId).select('agentSettings');
      userEmailSettings = u?.agentSettings?.emailAgent;
    } else {
      const store = getMemoryStore();
      const u = store.users?.find(x => x.id === userId || x._id === userId);
      userEmailSettings = u?.agentSettings?.emailAgent;
    }

    const resolvedTone = tone || userEmailSettings?.defaultAngle || 'founder_peer';
    const resolvedInstruction = customInstruction || userEmailSettings?.customInstructions || '';

    const result = await generateHumanEmailWithStrategy({
      recipientEmail: resolvedEmail,
      recipientName: resolvedName,
      postTitle: resolvedTitle,
      postContent: resolvedContent,
      subreddit: resolvedSubreddit,
      targetDomain: resolvedDomain,
      psychologicalProfile: resolvedProfile,
      tone: resolvedTone,
      customInstruction: resolvedInstruction,
    });

    return res.json({
      success: true,
      recipientEmail: resolvedEmail,
      recipientName: resolvedName,
      targetDomain: resolvedDomain,
      subreddit: resolvedSubreddit,
      ...result,
    });
  } catch (error) {
    logger.error('Error in Email Agent strategy generation', { error: error.message });
    return res.status(500).json({ error: 'Failed to generate email strategy: ' + error.message });
  }
});

// @route   POST /api/email-agent/send
// @desc    Dispatches an email to the target recipient upon human approval
router.post('/send', protect, async (req, res) => {
  const userId = req.user.id;
  const { to, subject, body, leadId, fromName, replyTo } = req.body;

  if (!to || !to.includes('@')) {
    return res.status(400).json({ error: 'A valid recipient email address is required.' });
  }
  if (!subject || !body) {
    return res.status(400).json({ error: 'Subject line and email body are required.' });
  }

  try {
    const result = await sendOutreachEmail({
      userId,
      to,
      subject,
      body,
      fromName,
      replyTo,
      leadId,
    });

    return res.json({
      success: true,
      message: `Email dispatched successfully to ${to}!`,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to send outreach email', { error: error.message });
    return res.status(400).json({ error: error.message || 'Failed to dispatch email' });
  }
});

module.exports = router;
