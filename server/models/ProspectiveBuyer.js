const mongoose = require('mongoose');

const prospectiveBuyerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  redditUsername: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subreddit: {
    type: String,
    default: 'Reddit',
  },
  sourcePostTitle: {
    type: String,
    default: '',
  },
  painPoint: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Captured', 'Email Drafted', 'Contacted', 'Converted'],
    default: 'Captured',
  },
  emailSubject: {
    type: String,
    default: '',
  },
  emailBody: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ProspectiveBuyer', prospectiveBuyerSchema);
