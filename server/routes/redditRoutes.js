const express = require('express');
const router = express.Router();
const { fetchRedditDataViaProwlo } = require('../services/prowloService');
const SearchHistory = require('../models/SearchHistory');
const SavedPost = require('../models/SavedPost');
const User = require('../models/User');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../logger');

// @route   GET /api/reddit/search
// @desc    Get Reddit data for keyword with pagination support
router.get('/search', protect, async (req, res) => {
  const { q, page = 1, limit = 6, mode = 'keyword', timeFrame = 'all', sentiment = 'all', sortBy = 'relevance' } = req.query;

  if (!q || !q.trim()) {
    logger.warn('Search query rejected: Empty search keyword provided');
    return res.status(400).json({ error: 'Search keyword is required' });
  }

  const keyword = q.trim();
  const userId = req.user.id;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 6;

  try {
    const isDbConnected = getIsConnected();
    let userProwloKey = null;

    if (isDbConnected) {
      const user = await User.findById(userId);
      if (user && user.prowloApiKey) {
        userProwloKey = user.prowloApiKey;
      }
    } else {
      const store = getMemoryStore();
      const user = store.users.find((u) => u.id === userId);
      if (user && user.prowloApiKey) {
        userProwloKey = user.prowloApiKey;
      }
    }

    // Call Prowlo service with filters
    const { posts, analytics } = await fetchRedditDataViaProwlo(keyword, userProwloKey, {
      mode,
      timeFrame,
      sentiment,
      sortBy,
    });

    // Apply Pagination
    const totalPosts = posts.length;
    const totalPages = Math.ceil(totalPosts / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedPosts = posts.slice(startIndex, startIndex + limitNum);

    // Save to user search history
    const topSubredditNames = analytics.topSubreddits.map((s) => s.name);

    if (isDbConnected) {
      await SearchHistory.create({
        userId,
        keyword,
        resultsCount: totalPosts,
        subreddits: topSubredditNames,
      });
      logger.info(`Saved search history to MongoDB for user ${userId} (Keyword: "${keyword}")`);
    } else {
      const store = getMemoryStore();
      store.searchHistory.unshift({
        id: `sh_${Date.now()}`,
        userId,
        keyword,
        resultsCount: totalPosts,
        subreddits: topSubredditNames,
        searchedAt: new Date(),
      });
      logger.info(`Saved search history to memory for user ${userId} (Keyword: "${keyword}")`);
    }

    return res.json({
      keyword,
      posts: paginatedPosts,
      allPosts: posts, // Provided for client side exports
      pagination: {
        totalPosts,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
      analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error performing Reddit search for keyword "${keyword}"`, { error: error.message });
    return res.status(500).json({ error: 'Failed to fetch Reddit data via Prowlo engine' });
  }
});

// @route   GET /api/reddit/history
// @desc    Get user search history
router.get('/history', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const history = await SearchHistory.find({ userId }).sort({ searchedAt: -1 }).limit(20);
      return res.json({ history });
    } else {
      const store = getMemoryStore();
      const userHistory = store.searchHistory
        .filter((h) => h.userId === userId)
        .slice(0, 20);
      return res.json({ history: userHistory });
    }
  } catch (error) {
    logger.error('Error fetching search history', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve search history' });
  }
});

// @route   GET /api/reddit/saved
// @desc    Get user saved posts
router.get('/saved', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const saved = await SavedPost.find({ userId }).sort({ savedAt: -1 });
      return res.json({ saved });
    } else {
      const store = getMemoryStore();
      const userSaved = store.savedPosts.filter((sp) => sp.userId === userId);
      return res.json({ saved: userSaved });
    }
  } catch (error) {
    logger.error('Error fetching saved posts', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve saved posts' });
  }
});

// @route   POST /api/reddit/saved
// @desc    Save a Reddit post
router.post('/saved', protect, async (req, res) => {
  const userId = req.user.id;
  const { post } = req.body;

  if (!post || !post.id || !post.title) {
    logger.warn('Save post failed: Invalid post payload');
    return res.status(400).json({ error: 'Valid post data is required' });
  }

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const existing = await SavedPost.findOne({ userId, postId: post.id });
      if (existing) {
        return res.status(400).json({ error: 'Post is already bookmarked in your saved list' });
      }

      const saved = await SavedPost.create({
        userId,
        postId: post.id,
        title: post.title,
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        numComments: post.numComments,
        url: post.url,
        permalink: post.permalink,
        selftext: post.selftext,
        sentiment: post.sentiment,
      });

      logger.info(`Post bookmarked by user ${userId}: "${post.title.substring(0, 30)}..."`);
      return res.status(201).json({ message: 'Post saved successfully', saved });
    } else {
      const store = getMemoryStore();
      const existing = store.savedPosts.find((sp) => sp.userId === userId && sp.postId === post.id);
      if (existing) {
        return res.status(400).json({ error: 'Post is already bookmarked in your saved list' });
      }

      const savedItem = {
        id: `sp_${Date.now()}`,
        userId,
        postId: post.id,
        title: post.title,
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        numComments: post.numComments,
        url: post.url,
        permalink: post.permalink,
        selftext: post.selftext,
        sentiment: post.sentiment,
        savedAt: new Date(),
      };

      store.savedPosts.unshift(savedItem);
      logger.info(`Post saved in memory store by user ${userId}: "${post.title.substring(0, 30)}..."`);
      return res.status(201).json({ message: 'Post saved successfully', saved: savedItem });
    }
  } catch (error) {
    logger.error('Error saving Reddit post', { error: error.message });
    return res.status(500).json({ error: 'Server error saving post' });
  }
});

// @route   DELETE /api/reddit/saved/:postId
// @desc    Remove a saved post
router.delete('/saved/:postId', protect, async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      await SavedPost.deleteOne({ userId, postId });
      logger.info(`Removed saved post ${postId} for user ${userId}`);
      return res.json({ message: 'Post removed from saved list' });
    } else {
      const store = getMemoryStore();
      store.savedPosts = store.savedPosts.filter((sp) => !(sp.userId === userId && sp.postId === postId));
      logger.info(`Removed saved post ${postId} from memory for user ${userId}`);
      return res.json({ message: 'Post removed from saved list' });
    }
  } catch (error) {
    logger.error('Error deleting saved post', { error: error.message });
    return res.status(500).json({ error: 'Server error removing saved post' });
  }
});

module.exports = router;
