const axios = require('axios');
const logger = require('../logger');

const REDDITAPIS_BASE_URL = 'https://api.redditapis.com';

/**
 * Searches Reddit posts via official Redditapis.com API using REDDITAPIS_API_KEY from .env
 */
const fetchRedditDataViaRedditApis = async (keyword, options = {}) => {
  const apiKey = (process.env.REDDITAPIS_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('REDDITAPIS_API_KEY missing in .env');
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };

  logger.info(`Querying Redditapis.com for keyword "${keyword}"...`);

  const response = await axios.get(`${REDDITAPIS_BASE_URL}/api/reddit/search`, {
    params: { q: keyword, limit: options.limit || 20 },
    headers,
    timeout: 10000,
  });

  const rawPosts = response.data?.posts || response.data?.data?.items || response.data?.items || [];
  logger.info(`Redditapis.com returned ${rawPosts.length} live posts for "${keyword}"`);

  return rawPosts;
};

/**
 * Fetches live thread comments for a specific Reddit post via Redditapis.com API
 */
const fetchCommentsViaRedditApis = async (postId) => {
  const apiKey = (process.env.REDDITAPIS_API_KEY || '').trim();
  if (!apiKey || !postId) return [];

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };

  const cleanPostId = String(postId).replace(/^t3_/, '');

  try {
    const response = await axios.get(`${REDDITAPIS_BASE_URL}/api/reddit/post/${cleanPostId}/comments`, {
      headers,
      timeout: 8000,
    });

    const comments = response.data?.comments || response.data?.data || response.data || [];
    if (Array.isArray(comments)) {
      return comments
        .map((c) => ({
          id: c.id || c.name,
          author: c.author || c.author_info?.username,
          body: c.body || c.selftext || '',
          score: c.score || c.ups || 0,
          permalink: c.permalink ? (c.permalink.startsWith('http') ? c.permalink : `https://www.reddit.com${c.permalink}`) : '',
        }))
        .filter((c) => c.author && c.body && c.author !== '[deleted]' && c.author !== 'AutoModerator');
    }
  } catch (error) {
    logger.warn(`Redditapis comments fetch notice for post ${cleanPostId}: ${error.response?.status || error.message}`);
  }

  return [];
};

module.exports = {
  fetchRedditDataViaRedditApis,
  fetchCommentsViaRedditApis,
};
