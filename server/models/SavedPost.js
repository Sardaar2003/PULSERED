const mongoose = require('mongoose');

const savedPostSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  postId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subreddit: String,
  author: String,
  score: Number,
  numComments: Number,
  url: String,
  permalink: String,
  selftext: String,
  sentiment: String,
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SavedPost', savedPostSchema);
