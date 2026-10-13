const logger = require('../logger');
const {
  mcpRedditSearch,
  mcpRedditPostComments,
  mcpRedditUserProfile,
  mcpRedditUserSubmitted,
  mcpRedditUserComments,
} = require('./mcpRedditClient');

/**
 * Searches Reddit posts via official redditapis-mcp MCP tool [reddit_search]
 */
const fetchRedditDataViaRedditApis = async (keyword, options = {}) => {
  logger.info(`Querying redditapis-mcp server [reddit_search] for keyword "${keyword}"...`);
  const res = await mcpRedditSearch(keyword, options.limit || 20);
  const rawPosts = res?.posts || res?.data?.items || res?.items || (Array.isArray(res) ? res : []);
  logger.info(`redditapis-mcp [reddit_search] returned ${rawPosts.length} live posts for "${keyword}"`);
  return rawPosts;
};

/**
 * Fetches live thread comments for a post via official redditapis-mcp MCP tool [reddit_post_comments]
 */
const fetchCommentsViaRedditApis = async (postIdOrPermalink, permalinkFallback = '') => {
  const target = permalinkFallback || postIdOrPermalink;
  if (!target) return [];
  try {
    const res = await mcpRedditPostComments(target, 25);
    const comments = res?.comments || res?.data || (Array.isArray(res) ? res : []);
    if (Array.isArray(comments)) {
      return comments
        .map((c) => {
          const item = c.data || c;
          return {
            id: item.id || item.name,
            author: item.author || item.author_info?.username,
            body: item.body || item.selftext || '',
            score: item.score || item.ups || 0,
            permalink: item.permalink ? (item.permalink.startsWith('http') ? item.permalink : `https://www.reddit.com${item.permalink}`) : '',
          };
        })
        .filter((c) => c.author && c.body && c.author !== '[deleted]' && c.author !== 'AutoModerator');
    }
  } catch (error) {
    logger.warn(`MCP reddit_post_comments fetch note for post ${postIdOrPermalink}: ${error.message}`);
  }
  return [];
};

const userProfileCache = new Map();
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Fetches live user profile & activity via official redditapis-mcp MCP tools:
 * [reddit_user_profile], [reddit_user_submitted], [reddit_user_comments]
 * Employs a 1-Hour TTL In-Memory Cache to eliminate duplicate MCP calls.
 */
const fetchUserHistoryViaRedditApis = async (username) => {
  if (!username || username === '[deleted]' || username === 'AutoModerator' || username === 'Reddit User') {
    return {
      retrieved: false,
      reason: 'Standard bot or deleted account - profile history not applicable',
      username: username || 'Unknown',
    };
  }

  const cleanUser = username.replace(/^[@u\/]/, '').trim();
  const cacheKey = cleanUser.toLowerCase();

  // Check 1-Hour TTL User Profile Cache
  if (userProfileCache.has(cacheKey)) {
    const cached = userProfileCache.get(cacheKey);
    if (Date.now() - cached.timestamp < ONE_HOUR_MS) {
      logger.info(`⚡ [Cache Hit] Reusing cached user profile for u/${cleanUser}`);
      return cached.data;
    }
    userProfileCache.delete(cacheKey);
  }

  try {
    logger.info(`Querying redditapis-mcp server tools for u/${cleanUser}...`);
    const profile = await mcpRedditUserProfile(cleanUser);

    const [subRes, comRes] = await Promise.all([
      mcpRedditUserSubmitted(cleanUser, 5).catch(() => null),
      mcpRedditUserComments(cleanUser, 5).catch(() => null),
    ]);

    const createdUtc = profile?.created_utc || (profile?.created ? Math.floor(new Date(profile.created).getTime() / 1000) : null);
    const accountAgeDays = createdUtc ? Math.floor((Date.now() / 1000 - createdUtc) / 86400) : null;
    const totalKarma = profile?.total_karma ?? (typeof profile?.link_karma === 'number' && typeof profile?.comment_karma === 'number' ? profile.link_karma + profile.comment_karma : null);

    const subreddits = new Set();
    const recentSnippets = [];

    const posts = subRes?.posts || subRes?.data || (Array.isArray(subRes) ? subRes : []);
    if (Array.isArray(posts)) {
      posts.slice(0, 5).forEach((p) => {
        if (p.subreddit) subreddits.add(`r/${p.subreddit}`);
        if (p.title) recentSnippets.push(`Post: "${p.title.substring(0, 70)}"`);
      });
    }

    const comments = comRes?.comments || comRes?.data || (Array.isArray(comRes) ? comRes : []);
    if (Array.isArray(comments)) {
      comments.slice(0, 5).forEach((c) => {
        if (c.subreddit) subreddits.add(`r/${c.subreddit}`);
        if (c.body) recentSnippets.push(`Comment: "${c.body.substring(0, 70)}..."`);
      });
    }

    logger.info(`Successfully retrieved MCP profile for u/${cleanUser} (Karma: ${totalKarma}, Age: ${accountAgeDays}d)`);

    const result = {
      retrieved: true,
      username: cleanUser,
      totalKarma,
      accountAgeDays,
      publicBio: profile?.subreddit?.public_description || null,
      frequentSubreddits: Array.from(subreddits),
      recentSnippets: recentSnippets.slice(0, 5),
    };

    userProfileCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    logger.warn(`Notice: Could not retrieve MCP user history for u/${cleanUser}: ${err.message}`);
    return {
      retrieved: false,
      reason: `Unable to retrieve Reddit user history for u/${cleanUser} (${err.message})`,
      username: cleanUser,
    };
  }
};

module.exports = {
  fetchRedditDataViaRedditApis,
  fetchCommentsViaRedditApis,
  fetchUserHistoryViaRedditApis,
};
