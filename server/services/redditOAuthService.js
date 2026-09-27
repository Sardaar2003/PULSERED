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

module.exports = {
  getRedditAccessToken,
  fetchLiveCommentsViaRedditOAuth,
};
