const axios = require('axios');
const logger = require('../logger');

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Retrieves a valid Reddit OAuth2 client credentials access token.
 */
const getRedditAccessToken = async (customClientId = null, customClientSecret = null) => {
  const clientId = customClientId || process.env.REDDIT_CLIENT_ID;
  const clientSecret = customClientSecret || process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  // Return cached token if valid (with 60-second safety margin)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  try {
    logger.info('Requesting official Reddit OAuth Client Credentials Access Token...');
    const credentials = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
    
    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'PulseRedApp/1.0.0 (by /u/pulsered_app)',
        },
        timeout: 10000,
      }
    );

    if (response.data && response.data.access_token) {
      cachedToken = response.data.access_token;
      const expiresInMs = (response.data.expires_in || 86400) * 1000;
      tokenExpiresAt = Date.now() + expiresInMs;
      logger.info('Successfully obtained official Reddit OAuth Access Token! Valid for ' + (response.data.expires_in || 86400) + 's');
      return cachedToken;
    }
  } catch (error) {
    logger.error('Reddit OAuth Token Request Failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
  }

  return null;
};

/**
 * Fetches live comment tree for a Reddit post via official Reddit OAuth API (oauth.reddit.com).
 * @param {string} permalink - Post permalink (e.g. /r/SaaS/comments/1cx1zp/...)
 * @param {string} clientId - Optional custom Client ID
 * @param {string} clientSecret - Optional custom Client Secret
 * @returns {Array} List of live comment objects
 */
const fetchLiveCommentsViaRedditOAuth = async (permalink, clientId = null, clientSecret = null) => {
  const token = await getRedditAccessToken(clientId, clientSecret);
  if (!token) {
    return [];
  }

  try {
    // Extract clean path from permalink
    let cleanPath = permalink;
    if (cleanPath.startsWith('http')) {
      const urlObj = new URL(cleanPath);
      cleanPath = urlObj.pathname;
    }
    if (!cleanPath.endsWith('.json')) {
      cleanPath = cleanPath.replace(/\/$/, '') + '.json';
    }

    const apiUrl = `https://oauth.reddit.com${cleanPath}`;
    logger.info(`Fetching live comments via official Reddit OAuth: ${apiUrl}`);

    const res = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'PulseRedApp/1.0.0 (by /u/pulsered_app)',
      },
      timeout: 10000,
    });

    if (Array.isArray(res.data) && res.data.length > 1) {
      const commentListing = res.data[1];
      const children = commentListing?.data?.children || [];
      const liveComments = [];

      for (const child of children) {
        if (child.kind === 't1' && child.data && child.data.author && child.data.body) {
          if (child.data.author !== '[deleted]' && child.data.author !== 'AutoModerator') {
            liveComments.push({
              id: child.data.id,
              author: child.data.author,
              body: child.data.body,
              score: child.data.score || 0,
              createdUtc: child.data.created_utc || Math.floor(Date.now() / 1000),
              permalink: `https://www.reddit.com${child.data.permalink || cleanPath}`,
            });
          }
        }
      }

      logger.info(`Fetched ${liveComments.length} live verified comments via Reddit OAuth for ${cleanPath}`);
      return liveComments;
    }
  } catch (error) {
    logger.warn(`Reddit OAuth live comment fetch error for ${permalink}: ${error.response?.status || error.message}`);
  }

  return [];
};

/**
 * Fetches recent posts and comments for a specific Reddit username to analyze communication style & past activity.
 * @param {string} username - Reddit username
 * @returns {Object} User history snapshot with top subreddits, recent comments, and post titles
 */
const fetchUserRecentHistory = async (username) => {
  if (!username || username === '[deleted]' || username === 'AutoModerator' || username === 'Reddit User') {
    return {
      retrieved: false,
      reason: 'Standard bot or deleted account - profile history not applicable',
      username: username || 'Unknown',
    };
  }

  const cleanUser = username.replace(/^[@u\/]/, '').trim();
  if (!cleanUser) {
    return {
      retrieved: false,
      reason: 'Invalid username format',
      username: username,
    };
  }

  // Primary: Use Redditapis API (REDDITAPIS_API_KEY / REDDITAPIS_KEY)
  const { fetchUserHistoryViaRedditApis } = require('./redditApisService');
  const redditApisResult = await fetchUserHistoryViaRedditApis(cleanUser);

  if (redditApisResult && redditApisResult.retrieved) {
    return redditApisResult;
  }

  // Fallback to OAuth token if configured
  try {
    const token = await getRedditAccessToken();
    if (token) {
      const headers = { 'Authorization': `Bearer ${token}`, 'User-Agent': 'PulseRedApp/1.0.0 (by /u/pulsered_app)' };
      const url = `https://oauth.reddit.com/user/${cleanUser}/overview?limit=6`;
      logger.info(`Fetching Reddit user history via OAuth for u/${cleanUser}...`);
      const res = await axios.get(url, { headers, timeout: 5000 });
      const children = res.data?.data?.children || [];
      if (children.length > 0) {
        const subreddits = new Set();
        const recentSnippets = [];
        for (const child of children) {
          if (child.data?.subreddit) subreddits.add(`r/${child.data.subreddit}`);
          if (child.data?.title) recentSnippets.push(`Post: "${child.data.title.substring(0, 60)}"`);
          else if (child.data?.body) recentSnippets.push(`Comment: "${child.data.body.substring(0, 70)}..."`);
        }
        return {
          retrieved: true,
          username: cleanUser,
          totalKarma: null,
          accountAgeDays: null,
          frequentSubreddits: Array.from(subreddits),
          recentSnippets: recentSnippets.slice(0, 4),
          totalObserved: children.length,
        };
      }
    }
  } catch (err) {
    logger.debug(`OAuth user history fetch note: ${err.message}`);
  }

  // If unretrievable, return explicit status stating history could not be retrieved
  return {
    retrieved: false,
    reason: `Unable to retrieve Reddit user history for u/${cleanUser}`,
    username: cleanUser,
  };
};

module.exports = {
  getRedditAccessToken,
  fetchLiveCommentsViaRedditOAuth,
  fetchUserRecentHistory,
};
