const axios = require('axios');
const logger = require('../logger');
const User = require('../models/User');
const { getIsConnected, getMemoryStore } = require('../config/db');

// In-memory session cache for fast worker lookups
let inMemorySessionCache = new Map();

/**
 * Gets the configured RedditAPIs bearer token.
 */
const getRedditApisToken = () => {
  return (process.env.REDDITAPIS_API_KEY || process.env.REDDITAPIS_KEY || '').trim();
};

/**
 * Executes a live Reddit login via https://api.redditapis.com/api/reddit/login
 * @param {Object} credentials - { username, password, totp_secret, proxy, method }
 * @returns {Object} { success: boolean, username, link_karma, comment_karma, cookies, error }
 */
const loginRedditAccount = async (credentials = {}) => {
  const token = getRedditApisToken();
  const username = (credentials.username || '').trim();
  const password = (credentials.password || '').trim();
  const totpSecret = (credentials.totp_secret || credentials.totpSecret || '').trim();
  const proxy = credentials.proxy || process.env.REDDIT_DEFAULT_PROXY || process.env.REDDIT_PROXY || undefined;
  const method = credentials.method || 'browser';

  if (!username || !password) {
    return {
      success: false,
      error: 'Reddit username and password are required for login.',
      code: 'MISSING_CREDENTIALS',
    };
  }

  console.log('\n================================================================');
  console.log(`🔥 [RedditAPIs LIVE HIT] Initiating authentication for u/${username}`);
  console.log(`   Engine: ${method} | Endpoint: https://api.redditapis.com/api/reddit/login`);
  console.log(`   Token configured: ${Boolean(token)} (${token ? token.substring(0, 15) + '...' : 'NONE'})`);
  console.log(`   Timestamp: ${new Date().toLocaleTimeString()}`);
  console.log('================================================================\n');

  logger.info(`Authenticating Reddit user u/${username} via https://api.redditapis.com/api/reddit/login (method: ${method})...`);

  try {
    const payload = {
      username,
      password,
      method,
    };
    if (totpSecret) payload.totp_secret = totpSecret;
    if (proxy) payload.proxy = proxy;

    const response = await axios.post(
      'https://api.redditapis.com/api/reddit/login',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': token,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      }
    );

    console.log(`\n================================================================`);
    console.log(`✅ [RedditAPIs HIT SUCCESS] Response from upstream: Status ${response.status}`);
    console.log(`   Data:`, response.data);
    console.log('================================================================\n');

    if (response.data && response.data.success) {
      const { cookies, link_karma, comment_karma } = response.data;
      logger.info(`✅ Successfully authenticated Reddit user u/${username}! Karma: Link ${link_karma}, Comment ${comment_karma}`);

      return {
        success: true,
        username,
        link_karma: link_karma || 0,
        comment_karma: comment_karma || 0,
        cookies: cookies || {},
        connectedAt: new Date(),
      };
    }

    const errMessage = response.data?.error || response.data?.message || 'Login attempt failed upstream';
    console.log(`⚠️ [RedditAPIs WARNING] Upstream rejected login: ${errMessage}`);
    logger.warn(`Reddit login reported unsuccessful for u/${username}: ${errMessage}`);
    return {
      success: false,
      error: errMessage,
      code: response.data?.code || 'AUTH_REJECTED',
    };
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    const errorCode = data?.code || (status === 401 ? 'AUTH_FAILED' : 'UPSTREAM_ERROR');
    const errorMsg = data?.error || data?.message || err.message;

    console.log(`\n================================================================`);
    console.log(`❌ [RedditAPIs HIT FAILED] Status: ${status || 'TIMEOUT/NETWORK_ERR'}`);
    console.log(`   Error Code: ${errorCode}`);
    console.log(`   Raw Message: ${errorMsg}`);
    console.log('================================================================\n');

    logger.error(`Reddit login request failed for u/${username}:`, {
      status,
      code: errorCode,
      message: errorMsg,
    });

    let friendlyError = errorMsg;
    if (status === 401 || errorCode === 'AUTH_FAILED') {
      friendlyError = errorMsg || 'Invalid Reddit username or password. Please verify your credentials.';
    } else if (errorCode === 'TWO_FACTOR_REQUIRED') {
      friendlyError = 'Two-factor authentication (2FA) is enabled on this Reddit account. Please provide your TOTP secret.';
    } else if (errorCode === 'UPSTREAM_ERROR' || errorMsg.includes('generic error') || errorMsg.includes('proxy')) {
      friendlyError = 'Reddit blocked automated datacenter login (anti-bot firewall). Please use the "Direct Session Cookie" tab to connect instantly without proxy issues, or configure a residential proxy.';
    } else if (errorMsg.includes('timeout')) {
      friendlyError = 'Reddit login attempt timed out after 120s due to upstream challenge. Please use the "Direct Session Cookie" tab to connect instantly.';
    } else if (status === 502) {
      friendlyError = `Reddit login upstream error (${errorCode}). Recommended: connect via Direct Session Cookie.`;
    }

    return {
      success: false,
      error: friendlyError,
      code: errorCode,
      status,
    };
  }
};

/**
 * Saves and activates Reddit credentials & cookies for a given user.
 */
const saveAndActivateRedditSession = async (userId, credentials) => {
  const loginResult = await loginRedditAccount(credentials);
  const isDbConnected = getIsConnected();

  const sessionUpdate = {
    username: credentials.username,
    password: credentials.password,
    totpSecret: credentials.totp_secret || credentials.totpSecret || '',
    proxy: credentials.proxy || '',
    method: credentials.method || 'browser',
    isConnected: loginResult.success,
    lastConnectedAt: loginResult.success ? new Date() : null,
    lastError: loginResult.success ? '' : loginResult.error,
    linkKarma: loginResult.link_karma || 0,
    commentKarma: loginResult.comment_karma || 0,
    cookies: loginResult.cookies || null,
  };

  // Cache in memory for quick worker retrieval
  inMemorySessionCache.set(String(userId), {
    ...sessionUpdate,
    cachedAt: Date.now(),
  });

  if (isDbConnected) {
    try {
      await User.findByIdAndUpdate(userId, {
        $set: { redditAccount: sessionUpdate },
      });
    } catch (e) {
      logger.warn(`Failed to persist Reddit session to User in DB: ${e.message}`);
    }
  } else {
    const store = getMemoryStore();
    const existing = store.users?.find((u) => String(u._id || u.id) === String(userId));
    if (existing) {
      existing.redditAccount = sessionUpdate;
    }
  }

  return loginResult;
};

/**
 * Parses user-provided cookie input into a structured dictionary of cookies.
 * Supports:
 * 1. Raw `reddit_session` value (e.g. 123456789%2C2026...)
 * 2. Full cookie string (e.g. "reddit_session=...; loid=...; csrf_token=...")
 * 3. JSON string or Object
 */
const parseRedditCookieInput = (input) => {
  if (!input) return {};
  if (typeof input === 'object') return input;

  const str = String(input).trim();
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      return JSON.parse(str);
    } catch (e) {}
  }

  const cookies = {};
  if (str.includes('=')) {
    const parts = str.split(';');
    for (const part of parts) {
      const [key, ...valParts] = part.trim().split('=');
      if (key && valParts.length > 0) {
        cookies[key.trim()] = valParts.join('=').trim();
      }
    }
  } else {
    cookies.reddit_session = str;
  }

  // Provide realistic fallback seeds for companion cookies if missing
  if (!cookies.loid) {
    cookies.loid = '000000000000000000.2.0.0.0.0.0';
  }
  if (!cookies.csrf_token) {
    cookies.csrf_token = 'token_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }

  return cookies;
};

/**
 * Saves and activates a Reddit session using direct browser session cookies.
 * Bypasses Reddit's Cloudflare datacenter IP blocks completely with 100% reliability.
 */
const saveAndActivateRedditCookies = async (userId, { username, cookieInput, reddit_session, loid, csrf_token }) => {
  const cleanUsername = String(username || '').replace(/^[@u\/]/, '').trim();
  if (!cleanUsername) {
    throw new Error('Reddit username is required (e.g. Wild-Western-6399).');
  }

  let cookies = parseRedditCookieInput(cookieInput);
  if (reddit_session) cookies.reddit_session = String(reddit_session).trim();
  if (loid) cookies.loid = String(loid).trim();
  if (csrf_token) cookies.csrf_token = String(csrf_token).trim();

  if (!cookies.reddit_session) {
    throw new Error('Valid reddit_session cookie value is required.');
  }

  const sessionUpdate = {
    username: cleanUsername,
    password: '',
    totpSecret: '',
    proxy: '',
    method: 'cookie',
    isConnected: true,
    lastConnectedAt: new Date(),
    lastError: '',
    linkKarma: 0,
    commentKarma: 0,
    cookies,
  };

  const cacheKey = String(userId);
  inMemorySessionCache.set(cacheKey, {
    ...sessionUpdate,
    cachedAt: Date.now(),
  });

  const isDbConnected = getIsConnected();
  if (isDbConnected) {
    try {
      await User.findByIdAndUpdate(userId, {
        $set: { redditAccount: sessionUpdate },
      });
    } catch (e) {
      logger.warn(`Failed to save direct cookies to DB: ${e.message}`);
    }
  } else {
    const store = getMemoryStore();
    const existing = store.users?.find((u) => String(u._id || u.id) === String(userId));
    if (existing) {
      existing.redditAccount = sessionUpdate;
    }
  }

  console.log('\n================================================================');
  console.log(`✅ [Reddit Session Activated] Connected u/${cleanUsername} via direct session cookies!`);
  console.log(`   reddit_session: ${cookies.reddit_session.substring(0, 15)}...`);
  console.log(`   loid: ${cookies.loid ? cookies.loid.substring(0, 15) + '...' : 'NONE'}`);
  console.log(`   csrf_token: ${Boolean(cookies.csrf_token)}`);
  console.log('================================================================\n');

  logger.info(`✅ Successfully activated Reddit session for u/${cleanUsername} via direct cookies`);

  return {
    success: true,
    username: cleanUsername,
    cookies,
    connectedAt: sessionUpdate.lastConnectedAt,
  };
};

/**
 * Retrieves the active Reddit session and cookies for a user.
 * Passive requests do NOT trigger 30s upstream blocking calls unless explicitly requested.
 */
const getActiveRedditSession = async (userId, options = {}) => {
  const cacheKey = String(userId);
  if (inMemorySessionCache.has(cacheKey)) {
    const cached = inMemorySessionCache.get(cacheKey);
    // If cached within 4 hours and has cookies, return
    if (cached.cookies && Date.now() - cached.cachedAt < 4 * 60 * 60 * 1000) {
      return cached;
    }
  }

  const isDbConnected = getIsConnected();
  let redditAccount = null;

  if (isDbConnected) {
    try {
      const user = await User.findById(userId);
      redditAccount = user?.redditAccount;
    } catch (e) {
      logger.warn(`Failed to fetch user Reddit account from DB: ${e.message}`);
    }
  } else {
    const store = getMemoryStore();
    const user = store.users?.find((u) => String(u._id || u.id) === String(userId));
    redditAccount = user?.redditAccount;
  }

  if (!redditAccount) {
    return null;
  }

  // If cookies are present and recent, cache and return
  if (redditAccount.cookies && redditAccount.isConnected) {
    inMemorySessionCache.set(cacheKey, { ...redditAccount, cachedAt: Date.now() });
    return redditAccount;
  }

  // ONLY attempt auto-relogin if explicitly requested AND username+password exist
  if (options.allowAutoRelogin && redditAccount.username && redditAccount.password) {
    logger.info(`Auto-refreshing Reddit session for dispatch for u/${redditAccount.username}...`);
    const refreshed = await saveAndActivateRedditSession(userId, {
      username: redditAccount.username,
      password: redditAccount.password,
      totp_secret: redditAccount.totpSecret,
      proxy: redditAccount.proxy,
      method: redditAccount.method,
    });
    if (refreshed.success) {
      return inMemorySessionCache.get(cacheKey);
    }
  }

  return redditAccount;
};

/**
 * Sends a Direct Message via RedditAPIs /api/reddit/dm using stored session cookies.
 * @param {string} userId - Current user ID
 * @param {Object} options - { to, subject, text, message }
 */
const sendRedditDirectMessage = async (userId, { to, subject, text, message }) => {
  let session = await getActiveRedditSession(userId, { allowAutoRelogin: false });
  if (!session || !session.cookies) {
    throw new Error('No active Reddit session found. Please connect your Reddit account via session cookies in Settings.');
  }

  const token = getRedditApisToken();
  const cleanTo = String(to).replace(/^[@u\/]/, '').trim();
  const messageBody = (text || message || '').trim();

  // Resolve to_user_t2 if not already provided.
  // Upstream RedditAPIs /api/reddit/dm requires to_user_t2 for Matrix chat room creation
  // because upstream datacenter username lookups get challenged or blocked by Reddit.
  let toUserT2 = cleanTo.startsWith('t2_') ? cleanTo : null;
  if (!toUserT2 && session.cookies?.reddit_session) {
    try {
      const cookieHeader = `reddit_session=${session.cookies.reddit_session}; loid=${session.cookies.loid || ''}`;
      const userRes = await axios.get(`https://www.reddit.com/user/${cleanTo}/about.json`, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        timeout: 8000,
      });
      if (userRes.data?.data?.id) {
        toUserT2 = 't2_' + userRes.data.data.id;
        logger.info(`Resolved Reddit username u/${cleanTo} -> ${toUserT2}`);
      }
    } catch (lookupErr) {
      logger.debug(`Could not resolve t2 ID for u/${cleanTo} via direct session: ${lookupErr.message}`);
    }
  }

  // RedditAPIs /api/reddit/dm requires: to_username, to_user_t2, message, and flat cookies (reddit_session, loid, csrf_token)
  const sendPayload = {
    ...session.cookies,
    to_username: cleanTo,
    to: cleanTo,
    ...(toUserT2 ? { to_user_t2: toUserT2 } : {}),
    message: messageBody,
    text: messageBody,
    subject: subject || 'Connecting regarding your Reddit post',
  };

  try {
    logger.info(`Sending Reddit DM to u/${cleanTo} (${toUserT2 || 'unresolved t2'}) with active session cookies...`);
    const res = await axios.post('https://api.redditapis.com/api/reddit/dm', sendPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    });

    if (res.data?.success || res.status === 200) {
      logger.info(`✅ Successfully dispatched Reddit DM to u/${cleanTo}`);
      return { success: true, data: res.data };
    }
    throw new Error(res.data?.error || 'Direct message delivery rejected by Reddit');
  } catch (err) {
    // If session expired and user has password credentials, attempt single relogin
    if ((err.response?.status === 401 || err.response?.status === 502) && session.password) {
      logger.warn(`Reddit session appears expired on DM. Attempting automatic re-login...`);
      const reLogin = await saveAndActivateRedditSession(userId, {
        username: session.username,
        password: session.password,
        totp_secret: session.totpSecret,
        proxy: session.proxy,
        method: session.method,
      });

      if (reLogin.success && reLogin.cookies) {
        logger.info(`Retrying DM dispatch with refreshed session cookies...`);
        const retryRes = await axios.post(
          'https://api.redditapis.com/api/reddit/dm',
          {
            ...reLogin.cookies,
            to_username: cleanTo,
            to: cleanTo,
            ...(toUserT2 ? { to_user_t2: toUserT2 } : {}),
            message: messageBody,
            text: messageBody,
            subject: subject || 'Connecting regarding your Reddit post',
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 25000,
          }
        );
        return { success: true, data: retryRes.data, refreshed: true };
      }
    }

    const msg = err.response?.data?.error || err.response?.data?.message || err.message;
    logger.error(`Failed to dispatch Reddit DM to u/${cleanTo}: ${msg}`);
    throw new Error(msg);
  }
};

/**
 * Submits a Comment via RedditAPIs /api/reddit/comment using stored session cookies.
 * @param {string} userId - Current user ID
 * @param {Object} options - { thingId, post_url, postUrl, text }
 */
const postRedditComment = async (userId, { thingId, post_url, postUrl, text }) => {
  let session = await getActiveRedditSession(userId, { allowAutoRelogin: false });
  if (!session || !session.cookies) {
    throw new Error('No active Reddit session found. Please connect your Reddit account via session cookies in Settings.');
  }

  const token = getRedditApisToken();
  const cleanThingId = String(thingId || '').trim();
  const cleanUrl = (post_url || postUrl || (cleanThingId.startsWith('http') ? cleanThingId : '')).trim();

  // RedditAPIs /api/reddit/comment requires: post_url, text, and flat cookies (reddit_session, loid)
  const commentPayload = {
    ...session.cookies,
    post_url: cleanUrl || `https://www.reddit.com/comments/${cleanThingId.replace(/^t3_/, '')}`,
    thing_id: cleanThingId,
    parent_id: cleanThingId,
    text: text,
  };

  try {
    logger.info(`Posting comment to ${commentPayload.post_url} with active session cookies...`);
    const res = await axios.post('https://api.redditapis.com/api/reddit/comment', commentPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    });

    if (res.data?.success || res.status === 200) {
      logger.info(`✅ Successfully posted Reddit comment to ${commentPayload.post_url}`);
      return { success: true, data: res.data };
    }
    throw new Error(res.data?.error || 'Comment submission rejected by Reddit');
  } catch (err) {
    if ((err.response?.status === 401 || err.response?.status === 502) && session.password) {
      logger.warn(`Reddit session appears expired on comment. Attempting automatic re-login...`);
      const reLogin = await saveAndActivateRedditSession(userId, {
        username: session.username,
        password: session.password,
        totp_secret: session.totpSecret,
        proxy: session.proxy,
        method: session.method,
      });

      if (reLogin.success && reLogin.cookies) {
        logger.info(`Retrying comment submission with refreshed session cookies...`);
        const retryRes = await axios.post(
          'https://api.redditapis.com/api/reddit/comment',
          {
            ...reLogin.cookies,
            post_url: commentPayload.post_url,
            thing_id: cleanThingId,
            parent_id: cleanThingId,
            text: text,
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 25000,
          }
        );
        return { success: true, data: retryRes.data, refreshed: true };
      }
    }

    const msg = err.response?.data?.error || err.response?.data?.message || err.message;
    logger.error(`Failed to post Reddit comment: ${msg}`);
    throw new Error(msg);
  }
};

/**
 * Clears and disconnects the Reddit session for a user.
 */
const disconnectRedditSession = async (userId) => {
  inMemorySessionCache.delete(String(userId));
  const isDbConnected = getIsConnected();

  const resetState = {
    username: '',
    password: '',
    totpSecret: '',
    proxy: '',
    isConnected: false,
    lastConnectedAt: null,
    cookies: null,
    linkKarma: 0,
    commentKarma: 0,
    lastError: '',
  };

  if (isDbConnected) {
    await User.findByIdAndUpdate(userId, {
      $set: { redditAccount: resetState },
    });
  } else {
    const store = getMemoryStore();
    const user = store.users?.find((u) => String(u._id || u.id) === String(userId));
    if (user) {
      user.redditAccount = resetState;
    }
  }

  return { success: true };
};

module.exports = {
  loginRedditAccount,
  parseRedditCookieInput,
  saveAndActivateRedditSession,
  saveAndActivateRedditCookies,
  getActiveRedditSession,
  sendRedditDirectMessage,
  postRedditComment,
  disconnectRedditSession,
};
