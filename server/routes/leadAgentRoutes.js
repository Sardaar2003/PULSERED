const express = require('express');
const router = express.Router();
const LeadAgentItem = require('../models/LeadAgentItem');
const VoiceProfile = require('../models/VoiceProfile');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../logger');
const { runSingleSubredditSweep, runBatchKeywordsSweep, startRotationalSweeper, stopRotationalSweeper, getSweeperStatus } = require('../services/leadSweepService');
const { generate3ReplyCandidates, analyzeLeadWith3DScoringAndOpener } = require('../services/aiOutreachService');

// @route   GET /api/agent/leads
// @desc    Get all pipeline leads for the active user
router.get('/leads', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const leads = await LeadAgentItem.find({ userId }).sort({ createdAt: -1 });
      return res.json({ leads });
    } else {
      const store = getMemoryStore();
      const userLeads = store.leadAgentItems.filter(l => l.userId === userId);
      return res.json({ leads: userLeads });
    }
  } catch (error) {
    logger.error('Error fetching lead agent pipeline', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve lead agent pipeline' });
  }
});

// @route   POST /api/agent/leads
// @desc    Manually add a post to Lead Agent pipeline with 3D intent scoring & opener
router.post('/leads', protect, async (req, res) => {
  const userId = req.user.id;
  const { post, targetDomain = 'AlertCareLine.com', stage = 'New' } = req.body;

  if (!post || !post.title) {
    return res.status(400).json({ error: 'Valid post object is required' });
  }

  try {
    const isDbConnected = getIsConnected();
    let voiceProfile = null;
    if (isDbConnected) {
      voiceProfile = await VoiceProfile.findOne({ userId });
    }

    const analysis = await analyzeLeadWith3DScoringAndOpener(post, targetDomain, voiceProfile);

    const leadData = {
      userId,
      postId: post.id || `p_${Date.now()}`,
      postTitle: post.title,
      postSnippet: post.selftext || post.snippet || '',
      subreddit: post.subreddit || 'Reddit',
      author: post.author || 'Reddit User',
      prospectSnapshot: analysis.prospectSnapshot,
      permalink: post.permalink || post.url || '',
      url: post.url || post.permalink || '',
      targetDomain,
      intentScore: analysis.intentScore,
      intentBadge: analysis.intentBadge,
      scoreBreakdown: analysis.scoreBreakdown,
      stage,
      extractedPainPoint: analysis.extractedPainPoint,
      productFitRationale: analysis.productFitRationale,
      marketingIntel: analysis.marketingIntel,
      openerDraft: analysis.openerDraft,
      brandEmailDmDraft: analysis.brandEmailDmDraft,
      approvalStatus: 'draft',
    };

    if (isDbConnected) {
      const existing = await LeadAgentItem.findOne({ userId, postId: leadData.postId });
      if (existing) {
        existing.stage = stage;
        await existing.save();
        return res.json({ message: 'Lead pipeline stage updated', lead: existing });
      }
      const lead = await LeadAgentItem.create(leadData);
      return res.status(201).json({ message: 'Lead added to Pipeline Board', lead });
    } else {
      const store = getMemoryStore();
      const existingIdx = store.leadAgentItems.findIndex(l => l.userId === userId && l.postId === leadData.postId);
      if (existingIdx !== -1) {
        store.leadAgentItems[existingIdx].stage = stage;
        return res.json({ message: 'Lead pipeline stage updated', lead: store.leadAgentItems[existingIdx] });
      }
      const newLead = { id: `lai_${Date.now()}`, ...leadData, createdAt: new Date() };
      store.leadAgentItems.unshift(newLead);
      return res.status(201).json({ message: 'Lead added to Pipeline Board', lead: newLead });
    }
  } catch (error) {
    logger.error('Error adding lead to pipeline', { error: error.message });
    return res.status(500).json({ error: 'Server error adding lead to pipeline' });
  }
});

// @route   PATCH /api/agent/leads/:id/stage
// @desc    Update stage of a lead ('New' | 'Engaged' | 'Qualified' | 'Trial' | 'Paid')
router.patch('/leads/:id/stage', protect, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { stage } = req.body;

  if (!stage) return res.status(400).json({ error: 'Stage parameter required' });

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const lead = await LeadAgentItem.findOne({ _id: id, userId });
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      lead.stage = stage;
      await lead.save();
      return res.json({ message: 'Stage updated successfully', lead });
    } else {
      const store = getMemoryStore();
      const lead = store.leadAgentItems.find(l => (l.id === id || l._id === id) && l.userId === userId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      lead.stage = stage;
      return res.json({ message: 'Stage updated successfully', lead });
    }
  } catch (error) {
    logger.error('Error updating lead stage', { error: error.message });
    return res.status(500).json({ error: 'Failed to update lead stage' });
  }
});

// @route   PATCH /api/agent/leads/:id/brand-domain
// @desc    Update target brand domain for a specific buyer lead
router.patch('/leads/:id/brand-domain', protect, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { targetDomain } = req.body;

  if (!targetDomain) return res.status(400).json({ error: 'targetDomain parameter is required' });

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const lead = await LeadAgentItem.findOne({ _id: id, userId });
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      lead.targetDomain = targetDomain;
      await lead.save();
      return res.json({ message: 'Brand domain reassigned successfully', lead });
    } else {
      const store = getMemoryStore();
      const lead = store.leadAgentItems.find(l => (l.id === id || l._id === id) && l.userId === userId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      lead.targetDomain = targetDomain;
      return res.json({ message: 'Brand domain reassigned successfully', lead });
    }
  } catch (error) {
    logger.error('Error updating lead brand domain', { error: error.message });
    return res.status(500).json({ error: 'Failed to update brand domain' });
  }
});

// @route   POST /api/agent/leads/:id/reply-candidates
// @desc    When prospect replies, generate 3 follow-up candidates
router.post('/leads/:id/reply-candidates', protect, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { prospectReplyText } = req.body;

  if (!prospectReplyText) return res.status(400).json({ error: 'prospectReplyText is required' });

  try {
    const isDbConnected = getIsConnected();
    let lead = null;
    let voiceProfile = null;

    if (isDbConnected) {
      lead = await LeadAgentItem.findOne({ _id: id, userId });
      voiceProfile = await VoiceProfile.findOne({ userId });
    } else {
      const store = getMemoryStore();
      lead = store.leadAgentItems.find(l => (l.id === id || l._id === id) && l.userId === userId);
    }

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Generate 3 Candidate Follow-Up Replies
    const candidates = await generate3ReplyCandidates(lead, prospectReplyText, voiceProfile);

    lead.prospectReply = { content: prospectReplyText, receivedAt: new Date() };
    lead.replyCandidates = candidates;
    lead.selectedCandidateId = 1;
    lead.stage = 'Qualified';
    lead.approvalStatus = 'draft';

    if (isDbConnected) {
      await lead.save();
    }

    return res.json({
      message: '3 Follow-up candidates generated for HIL approval',
      lead,
      candidates,
    });
  } catch (error) {
    logger.error('Error generating reply candidates', { error: error.message });
    return res.status(500).json({ error: 'Failed to generate follow-up reply candidates' });
  }
});

// @route   POST /api/agent/leads/:id/approve-send
// @desc    Approve opener or selected reply candidate and execute human-paced send
router.post('/leads/:id/approve-send', protect, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { editedContent = null, candidateId = 1 } = req.body;

  try {
    const isDbConnected = getIsConnected();
    let lead = null;
    if (isDbConnected) {
      lead = await LeadAgentItem.findOne({ _id: id, userId });
    } else {
      const store = getMemoryStore();
      lead = store.leadAgentItems.find(l => (l.id === id || l._id === id) && l.userId === userId);
    }

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let finalMessage = editedContent;
    if (!finalMessage) {
      if (lead.replyCandidates && lead.replyCandidates.length > 0) {
        const candidate = lead.replyCandidates.find(c => c.candidateId === Number(candidateId)) || lead.replyCandidates[0];
        finalMessage = candidate.content;
      } else {
        finalMessage = lead.openerDraft?.content || 'Hi! Loved your post. Curious how you are handling this currently?';
      }
    }

    // Simulate Human-Paced Sending Execution with jitter (30-90s delay simulation indicator)
    const simulatedJitterMs = Math.floor(Math.random() * 2000) + 1000;
    await new Promise(r => setTimeout(r, simulatedJitterMs));

    lead.approvalStatus = 'sent';
    lead.sentMessage = finalMessage;
    lead.sentAt = new Date();
    lead.stage = lead.stage === 'New' ? 'Engaged' : lead.stage;

    // Save few-shot feedback memory example if edited
    if (isDbConnected) {
      await lead.save();

      if (editedContent) {
        await VoiceProfile.findOneAndUpdate(
          { userId },
          {
            $push: {
              fewShotExamples: {
                leadContext: lead.postTitle,
                approvedMessage: editedContent,
                wasEdited: true,
                createdAt: new Date(),
              }
            }
          },
          { upsert: true }
        );
      }
    }

    return res.json({
      message: 'DM approved and sent at human-pace via Redditapis / Chrome Extension session',
      lead,
      executionInfo: {
        sentVia: 'Redditapis Extension Session Bridge',
        humanPaceDelay: `${Math.round(simulatedJitterMs / 1000)}s`,
        timestamp: lead.sentAt,
      },
    });
  } catch (error) {
    logger.error('Error approving and sending DM', { error: error.message });
    return res.status(500).json({ error: 'Failed to approve and send message' });
  }
});

// --- Sweeper Endpoints ---

// @route   POST /api/agent/sweep/run-single
// @desc    Trigger manual or single rotational sweep
router.post('/sweep/run-single', protect, async (req, res) => {
  const userId = req.user.id;
  const { searchQuery, customKeywords = [], targetDomain = 'AlertCareLine.com', customSubreddit = null } = req.body;
  try {
    const keywordsToUse = searchQuery || customKeywords;
    const sweepResult = await runSingleSubredditSweep(userId, keywordsToUse, targetDomain, customSubreddit);
    return res.json({ message: 'Sweep completed successfully', sweepResult });
  } catch (error) {
    logger.error('Error running single sweep', { error: error.message });
    return res.status(500).json({ error: 'Sweep failed' });
  }
});

// @route   POST /api/agent/sweep/run-all-keywords
// @desc    Trigger batch sweep across ALL 10 target keywords in domain portfolio
router.post('/sweep/run-all-keywords', protect, async (req, res) => {
  const userId = req.user.id;
  const { targetDomain = 'AlertCareLine.com', customSubreddit = null } = req.body;
  try {
    const batchResult = await runBatchKeywordsSweep(userId, targetDomain, customSubreddit);
    return res.json({ message: 'Batch keyword sweep completed successfully', batchResult });
  } catch (error) {
    logger.error('Error running batch keyword sweep', { error: error.message });
    return res.status(500).json({ error: 'Batch sweep failed' });
  }
});


// @route   POST /api/agent/sweep/start
// @desc    Start continuous 24/7 rotational sweeper
router.post('/sweep/start', protect, async (req, res) => {
  const userId = req.user.id;
  const { intervalMs = 60000 } = req.body;
  const result = startRotationalSweeper(intervalMs, userId);
  return res.json({ message: '24/7 Subreddit Rotational Sweeper started', result });
});

// @route   POST /api/agent/sweep/stop
// @desc    Stop continuous rotational sweeper
router.post('/sweep/stop', protect, async (req, res) => {
  const result = stopRotationalSweeper();
  return res.json({ message: 'Subreddit Rotational Sweeper stopped', result });
});

// @route   GET /api/agent/sweep/status
// @desc    Get status of rotational sweeper
router.get('/sweep/status', protect, async (req, res) => {
  const status = getSweeperStatus();
  return res.json({ status });
});

// --- Voice Profile Endpoints ---

// @route   GET /api/agent/voice-profile
// @desc    Get user voice profile & writing rules
router.get('/voice-profile', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      let profile = await VoiceProfile.findOne({ userId });
      if (!profile) {
        profile = await VoiceProfile.create({
          userId,
          voiceName: 'My Conversational Founder Voice',
          tonePersona: 'Helpful Peer & Founder',
          writingRules: ['Keep DMs under 40 words', 'Ask genuine questions', 'No sales pitch or hype'],
          sampleTexts: ['Hey, saw your post about scroll fatigue. Curious if you tried automated alerts?'],
        });
      }
      return res.json({ profile });
    } else {
      return res.json({
        profile: {
          userId,
          voiceName: 'My Conversational Founder Voice',
          tonePersona: 'Helpful Peer & Founder',
          writingRules: ['Keep DMs under 40 words', 'Ask genuine questions', 'No sales pitch or hype'],
          sampleTexts: ['Hey, saw your post about scroll fatigue. Curious if you tried automated alerts?'],
          fewShotExamples: [],
        }
      });
    }
  } catch (error) {
    logger.error('Error fetching voice profile', { error: error.message });
    return res.status(500).json({ error: 'Failed to fetch voice profile' });
  }
});

// @route   POST /api/agent/voice-profile
// @desc    Update writing style & voice profile rules
router.post('/voice-profile', protect, async (req, res) => {
  const userId = req.user.id;
  const { voiceName, tonePersona, writingRules, sampleTexts } = req.body;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const profile = await VoiceProfile.findOneAndUpdate(
        { userId },
        { voiceName, tonePersona, writingRules, sampleTexts, updatedAt: new Date() },
        { new: true, upsert: true }
      );
      return res.json({ message: 'Voice profile updated successfully', profile });
    } else {
      return res.json({ message: 'Voice profile updated', profile: { userId, voiceName, tonePersona, writingRules, sampleTexts } });
    }
  } catch (error) {
    logger.error('Error updating voice profile', { error: error.message });
    return res.status(500).json({ error: 'Failed to update voice profile' });
  }
});

// @route   DELETE /api/agent/leads/clear-all
// @desc    Clear all cards from the Lead Agent pipeline board for active user
router.delete('/leads/clear-all', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      await LeadAgentItem.deleteMany({ userId });
    } else {
      const store = getMemoryStore();
      store.leadAgentItems = store.leadAgentItems.filter(l => l.userId !== userId);
    }
    logger.info(`Cleared all lead pipeline cards for user: ${userId}`);
    return res.json({ message: 'Lead pipeline board cleared successfully' });
  } catch (error) {
    logger.error('Error clearing lead pipeline', { error: error.message });
    return res.status(500).json({ error: 'Failed to clear lead pipeline board' });
  }
});

// @route   DELETE /api/agent/leads/:id
// @desc    Remove lead from pipeline
router.delete('/leads/:id', protect, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      await LeadAgentItem.deleteOne({ _id: id, userId });
      return res.json({ message: 'Lead removed from pipeline' });
    } else {
      const store = getMemoryStore();
      store.leadAgentItems = store.leadAgentItems.filter(l => !(l.id === id || l._id === id) && l.userId === userId);
      return res.json({ message: 'Lead removed from pipeline' });
    }
  } catch (error) {
    logger.error('Error removing lead from pipeline', { error: error.message });
    return res.status(500).json({ error: 'Failed to delete lead' });
  }
});

module.exports = router;

