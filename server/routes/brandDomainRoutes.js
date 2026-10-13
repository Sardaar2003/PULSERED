const express = require('express');
const router = express.Router();
const BrandDomain = require('../models/BrandDomain');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../logger');
const { callAiCompletion, getAiConfig } = require('../services/aiClient');

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

// @route   POST /api/brand-domains/generate-blueprint
// @desc    Generate AI Strategy Blueprint from Competitor, Pitch Brief, or Blueprint preset (URL-independent)
router.post('/generate-blueprint', protect, async (req, res) => {
  const { onboardingPathway = 'pitch_brief', competitors = '', pitchBrief = '', industryBlueprint = 'saas', domainUrl = '' } = req.body;
  const aiConfig = getAiConfig();
  try {
    if (aiConfig.provider !== 'none') {
      const systemPrompt = `You are a world-class Lead Discovery & Market Strategy AI. 
Generate a high-converting Reddit Lead Agent Strategy Blueprint based on the user's input.

CRITICAL RULE FOR SUBREDDITS:
- Ensure targetSubreddits strictly match the specific product category.
- For Consumer / Home Security / Hardware / Smart Home: output relevant consumer communities (e.g., "homesecurity", "homeautomation", "HomeImprovement", "RealEstate", "FirstTimeHomeBuyer"). NEVER include B2B SaaS subreddits like "SaaS" or "startups" for consumer home security products!
- For B2B SaaS / Business Tools: output subreddits like "SaaS", "startups", "Entrepreneur", "smallbusiness", "sales".
- For Developer Tools: output subreddits like "devops", "webdev", "programming", "sysadmin".

Return ONLY a valid JSON object matching this schema:
{
  "brandName": "<Inferred brand name or campaign title>",
  "specialization": "<1-2 sentence core value proposition>",
  "targetICP": "<1-2 sentence description of Ideal Customer Persona>",
  "targetSubreddits": ["<subreddit1>", "<subreddit2>", "<subreddit3>", "<subreddit4>"],
  "targetKeywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>", "<keyword6>"],
  "negativeKeywords": ["hiring", "job", "career", "free", "tutorial", "scam"],
  "buyingIntentTriggers": ["<trigger1>", "<trigger2>", "<trigger3>"],
  "confidenceScore": <integer between 75 and 98>
}`;

      let userContent = `Onboarding Pathway: ${onboardingPathway}\n`;
      if (domainUrl) userContent += `Website URL: ${domainUrl}\n`;
      if (competitors) userContent += `Competitors / Alternatives: ${competitors}\n`;
      if (pitchBrief) userContent += `Product Pitch / Brief: ${pitchBrief}\n`;
      if (industryBlueprint) userContent += `Industry Focus: ${industryBlueprint}\n`;

      const aiRes = await callAiCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        responseFormat: { type: 'json_object' },
        temperature: 0.2,
        timeout: 14000,
      });

      const contentText = aiRes.content || '';
      const cleanJson = contentText.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json({ blueprint: parsed });
    }
  } catch (err) {
    logger.warn('AI blueprint generation failed or timed out, using intelligent heuristic fallback:', { error: err.message });
  }

  // Intelligent Heuristic Fallback
  let brandName = 'Campaign Blueprint';
  let specialization = 'Targeted market lead generation and buyer intent discovery.';
  let targetICP = 'Decision makers, product switchers, and buyers actively asking for recommendations.';
  let targetSubreddits = ['SaaS', 'startups', 'Entrepreneur', 'smallbusiness'];
  let targetKeywords = ['best tool recommendation', 'looking for alternative', 'software recommendation', 'how to automate workflow'];
  let negativeKeywords = ['hiring', 'job', 'career', 'free', 'tutorial', 'scam', 'resume'];
  let buyingIntentTriggers = ['Requesting tool recommendations', 'Frustrated with current pricing', 'Seeking migration path from competitor'];
  let confidenceScore = 88;

  if (onboardingPathway === 'competitors' && competitors) {
    const compList = competitors.split(',').map(c => c.trim());
    const primaryComp = compList[0] || 'Competitors';
    brandName = `${primaryComp} Alternative Hunter`;
    specialization = `Identifying buyers frustrated with ${compList.join(', ')} looking for alternative solutions.`;
    targetICP = `Active users of ${primaryComp} seeking better pricing, features, or support.`;
    if (primaryComp.toLowerCase().includes('ring') || primaryComp.toLowerCase().includes('adt') || primaryComp.toLowerCase().includes('simplisafe')) {
      targetSubreddits = ['homesecurity', 'homeautomation', 'HomeImprovement', 'RealEstate'];
    }
    targetKeywords = [
      `${primaryComp.toLowerCase()} alternative`,
      `cancel ${primaryComp.toLowerCase()}`,
      `${primaryComp.toLowerCase()} too expensive`,
      `cheaper than ${primaryComp.toLowerCase()}`,
      `better than ${primaryComp.toLowerCase()}`,
      `switching from ${primaryComp.toLowerCase()}`
    ];
    buyingIntentTriggers = [
      `Complaining about ${primaryComp} price hikes`,
      `Asking for top alternatives to ${primaryComp}`,
      `Seeking replacement feature set`
    ];
    confidenceScore = 94;
  } else if (onboardingPathway === 'pitch_brief' && pitchBrief) {
    brandName = 'Custom Pitch Campaign';
    specialization = pitchBrief.length > 100 ? pitchBrief.substring(0, 100) + '...' : pitchBrief;
    if (pitchBrief.toLowerCase().includes('security') || pitchBrief.toLowerCase().includes('camera')) {
      targetSubreddits = ['homesecurity', 'homeautomation', 'HomeImprovement', 'RealEstate'];
      targetKeywords = ['affordable security cameras homeowners', 'home security system compare', 'best security system for my home', 'wireless doorbell'];
      targetICP = 'Homeowners and property managers prioritizing affordable, reliable security alerts.';
    } else if (pitchBrief.toLowerCase().includes('lead') || pitchBrief.toLowerCase().includes('outreach') || pitchBrief.toLowerCase().includes('crm')) {
      targetSubreddits = ['SaaS', 'startups', 'Entrepreneur', 'sales'];
      targetKeywords = ['looking for CRM recommendation', 'best lead outreach software', 'cold email automation tool', 'b2b lead generation tool'];
      targetICP = 'Founders, sales leads, and growth marketers looking to scale qualified pipeline.';
    } else {
      targetKeywords = [`${pitchBrief.split(' ')[0] || 'software'} recommendation`, 'best alternative', 'looking for tool recommendation'];
    }
    confidenceScore = 90;
  } else if (onboardingPathway === 'industry_blueprint') {
    if (industryBlueprint === 'devtools') {
      brandName = 'DevTools & Infrastructure';
      specialization = 'Developer tools, open-source alternatives, deployment automation, and CI/CD.';
      targetICP = 'DevOps engineers, CTOs, and developers seeking infrastructure optimization.';
      targetSubreddits = ['devops', 'webdev', 'programming', 'sysadmin'];
      targetKeywords = ['best CI CD tool', 'open source alternative to', 'kubernetes deployment issue', 'monitoring tool recommendation'];
    } else if (industryBlueprint === 'ecommerce') {
      brandName = 'E-Commerce Growth';
      specialization = 'Shopify apps, cart abandonment reduction, product sourcing, and ad automation.';
      targetICP = 'Shopify store owners, e-commerce brand founders, and digital marketers.';
      targetSubreddits = ['ecommerce', 'Shopify', 'digitalmarketing', 'FulfillmentByAmazon'];
      targetKeywords = ['best shopify app for conversions', 'reduce cart abandonment', 'ecommerce marketing tool', 'shopify theme customization'];
    }
  }

  return res.json({
    blueprint: {
      brandName,
      specialization,
      targetICP,
      targetSubreddits,
      targetKeywords,
      negativeKeywords,
      buyingIntentTriggers,
      confidenceScore,
    }
  });
});

// @route   POST /api/brand-domains
// @desc    Add a new brand domain to portfolio
router.post('/', protect, async (req, res) => {
  const userId = req.user.id;
  const { 
    domainUrl = 'Custom Profile', 
    brandName, 
    specialization, 
    targetSubreddits = [], 
    targetKeywords = [], 
    negativeKeywords = [],
    writingRules = [],
    hasWebsite = true,
    onboardingPathway = 'pitch_brief',
    competitors = [],
    targetICP = '',
    buyingIntentTriggers = [],
    confidenceScore = 85
  } = req.body;

  if (!brandName || !specialization) {
    return res.status(400).json({ error: 'brandName and specialization description are required' });
  }

  try {
    const isDbConnected = getIsConnected();
    const cleanDomainUrl = domainUrl ? domainUrl.replace(/^https?:\/\//, '') : 'Custom Profile';

    if (isDbConnected) {
      const newDomain = await BrandDomain.create({
        userId,
        domainUrl: cleanDomainUrl,
        brandName,
        specialization,
        targetSubreddits: Array.isArray(targetSubreddits) ? targetSubreddits : targetSubreddits.split(',').map(s => s.trim()),
        targetKeywords: Array.isArray(targetKeywords) ? targetKeywords : targetKeywords.split(',').map(k => k.trim()),
        negativeKeywords: Array.isArray(negativeKeywords) ? negativeKeywords : negativeKeywords.split(',').map(n => n.trim()),
        writingRules: Array.isArray(writingRules) ? writingRules : writingRules.split(',').map(r => r.trim()),
        hasWebsite: Boolean(hasWebsite),
        onboardingPathway,
        competitors: Array.isArray(competitors) ? competitors : competitors.split(',').map(c => c.trim()),
        targetICP,
        buyingIntentTriggers: Array.isArray(buyingIntentTriggers) ? buyingIntentTriggers : buyingIntentTriggers.split(',').map(t => t.trim()),
        confidenceScore: Number(confidenceScore) || 85,
      });
      return res.status(201).json({ message: 'Brand profile added to portfolio', domain: newDomain });
    } else {
      return res.status(201).json({
        message: 'Brand profile added',
        domain: {
          id: `bd_${Date.now()}`,
          userId,
          domainUrl: cleanDomainUrl,
          brandName,
          specialization,
          targetSubreddits,
          targetKeywords,
          negativeKeywords,
          writingRules,
          hasWebsite,
          onboardingPathway,
          competitors,
          targetICP,
          buyingIntentTriggers,
          confidenceScore,
        },
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
  const { 
    domainUrl, 
    brandName, 
    specialization, 
    targetSubreddits, 
    targetKeywords, 
    negativeKeywords,
    writingRules,
    hasWebsite,
    onboardingPathway,
    competitors,
    targetICP,
    buyingIntentTriggers,
    confidenceScore
  } = req.body;

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const updateData = {};
      if (domainUrl !== undefined) updateData.domainUrl = domainUrl.replace(/^https?:\/\//, '');
      if (brandName !== undefined) updateData.brandName = brandName;
      if (specialization !== undefined) updateData.specialization = specialization;
      if (targetSubreddits !== undefined) updateData.targetSubreddits = Array.isArray(targetSubreddits) ? targetSubreddits : targetSubreddits.split(',').map(s => s.trim());
      if (targetKeywords !== undefined) updateData.targetKeywords = Array.isArray(targetKeywords) ? targetKeywords : targetKeywords.split(',').map(k => k.trim());
      if (negativeKeywords !== undefined) updateData.negativeKeywords = Array.isArray(negativeKeywords) ? negativeKeywords : negativeKeywords.split(',').map(n => n.trim());
      if (writingRules !== undefined) updateData.writingRules = Array.isArray(writingRules) ? writingRules : writingRules.split(',').map(r => r.trim());
      if (hasWebsite !== undefined) updateData.hasWebsite = hasWebsite;
      if (onboardingPathway !== undefined) updateData.onboardingPathway = onboardingPathway;
      if (competitors !== undefined) updateData.competitors = Array.isArray(competitors) ? competitors : competitors.split(',').map(c => c.trim());
      if (targetICP !== undefined) updateData.targetICP = targetICP;
      if (buyingIntentTriggers !== undefined) updateData.buyingIntentTriggers = Array.isArray(buyingIntentTriggers) ? buyingIntentTriggers : buyingIntentTriggers.split(',').map(t => t.trim());
      if (confidenceScore !== undefined) updateData.confidenceScore = confidenceScore;

      const updated = await BrandDomain.findOneAndUpdate({ _id: id, userId }, updateData, { new: true });
      return res.json({ message: 'Brand domain updated', domain: updated });
    } else {
      return res.json({
        message: 'Brand domain updated',
        domain: { id, userId, domainUrl, brandName, specialization, targetSubreddits, targetKeywords, negativeKeywords, writingRules, hasWebsite, onboardingPathway, competitors, targetICP, buyingIntentTriggers, confidenceScore },
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
