const mongoose = require('mongoose');

const outreachLeadSchema = new mongoose.Schema({
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
  subreddit: {
    type: String,
    default: 'Reddit',
  },
  author: {
    type: String,
    default: 'Reddit User',
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
    default: 75,
  },
  intentBadge: {
    type: String,
    default: 'High Buying Intent',
  },
  extractedPainPoint: {
    type: String,
    default: '',
  },
  productFitRationale: {
    type: String,
    default: '',
  },
  writingStrategy: {
    type: String,
    default: '',
  },
  draftReply: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'posted', 'dismissed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  postedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('OutreachLead', outreachLeadSchema);
