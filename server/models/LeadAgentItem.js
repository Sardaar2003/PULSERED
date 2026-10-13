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
    enum: [
      'New Leads',
      'Qualified',
      'Outreach Drafted',
      'Engaged / Replied',
      'Converted / Closed',
      'New',
      'Engaged',
      'Trial',
      'Paid',
    ],
    default: 'New Leads',
  },
  psychologicalProfile: {
    archetype: { type: String, default: 'Pragmatic Buyer' },
    emotionalMindset: { type: String, default: 'Seeking reliable solution with transparent terms' },
    corePainPoint: { type: String, default: '' },
    whatIsImportant: [{ type: String }],
    decisionDrivers: { type: String, default: 'Cost efficiency, reliability, and ease of deployment' },
    riskLevel: { type: String, default: 'Low Risk' },
  },
  isSolvedOrAnswered: {
    type: Boolean,
    default: false,
  },
  solvedEvidence: {
    type: String,
    default: '',
  },
  threadCommentCount: {
    type: Number,
    default: 0,
  },
  disqualified: {
    type: Boolean,
    default: false,
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
  // --- Marketer 360° Prospect Behavioral Audit (Do's & Don'ts) ---
  prospectBehavioralAudit: {
    prospectTone: { type: String, default: 'Direct & Pragmatic' },
    buyerExpectation: { type: String, default: 'Seeks technical validation and fast ROI' },
    doList: [{ type: String }],
    dontList: [{ type: String }],
    bestApproachPitch: { type: String, default: '' },
    riskLevel: { type: String, default: 'Low Risk' },
    userHistorySummary: { type: String, default: '' },
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
  // --- Multi-turn WhatsApp-style Conversation History ---
  conversation: [
    {
      messageId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      sender: { type: String, enum: ['lead', 'user', 'agent'], required: true },
      channel: { type: String, enum: ['reddit_dm', 'email'], default: 'reddit_dm' },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      status: { type: String, enum: ['sent', 'delivered', 'read', 'pending_approval'], default: 'delivered' },
      aiSuggestedReply: { type: String, default: '' },
      aiStrategyRationale: { type: String, default: '' },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LeadAgentItem', leadAgentItemSchema);

