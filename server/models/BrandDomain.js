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
  writingRules: [
    { type: String }
  ],
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
