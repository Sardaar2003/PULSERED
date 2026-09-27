const mongoose = require('mongoose');

const leadAgentItemSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  postId: {
    type: String,
    required: true,
  },
  postTitle: {
    type: String,
    required: true,
  },
  postSnippet: {
    type: String,
    default: '',
  },
  leadOrigin: {
    type: String,
    enum: ['post_author', 'thread_commenter'],
    default: 'post_author',
  },
  commentQuote: {
    type: String,
    default: '',
  },
  commentId: {
    type: String,
    default: '',
  },
  subreddit: {
    type: String,
    default: 'Reddit',
  },
  author: {
    type: String,
    default: 'Reddit User',
  },
  prospectSnapshot: {
    karma: { type: Number, default: 1250 },
    accountAgeDays: { type: Number, default: 340 },
    recentActivity: { type: String, default: 'Active poster in SaaS & startups' },
  },
  permalink: {
    type: String,
    default: '',
  },
  url: {
    type: String,
    default: '',
  },
  targetDomain: {
    type: String,
    default: 'AlertCareLine.com',
  },
  intentScore: {
    type: Number,
    default: 85,
  },
  intentBadge: {
    type: String,
    default: '🔥 High Buying Intent',
  },
  scoreBreakdown: {
    problemFit: { type: Number, default: 88 },
    audienceFit: { type: Number, default: 82 },
    urgency: { type: Number, default: 85 },
  },
  stage: {
    type: String,
    enum: ['New', 'Engaged', 'Qualified', 'Trial', 'Paid'],
    default: 'New',
  },
  extractedPainPoint: {
    type: String,
    default: '',
  },
  productFitRationale: {
    type: String,
    default: '',
  },
  marketingIntel: {
    buyerStage: { type: String, default: 'Consideration' },
    competitorVulnerabilities: [{ type: String }],
    positioningPitch: { type: String, default: '' },
    adContentHook: { type: String, default: '' },
  },
  // --- Messaging Agent (HIL) Fields ---
  openerDraft: {
    content: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },
    voiceMatchScore: { type: Number, default: 92 },
    rationale: { type: String, default: '' },
  },
  brandEmailDmDraft: {
    content: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },
    contactEmail: { type: String, default: '' },
    rationale: { type: String, default: '' },
  },
  prospectReply: {
    content: { type: String, default: '' },
    receivedAt: { type: Date, default: null },
  },
  replyCandidates: [
    {
      candidateId: { type: Number, required: true },
      content: { type: String, required: true },
      wordCount: { type: Number, default: 0 },
      qualityScore: { type: Number, default: 85 },
      voiceMatchScore: { type: Number, default: 90 },
      strategyRationale: { type: String, default: '' },
    },
  ],
  selectedCandidateId: {
    type: Number,
    default: 1,
  },
  approvalStatus: {
    type: String,
    enum: ['draft', 'approved', 'rejected', 'sent'],
    default: 'draft',
  },
  sentMessage: {
    type: String,
    default: '',
  },
  sentAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LeadAgentItem', leadAgentItemSchema);

