const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../logger');
const User = require('../models/User');
const LeadAgentItem = require('../models/LeadAgentItem');
const { getIsConnected, getMemoryStore } = require('../config/db');
const {
  saveAndActivateRedditSession,
  saveAndActivateRedditCookies,
  getActiveRedditSession,
  disconnectRedditSession,
  sendRedditDirectMessage,
  postRedditComment,
} = require('../services/redditSessionService');

// @route   GET /api/reddit-account/status
// @desc    Get current user's Reddit account connection status
router.get('/status', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const session = await getActiveRedditSession(userId);
    if (!session || !session.username) {
      return res.json({
        isConnected: false,
        username: '',
        linkKarma: 0,
        commentKarma: 0,
        lastConnectedAt: null,
        hasCookies: false,
        lastError: session?.lastError || '',
      });
    }

    return res.json({
      isConnected: Boolean(session.isConnected && session.cookies),
      username: session.username,
      linkKarma: session.linkKarma || 0,
      commentKarma: session.commentKarma || 0,
      lastConnectedAt: session.lastConnectedAt || null,
      hasCookies: Boolean(session.cookies),
      lastError: session.lastError || '',
    });
  } catch (error) {
    logger.error('Error fetching Reddit account status', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve Reddit account status' });
  }
});

// @route   POST /api/reddit-account/login
// @desc    Log in to Reddit with username and password, save session cookies
router.post('/login', protect, async (req, res) => {
  const userId = req.user.id;
  const { username, password, totp_secret, totpSecret, proxy, method = 'browser' } = req.body;

  console.log('\n======================================================');
  console.log(`📥 [EXPRESS HIT] POST /api/reddit-account/login`);
  console.log(`   User: u/${username || 'UNKNOWN'}`);
  console.log(`   Engine Method: ${method || 'browser'}`);
  console.log(`   Timestamp: ${new Date().toLocaleTimeString()}`);
  console.log('======================================================\n');

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Reddit username and password are required.',
    });
  }

  try {
    const loginResult = await saveAndActivateRedditSession(userId, {
      username: username.trim(),
      password: password.trim(),
      totp_secret: totp_secret || totpSecret || '',
      proxy: proxy || '',
      method: method || 'browser',
    });

    if (loginResult.success) {
      return res.json({
        success: true,
        message: `Successfully connected Reddit account u/${loginResult.username}`,
        username: loginResult.username,
        linkKarma: loginResult.link_karma,
        commentKarma: loginResult.comment_karma,
        connectedAt: loginResult.connectedAt,
      });
    }

    return res.status(loginResult.status || 400).json({
      success: false,
      error: loginResult.error || 'Reddit authentication failed.',
      code: loginResult.code,
    });
  } catch (error) {
    logger.error('Error in Reddit account login route', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while logging in to Reddit',
    });
  }
});

// @route   POST /api/reddit-account/connect-cookies
// @desc    Connect Reddit account directly using browser session cookies (100% reliable)
router.post('/connect-cookies', async (req, res) => {
  let userId = null;

  // 1. If Authorization Bearer token present, verify via JWT
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const JWT_SECRET = process.env.JWT_SECRET || 'prowlo_reddit_jwt_secret_key_987654321';
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (e) {
      logger.warn(`Invalid or expired token in connect-cookies: ${e.message}`);
    }
  }

  // 2. If no valid JWT (e.g., 1-Click Chrome Extension), associate with primary approved user
  if (!userId) {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const user = await User.findOne({ isApproved: true }).sort({ createdAt: 1 });
      userId = user?._id?.toString();
    } else {
      const store = getMemoryStore();
      const user = (store.users || []).find((u) => u.isApproved !== false);
      userId = user ? String(user._id || user.id) : null;
    }
  }

  if (!userId) {
    return res.status(401).json({ success: false, error: 'No active user found on PulseRed server.' });
  }

  const { username, cookieInput, reddit_session, loid, csrf_token } = req.body;

  console.log('\n======================================================');
  console.log(`📥 [EXPRESS HIT] POST /api/reddit-account/connect-cookies`);
  console.log(`   User: u/${username || 'UNKNOWN'} (Linked to PulseRed User: ${userId})`);
  console.log(`   Timestamp: ${new Date().toLocaleTimeString()}`);
  console.log('======================================================\n');

  try {
    const result = await saveAndActivateRedditCookies(userId, {
      username,
      cookieInput,
      reddit_session,
      loid,
      csrf_token,
    });

    return res.json({
      success: true,
      message: `Successfully connected Reddit account u/${result.username} via session cookies!`,
      username: result.username,
      connectedAt: result.connectedAt,
    });
  } catch (error) {
    logger.error('Error connecting Reddit cookies', { error: error.message });
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to activate Reddit session cookies',
    });
  }
});

// @route   POST /api/reddit-account/disconnect
// @desc    Disconnect active Reddit session and clear saved cookies
router.post('/disconnect', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    await disconnectRedditSession(userId);
    return res.json({
      success: true,
      message: 'Reddit account disconnected successfully.',
    });
  } catch (error) {
    logger.error('Error disconnecting Reddit account', { error: error.message });
    return res.status(500).json({ error: 'Failed to disconnect Reddit account' });
  }
});

// @route   POST /api/reddit-account/send-dm
// @desc    Send a Direct Message using authenticated Reddit session cookies
router.post('/send-dm', protect, async (req, res) => {
  const userId = req.user.id;
  const { to, subject, text, leadId } = req.body;

  if (!to || !text) {
    return res.status(400).json({ error: 'Recipient username and message text are required.' });
  }

  try {
    const result = await sendRedditDirectMessage(userId, { to, subject, text });

    // If linked to a lead, advance pipeline stage to 'Engaged / Replied'
    if (leadId) {
      try {
        const isDbConnected = getIsConnected();
        if (isDbConnected) {
          await LeadAgentItem.findOneAndUpdate(
            { _id: leadId, userId },
            {
              approvalStatus: 'sent',
              stage: 'Engaged / Replied',
              sentMessage: text,
              sentSubject: subject || '',
              sentAt: new Date(),
            }
          );
        } else {
          const store = getMemoryStore();
          const lead = store.leadAgentItems?.find(l => (l.id === leadId || l._id === leadId) && l.userId === userId);
          if (lead) {
            lead.approvalStatus = 'sent';
            lead.stage = 'Engaged / Replied';
            lead.sentMessage = text;
            lead.sentSubject = subject || '';
            lead.sentAt = new Date();
          }
        }
      } catch (leadUpdateErr) {
        logger.warn('Failed to auto-update lead stage on send-dm:', { error: leadUpdateErr.message });
      }
    }

    return res.json({
      success: true,
      message: `Direct message dispatched successfully to u/${to}!`,
      data: result.data,
    });
  } catch (error) {
    logger.error('Failed to send Reddit DM', { error: error.message });
    return res.status(400).json({ error: error.message || 'Failed to dispatch Reddit Direct Message' });
  }
});

// @route   POST /api/reddit-account/submit-comment
// @desc    Submit a comment using authenticated Reddit session cookies
router.post('/submit-comment', protect, async (req, res) => {
  const userId = req.user.id;
  const { thingId, text } = req.body;

  if (!thingId || !text) {
    return res.status(400).json({ error: 'Target thing ID (post or comment ID) and text are required.' });
  }

  try {
    const result = await postRedditComment(userId, { thingId, text });
    return res.json({
      success: true,
      message: 'Comment posted successfully to Reddit thread!',
      data: result.data,
    });
  } catch (error) {
    logger.error('Failed to post Reddit comment', { error: error.message });
    return res.status(400).json({ error: error.message || 'Failed to post Reddit comment' });
  }
});

// @route   GET /api/reddit-account/download-extension
// @desc    Download the PulseRed Connect Chrome extension ZIP package
router.get('/download-extension', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const zipPath = path.join(__dirname, '../../public/downloads/pulsered-extension.zip');
  if (fs.existsSync(zipPath)) {
    return res.download(zipPath, 'pulsered-connect-extension.zip');
  }
  return res.status(404).json({ error: 'Extension package not found' });
});

module.exports = router;
