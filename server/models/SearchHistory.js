const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  keyword: {
    type: String,
    required: true,
  },
  resultsCount: {
    type: Number,
    default: 0,
  },
  subreddits: [String],
  searchedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
