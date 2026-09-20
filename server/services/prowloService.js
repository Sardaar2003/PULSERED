const axios = require('axios');
const logger = require('../logger');

// Sentiment analysis helper
const analyzeSentiment = (text) => {
  if (!text) return 'Neutral';
  const lower = text.toLowerCase();
  const positiveWords = ['great', 'awesome', 'best', 'good', 'love', 'excellent', 'amazing', 'helpful', 'top', 'win', 'innovative', 'perfect', 'super', 'solution', 'pro', 'useful'];
  const negativeWords = ['bad', 'worst', 'hate', 'terrible', 'horrible', 'issue', 'problem', 'fail', 'scam', 'broken', 'error', 'bug', 'slow', 'waste', 'risk', 'avoid', 'angry'];

  let score = 0;
  positiveWords.forEach((word) => {
    if (lower.includes(word)) score += 1;
  });
  negativeWords.forEach((word) => {
    if (lower.includes(word)) score -= 1;
  });

  if (score > 0) return 'Positive';
  if (score < 0) return 'Negative';
  return 'Neutral';
};

// In-memory cache for Prowlo API live results (5-minute TTL)
const prowloResultCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const fetchRedditDataViaProwlo = async (keyword, userProwloKey = null) => {
  const cacheKey = `${keyword.toLowerCase().trim()}_${userProwloKey || 'default'}`;
  const cached = prowloResultCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    logger.info(`Returning cached Prowlo Live results for keyword: "${keyword}" (0ms latency)`);
    return cached.data;
  }

  const apiKey = userProwloKey || process.env.PROWLO_API_KEY;
  logger.info(`Initiating Live Prowlo Reddit Analysis for keyword: "${keyword}"`, { apiKeyProvided: !!apiKey });

  if (!apiKey) {
    throw new Error('Prowlo API key missing. Please provide a valid PROWLO_API_KEY in environment or user profile.');
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Primary Query: Try full exact phrase on Prowlo API
  try {
    logger.info(`Querying Prowlo API for exact phrase: "${keyword}"...`);
    const response = await axios.post(
      'https://api.prowlo.com/v1/search',
      {
        q: keyword,
        platform: 'reddit',
        limit: 25,
      },
      { headers, timeout: 10000 }
    );

    const rawItems = response.data?.data?.items || response.data?.results || response.data?.data || [];
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      logger.info(`Live Prowlo API returned ${rawItems.length} posts for exact phrase "${keyword}"`);
      const result = processAndNormalizeResults(keyword, rawItems, 'Prowlo Live Intelligence Engine');
      prowloResultCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (error) {
    logger.warn(`Prowlo exact query notice for "${keyword}": ${error.response?.status || error.message}`);
  }

  // 2. Secondary Query: Try primary word-pairs on Prowlo API
  const stopWords = ['about', 'into', 'with', 'from', 'that', 'this', 'have', 'for', 'the', 'my', 'your', 'our', 'and', 'are', 'was', 'not'];
  const words = keyword
    .split(' ')
    .map((w) => w.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    .filter((w) => w.length > 2 && !stopWords.includes(w));

  if (words.length >= 2) {
    const pairQuery = `${words[0]} ${words[1]}`;
    try {
      logger.info(`0 items for exact phrase. Retrying Prowlo API with key pair: "${pairQuery}"...`);
      const pairRes = await axios.post(
        'https://api.prowlo.com/v1/search',
        { q: pairQuery, platform: 'reddit', limit: 25 },
        { headers, timeout: 8000 }
      );
      const pairItems = pairRes.data?.data?.items || [];
      if (Array.isArray(pairItems) && pairItems.length > 0) {
        logger.info(`Live Prowlo API returned ${pairItems.length} posts for key pair "${pairQuery}"`);
        const result = processAndNormalizeResults(keyword, pairItems, 'Prowlo Live Intelligence Engine');
        prowloResultCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    } catch (error) {
      logger.warn(`Prowlo key pair query notice for "${pairQuery}": ${error.message}`);
    }
  }

  // 3. Multi-Term Aggregation: Query Prowlo API across individual key tokens & deduplicate
  logger.info(`Querying Prowlo API across key tokens: [${words.join(', ')}]...`);
  const aggregatedItems = [];
  const seenIds = new Set();

  for (const word of words) {
    try {
      const tokenRes = await axios.post(
        'https://api.prowlo.com/v1/search',
        { q: word, platform: 'reddit', limit: 15 },
        { headers, timeout: 6000 }
      );
      const tokenItems = tokenRes.data?.data?.items || [];
      for (const item of tokenItems) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          aggregatedItems.push(item);
        }
      }
    } catch (err) {
      logger.warn(`Prowlo token query notice for "${word}": ${err.message}`);
    }
  }

  if (aggregatedItems.length > 0) {
    logger.info(`Successfully aggregated ${aggregatedItems.length} live posts via Prowlo API across key terms`);
    const result = processAndNormalizeResults(keyword, aggregatedItems, 'Prowlo Live Intelligence Engine');
    prowloResultCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  throw new Error(`No live Reddit results found on Prowlo API for keyword "${keyword}". Please try broader terms.`);
};

const processAndNormalizeResults = (keyword, rawPosts, sourceProvider) => {
  const posts = rawPosts.map((post, index) => {
    const title = post.title || post.headline || `Reddit discussion about ${keyword}`;
    const selftext = post.selftext || post.snippet || post.body || '';
    const subreddit = post.subreddit_name_prefixed || (post.subreddit ? `r/${post.subreddit.replace(/^r\//, '')}` : 'r/reddit');
    const score = typeof post.score === 'number' ? post.score : typeof post.ups === 'number' ? post.ups : 0;
    const numComments = typeof post.num_comments === 'number' ? post.num_comments : typeof post.numComments === 'number' ? post.numComments : 0;
    const author = post.author || 'reddit_user';
    const permalink = post.permalink ? (post.permalink.startsWith('http') ? post.permalink : `https://reddit.com${post.permalink}`) : `https://reddit.com/search?q=${encodeURIComponent(keyword)}`;
    const sentiment = analyzeSentiment(`${title} ${selftext}`);

    return {
      id: post.id || `live_post_${Date.now()}_${index}`,
      title,
      selftext: selftext.length > 280 ? `${selftext.substring(0, 280)}...` : selftext,
      subreddit,
      author,
      score,
      numComments,
      url: post.url || permalink,
      permalink,
      createdUtc: post.created_utc || Math.floor(Date.now() / 1000) - index * 3600,
      sentiment,
      relevanceScore: Math.round((0.98 - index * 0.02) * 100) / 100,
    };
  });

  const subredditMap = {};
  const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 };
  let totalScore = 0;

  posts.forEach((p) => {
    subredditMap[p.subreddit] = (subredditMap[p.subreddit] || 0) + 1;
    sentimentCounts[p.sentiment] = (sentimentCounts[p.sentiment] || 0) + 1;
    totalScore += p.score;
  });

  const topSubreddits = Object.entries(subredditMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const analytics = {
    totalResults: posts.length,
    avgScore: posts.length ? Math.round(totalScore / posts.length) : 0,
    topSubreddits,
    sentimentCounts,
    sourceProvider,
  };

  return { posts, analytics };
};

module.exports = { fetchRedditDataViaProwlo };
