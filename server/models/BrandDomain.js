const mongoose = require('mongoose');

const brandDomainSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  domainUrl: {
    type: String,
    required: true,
  },
  brandName: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true, // Description of what the product/service specializes in
  },
  targetSubreddits: [
    { type: String }
  ],
  targetKeywords: [
    { type: String }
  ],
  negativeKeywords: [
    { type: String }
  ],
  writingRules: [
    { type: String }
  ],
  hasWebsite: {
    type: Boolean,
    default: true,
  },
  onboardingPathway: {
    type: String,
    enum: ['website_url', 'competitors', 'pitch_brief', 'industry_blueprint'],
    default: 'website_url',
  },
  competitors: [
    { type: String }
  ],
  targetICP: {
    type: String,
  },
  buyingIntentTriggers: [
    { type: String }
  ],
  confidenceScore: {
    type: Number,
    default: 85,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('BrandDomain', brandDomainSchema);
