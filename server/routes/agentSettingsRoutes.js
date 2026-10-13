const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const logger = require('../logger');
const User = require('../models/User');
const { getIsConnected, getMemoryStore } = require('../config/db');

const DEFAULT_AGENT_SETTINGS = {
  leadAgent: {
    searchDepth: 15,
    targetAudience: 'both', // 'both' | 'authors' | 'commenters'
    minIntentScore: 65,
    deduplicateSeen: true,
    scanComments: true,
    aiModel: 'google/gemini-2.0-flash-001',
    defaultSubreddit: 'all',
  },
  dmAgent: {
    defaultTone: 'warm_peer', // 'warm_peer' | 'value_advisor' | 'solution_consultant'
    maxWords: 110,
    requireApproval: true,
    customInstructions: 'Avoid marketing speak, sound like a helpful peer engineer.',
    dailyLimit: 25,
    dispatchMethod: 'reddit_api',
  },
  emailAgent: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    fromName: 'PulseRed Outreach',
    defaultAngle: 'founder_peer', // 'founder_peer' | 'value_advisor' | 'demo_invite'
    deliveryMode: 'simulated_delivery', // 'live_smtp' | 'simulated_delivery'
    requireApproval: true,
    customInstructions: 'Highlight transparent pricing and zero lock-in contracts.',
  },
};

const mergeWithDefaults = (stored = {}) => {
  return {
    leadAgent: { ...DEFAULT_AGENT_SETTINGS.leadAgent, ...(stored?.leadAgent || {}) },
    dmAgent: { ...DEFAULT_AGENT_SETTINGS.dmAgent, ...(stored?.dmAgent || {}) },
    emailAgent: { ...DEFAULT_AGENT_SETTINGS.emailAgent, ...(stored?.emailAgent || {}) },
  };
};

// @route   GET /api/agent-settings
// @desc    Retrieve user's active settings for Lead Agent, DM Agent, and Email Agent
router.get('/', protect, async (req, res) => {
  try {
    const isDbConnected = getIsConnected();
    let userSettings = null;

    if (isDbConnected) {
      const user = await User.findById(req.user.id).select('agentSettings email name');
      userSettings = user?.agentSettings;
    } else {
      const store = getMemoryStore();
      const user = store.users?.find((u) => u.id === req.user.id || u._id === req.user.id);
      userSettings = user?.agentSettings;
    }

    const merged = mergeWithDefaults(userSettings);
    return res.json({ success: true, settings: merged });
  } catch (error) {
    logger.error('Error fetching agent settings', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve agent configuration' });
  }
});

// @route   PUT /api/agent-settings
// @desc    Update and persist settings for Lead Agent, DM Agent, or Email Agent
router.put('/', protect, async (req, res) => {
  const { leadAgent, dmAgent, emailAgent } = req.body;

  try {
    const isDbConnected = getIsConnected();
    let updatedUser = null;

    if (isDbConnected) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (!user.agentSettings) {
        user.agentSettings = DEFAULT_AGENT_SETTINGS;
      }

      if (leadAgent) {
        user.agentSettings.leadAgent = { ...user.agentSettings.leadAgent, ...leadAgent };
      }
      if (dmAgent) {
        user.agentSettings.dmAgent = { ...user.agentSettings.dmAgent, ...dmAgent };
      }
      if (emailAgent) {
        user.agentSettings.emailAgent = { ...user.agentSettings.emailAgent, ...emailAgent };
      }

      user.markModified('agentSettings');
      await user.save();
      updatedUser = user;
    } else {
      const store = getMemoryStore();
      const user = store.users?.find((u) => u.id === req.user.id || u._id === req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (!user.agentSettings) {
        user.agentSettings = JSON.parse(JSON.stringify(DEFAULT_AGENT_SETTINGS));
      }

      if (leadAgent) {
        user.agentSettings.leadAgent = { ...user.agentSettings.leadAgent, ...leadAgent };
      }
      if (dmAgent) {
        user.agentSettings.dmAgent = { ...user.agentSettings.dmAgent, ...dmAgent };
      }
      if (emailAgent) {
        user.agentSettings.emailAgent = { ...user.agentSettings.emailAgent, ...emailAgent };
      }
      updatedUser = user;
    }

    const merged = mergeWithDefaults(updatedUser.agentSettings);
    logger.info(`Agent settings updated successfully for user ${req.user.email}`);

    return res.json({
      success: true,
      message: 'Agent configuration settings saved successfully!',
      settings: merged,
    });
  } catch (error) {
    logger.error('Error updating agent settings', { error: error.message });
    return res.status(500).json({ error: 'Failed to update agent settings' });
  }
});

// @route   POST /api/agent-settings/reset
// @desc    Reset all agent settings back to default parameters
router.post('/reset', protect, async (req, res) => {
  try {
    const isDbConnected = getIsConnected();

    if (isDbConnected) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.agentSettings = DEFAULT_AGENT_SETTINGS;
        user.markModified('agentSettings');
        await user.save();
      }
    } else {
      const store = getMemoryStore();
      const user = store.users?.find((u) => u.id === req.user.id || u._id === req.user.id);
      if (user) {
        user.agentSettings = JSON.parse(JSON.stringify(DEFAULT_AGENT_SETTINGS));
      }
    }

    logger.info(`Agent settings reset to defaults for user ${req.user.email}`);
    return res.json({
      success: true,
      message: 'Agent settings reset to default values.',
      settings: DEFAULT_AGENT_SETTINGS,
    });
  } catch (error) {
    logger.error('Error resetting agent settings', { error: error.message });
    return res.status(500).json({ error: 'Failed to reset settings' });
  }
});

module.exports = router;
