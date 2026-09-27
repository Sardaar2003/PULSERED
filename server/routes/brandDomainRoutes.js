const express = require('express');
const router = express.Router();
const BrandDomain = require('../models/BrandDomain');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../logger');

// @route   GET /api/brand-domains
// @desc    Get all brand domains in user's portfolio
router.get('/', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      let domains = await BrandDomain.find({ userId }).sort({ createdAt: -1 });
      if (domains.length === 0) {
        // Seed default domain portfolio
        domains = await BrandDomain.create([
          {
            userId,
            domainUrl: 'AlertCareLine.com',
            brandName: 'Alert Care Line',
            specialization: 'Automated home security, camera alerts, and 24/7 emergency response systems.',
            targetSubreddits: ['homesecurity', 'homeautomation', 'SaaS'],
            targetKeywords: [
              'affordable security cameras homeowners',
              'home security system compare',
              'home security for new homeowner',
              'wireless doorbell',
              'someone broke into my car',
              'cheapest home security system for home',
              'adt alternatives',
              'neighborhood break-in',
              'best security system for my home',
              'ring doorbell not working'
            ],
            writingRules: ['Tone: Empathetic & reassure safety', 'No high-pressure sales'],
            isDefault: true,
          },
          {
            userId,
            domainUrl: 'OneUpOutreach.com',
            brandName: 'OneUp Outreach',
            specialization: 'AI Lead Generation agent for Reddit & social community buyer discovery.',
            targetSubreddits: ['SaaS', 'startups', 'Entrepreneur', 'smallbusiness'],
            targetKeywords: [
              'looking for CRM recommendation',
              'best lead outreach software',
              'small business automation tool',
              'looking for software tool recommendation'
            ],
            writingRules: ['Tone: Founder-to-founder', 'Keep DMs under 40 words'],
            isDefault: false,
          },
        ]);
      } else {
        // Ensure AlertCareLine.com has targetKeywords populated if missing
        const alertCare = domains.find(d => d.domainUrl === 'AlertCareLine.com');
        if (alertCare && (!alertCare.targetKeywords || alertCare.targetKeywords.length === 0)) {
          alertCare.targetKeywords = [
            'affordable security cameras homeowners',
            'home security system compare',
            'home security for new homeowner',
            'wireless doorbell',
            'someone broke into my car',
            'cheapest home security system for home',
            'adt alternatives',
            'neighborhood break-in',
            'best security system for my home',
            'ring doorbell not working'
          ];
          await alertCare.save();
        }
      }
      return res.json({ domains });
    } else {
      return res.json({
        domains: [
          {
            _id: 'bd_1',
            userId,
            domainUrl: 'AlertCareLine.com',
            brandName: 'Alert Care Line',
            specialization: 'Automated home security, camera alerts, and 24/7 emergency response systems.',
            targetSubreddits: ['homesecurity', 'homeautomation', 'SaaS'],
            targetKeywords: [
              'affordable security cameras homeowners',
              'home security system compare',
              'home security for new homeowner',
              'wireless doorbell',
              'someone broke into my car',
              'cheapest home security system for home',
              'adt alternatives',
              'neighborhood break-in',
              'best security system for my home',
              'ring doorbell not working'
            ],
            writingRules: ['Tone: Empathetic & reassure safety'],
            isDefault: true,
          },
          {
            _id: 'bd_2',
            userId,
            domainUrl: 'OneUpOutreach.com',
            brandName: 'OneUp Outreach',
            specialization: 'AI Lead Generation agent for Reddit & social community buyer discovery.',
            targetSubreddits: ['SaaS', 'startups', 'Entrepreneur', 'smallbusiness'],
            targetKeywords: [
              'looking for CRM recommendation',
              'best lead outreach software',
              'small business automation tool',
              'looking for software tool recommendation'
            ],
            writingRules: ['Tone: Founder-to-founder'],
            isDefault: false,
          },
        ]
      });
    }
  } catch (error) {
    logger.error('Error fetching brand domains:', { error: error.message });
    return res.status(500).json({ error: 'Failed to fetch brand domains portfolio' });
  }
});

// @route   POST /api/brand-domains
// @desc    Add a new brand domain to portfolio
router.post('/', protect, async (req, res) => {
  const userId = req.user.id;
  const { domainUrl, brandName, specialization, targetSubreddits = [], targetKeywords = [], writingRules = [] } = req.body;

  if (!domainUrl || !brandName || !specialization) {
    return res.status(400).json({ error: 'domainUrl, brandName, and specialization description are required' });
  }

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const newDomain = await BrandDomain.create({
        userId,
        domainUrl: domainUrl.replace(/^https?:\/\//, ''),
        brandName,
        specialization,
        targetSubreddits: Array.isArray(targetSubreddits) ? targetSubreddits : targetSubreddits.split(',').map(s => s.trim()),
        targetKeywords: Array.isArray(targetKeywords) ? targetKeywords : targetKeywords.split(',').map(k => k.trim()),
        writingRules: Array.isArray(writingRules) ? writingRules : writingRules.split(',').map(r => r.trim()),
      });
      return res.status(201).json({ message: 'Brand domain added to portfolio', domain: newDomain });
    } else {
      return res.status(201).json({
        message: 'Brand domain added',
        domain: { id: `bd_${Date.now()}`, userId, domainUrl, brandName, specialization, targetSubreddits, targetKeywords, writingRules },
      });
    }
  } catch (error) {
    logger.error('Error adding brand domain:', { error: error.message });
    return res.status(500).json({ error: 'Failed to add brand domain' });
  }
});

// @route   PUT /api/brand-domains/:id
// @desc    Update an existing brand domain in portfolio
router.put('/:id', protect, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { domainUrl, brandName, specialization, targetSubreddits, targetKeywords, writingRules } = req.body;

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const updateData = {};
      if (domainUrl) updateData.domainUrl = domainUrl.replace(/^https?:\/\//, '');
      if (brandName) updateData.brandName = brandName;
      if (specialization) updateData.specialization = specialization;
      if (targetSubreddits) updateData.targetSubreddits = Array.isArray(targetSubreddits) ? targetSubreddits : targetSubreddits.split(',').map(s => s.trim());
      if (targetKeywords) updateData.targetKeywords = Array.isArray(targetKeywords) ? targetKeywords : targetKeywords.split(',').map(k => k.trim());
      if (writingRules) updateData.writingRules = Array.isArray(writingRules) ? writingRules : writingRules.split(',').map(r => r.trim());

      const updated = await BrandDomain.findOneAndUpdate({ _id: id, userId }, updateData, { new: true });
      return res.json({ message: 'Brand domain updated', domain: updated });
    } else {
      return res.json({
        message: 'Brand domain updated',
        domain: { id, userId, domainUrl, brandName, specialization, targetSubreddits, targetKeywords, writingRules },
      });
    }
  } catch (error) {
    logger.error('Error updating brand domain:', { error: error.message });
    return res.status(500).json({ error: 'Failed to update brand domain' });
  }
});

// @route   DELETE /api/brand-domains/:id
// @desc    Remove brand domain from portfolio
router.delete('/:id', protect, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      await BrandDomain.deleteOne({ _id: id, userId });
    }
    return res.json({ message: 'Brand domain removed' });
  } catch (error) {
    logger.error('Error deleting brand domain:', { error: error.message });
    return res.status(500).json({ error: 'Failed to remove brand domain' });
  }
});

module.exports = router;
