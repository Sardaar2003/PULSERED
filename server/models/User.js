const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  activeSessionId: {
    type: String,
    default: null,
  },
  prowloApiKey: {
    type: String,
    default: '',
  },
  openaiApiKey: {
    type: String,
    default: '',
  },
  redditClientId: {
    type: String,
    default: '',
  },
  redditClientSecret: {
    type: String,
    default: '',
  },
  redditAccount: {
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    totpSecret: { type: String, default: '' },
    proxy: { type: String, default: '' },
    method: { type: String, default: 'browser' },
    linkKarma: { type: Number, default: 0 },
    commentKarma: { type: Number, default: 0 },
    cookies: { type: Object, default: null },
    isConnected: { type: Boolean, default: false },
    lastConnectedAt: { type: Date, default: null },
    lastError: { type: String, default: '' },
  },
  agentSettings: {
    leadAgent: {
      searchDepth: { type: Number, default: 15 },
      targetAudience: { type: String, default: 'both' }, // 'both' | 'authors' | 'commenters'
      minIntentScore: { type: Number, default: 65 },
      deduplicateSeen: { type: Boolean, default: true },
      scanComments: { type: Boolean, default: true },
      aiModel: { type: String, default: 'google/gemini-2.0-flash-001' },
      defaultSubreddit: { type: String, default: 'all' },
    },
    dmAgent: {
      defaultTone: { type: String, default: 'warm_peer' }, // 'warm_peer' | 'value_advisor' | 'solution_consultant'
      maxWords: { type: Number, default: 110 },
      requireApproval: { type: Boolean, default: true },
      customInstructions: { type: String, default: 'Avoid marketing speak, sound like a helpful peer engineer.' },
      dailyLimit: { type: Number, default: 25 },
      dispatchMethod: { type: String, default: 'reddit_api' },
    },
    emailAgent: {
      smtpHost: { type: String, default: '' },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: '' },
      smtpPass: { type: String, default: '' },
      smtpFrom: { type: String, default: '' },
      fromName: { type: String, default: 'PulseRed Outreach' },
      defaultAngle: { type: String, default: 'founder_peer' },
      deliveryMode: { type: String, default: 'simulated_delivery' }, // 'live_smtp' | 'simulated_delivery'
      requireApproval: { type: Boolean, default: true },
      customInstructions: { type: String, default: 'Highlight transparent pricing and zero lock-in contracts.' },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
