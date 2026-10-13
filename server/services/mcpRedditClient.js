const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const logger = require('../logger');

let mcpClientInstance = null;
let mcpTransportInstance = null;
let isConnecting = false;

/**
 * Initializes and returns a singleton MCP Client connected to redditapis-mcp via Stdio transport.
 */
const getMcpClient = async () => {
  if (mcpClientInstance) return mcpClientInstance;
  if (isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (mcpClientInstance) return mcpClientInstance;
  }

  isConnecting = true;
  const apiKey = (process.env.REDDITAPIS_KEY || process.env.REDDITAPIS_API_KEY || '').trim();

  try {
    logger.info('Initializing official Model Context Protocol (MCP) Client for redditapis-mcp...');

    mcpTransportInstance = new StdioClientTransport({
      command: 'npx',
      args: ['-y', 'redditapis-mcp@latest'],
      env: {
        ...process.env,
        REDDITAPIS_KEY: apiKey,
        REDDITAPIS_API_KEY: apiKey,
      },
    });

    const client = new Client(
      { name: 'PulseRedBackendAgent', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(mcpTransportInstance);
    mcpClientInstance = client;
    logger.info('✅ Model Context Protocol (MCP) Client successfully connected to redditapis-mcp server!');
    return mcpClientInstance;
  } catch (err) {
    logger.error(`Failed to initialize MCP Server client: ${err.message}`);
    mcpClientInstance = null;
    mcpTransportInstance = null;
    throw err;
  } finally {
    isConnecting = false;
  }
};

/**
 * Generic invoker for any of the 44 MCP tools exposed by redditapis-mcp
 * @param {string} toolName - Name of the MCP tool (e.g. 'reddit_search', 'reddit_user_profile')
 * @param {Object} args - Arguments required by the target MCP tool schema
 */
const callMcpTool = async (toolName, args = {}) => {
  const client = await getMcpClient();
  let lastError = null;

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      if (attempt === 0) {
        logger.info(`🤖 Executing MCP Tool [${toolName}] with args: ${JSON.stringify(args)}`);
      }
      const response = await client.callTool({
        name: toolName,
        arguments: args,
      });

      if (response?.isError) {
        const errText = response?.content?.[0]?.text || 'MCP Tool reported execution error';
        if (attempt === 0 && (errText.includes('503') || errText.includes('upstream_unavailable') || errText.includes('retry shortly'))) {
          logger.warn(`MCP Tool [${toolName}] encountered transient upstream 503. Retrying in 1500ms...`);
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        logger.warn(`MCP Tool [${toolName}] error: ${errText}`);
        throw new Error(errText);
      }

      const textPayload = response?.content?.[0]?.text || '{}';
      try {
        return JSON.parse(textPayload);
      } catch {
        return textPayload;
      }
    } catch (err) {
      lastError = err;
      if (attempt === 0 && (err.message.includes('503') || err.message.includes('upstream_unavailable') || err.message.includes('retry shortly'))) {
        logger.warn(`MCP Tool [${toolName}] encountered transient upstream error: ${err.message}. Retrying in 1500ms...`);
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      logger.error(`Error invoking MCP Tool [${toolName}]: ${err.message}`);
      throw err;
    }
  }
  throw lastError;
};

/**
 * Normalizes any Reddit post identifier, full URL, or partial path into a valid
 * Reddit permalink relative path required by the redditapis-mcp schema (e.g. /r/subreddit/comments/id/title/).
 */
const sanitizeRedditPermalink = (input) => {
  if (!input) return '';
  let str = String(input).trim();
  // Strip protocol and domain (https://www.reddit.com, https://reddit.com, etc.)
  str = str.replace(/^https?:\/\/(?:www\.)?reddit\.com/i, '');
  // Strip t3_ fullname prefix if present
  str = str.replace(/^t3_/, '');
  // Ensure starts with a forward slash
  if (!str.startsWith('/')) {
    str = `/${str}`;
  }
  // If given a bare post ID (e.g. /1wjt68u), normalize to /comments/1wjt68u
  if (!str.startsWith('/r/') && !str.startsWith('/comments/')) {
    str = `/comments${str}`;
  }
  return str;
};

/**
 * Lists all available 44 tools registered on the redditapis-mcp server
 */
const listMcpTools = async () => {
  const client = await getMcpClient();
  const res = await client.listTools();
  return res.tools || [];
};

// ============================================================================
// ALL 44 EXPOSED MCP TOOL WRAPPERS (redditapis-mcp)
// ============================================================================

// 1. reddit_post_visibility
const mcpRedditPostVisibility = async (args = {}) => callMcpTool('reddit_post_visibility', args);

// 2. reddit_search
const mcpRedditSearch = async (q, limit = 25) => callMcpTool('reddit_search', typeof q === 'object' ? q : { q, limit });

// 3. reddit_subreddit_posts
const mcpRedditSubredditPosts = async (subreddit, limit = 20) => callMcpTool('reddit_subreddit_posts', typeof subreddit === 'object' ? subreddit : { subreddit, limit });

// 4. reddit_home_feed
const mcpRedditHomeFeed = async (args = {}) => callMcpTool('reddit_home_feed', args);

// 5. reddit_verify_comments
const mcpRedditVerifyComments = async (args = {}) => callMcpTool('reddit_verify_comments', args);

// 6. reddit_feedback_list
const mcpRedditFeedbackList = async (args = {}) => callMcpTool('reddit_feedback_list', args);

// 7. reddit_subreddit_top
const mcpRedditSubredditTop = async (args = {}) => callMcpTool('reddit_subreddit_top', args);

// 8. reddit_post
const mcpRedditPost = async (args = {}) => {
  const resolvedArgs = typeof args === 'object' && args !== null
    ? args
    : { id: String(args).replace(/^t3_/, '') };
  return callMcpTool('reddit_post', resolvedArgs);
};

// 9. reddit_post_comments
const mcpRedditPostComments = async (arg, limit = 25) => {
  let targetPermalink = '';
  let commentLimit = limit;

  if (typeof arg === 'object' && arg !== null) {
    targetPermalink = arg.permalink || arg.url || arg.id || '';
    commentLimit = arg.limit || limit || 25;
  } else {
    targetPermalink = arg;
  }

  const permalink = sanitizeRedditPermalink(targetPermalink);
  return callMcpTool('reddit_post_comments', { permalink, limit: commentLimit });
};

// 10. reddit_search_comments
const mcpRedditSearchComments = async (args = {}) => callMcpTool('reddit_search_comments', args);

// 11. reddit_deep_comment_search
const mcpRedditDeepCommentSearch = async (args = {}) => callMcpTool('reddit_deep_comment_search', args);

// 12. reddit_search_communities
const mcpRedditSearchCommunities = async (args = {}) => callMcpTool('reddit_search_communities', args);

// 13. reddit_search_media
const mcpRedditSearchMedia = async (args = {}) => callMcpTool('reddit_search_media', args);

// 14. reddit_search_users
const mcpRedditSearchUsers = async (args = {}) => callMcpTool('reddit_search_users', args);

// 15. reddit_user_profile
const mcpRedditUserProfile = async (name) => callMcpTool('reddit_user_profile', typeof name === 'object' ? name : { name });

// 16. reddit_user_achievements
const mcpRedditUserAchievements = async (args = {}) => callMcpTool('reddit_user_achievements', args);

// 17. reddit_user_comments
const mcpRedditUserComments = async (name, limit = 10) => callMcpTool('reddit_user_comments', typeof name === 'object' ? name : { name, limit });

// 18. reddit_user_submitted
const mcpRedditUserSubmitted = async (name, limit = 10) => callMcpTool('reddit_user_submitted', typeof name === 'object' ? name : { name, limit });

// 19. reddit_user_upvoted
const mcpRedditUserUpvoted = async (args = {}) => callMcpTool('reddit_user_upvoted', args);

// 20. reddit_user_saved
const mcpRedditUserSaved = async (args = {}) => callMcpTool('reddit_user_saved', args);

// 21. reddit_user_hidden
const mcpRedditUserHidden = async (args = {}) => callMcpTool('reddit_user_hidden', args);

// 22. reddit_user_gilded
const mcpRedditUserGilded = async (args = {}) => callMcpTool('reddit_user_gilded', args);

// 23. reddit_subreddit_comments
const mcpRedditSubredditComments = async (args = {}) => callMcpTool('reddit_subreddit_comments', args);

// 24. reddit_subreddit_about
const mcpRedditSubredditAbout = async (args = {}) => callMcpTool('reddit_subreddit_about', args);

// 25. reddit_subreddit_rules
const mcpRedditSubredditRules = async (args = {}) => callMcpTool('reddit_subreddit_rules', args);

// 26. reddit_by_id
const mcpRedditById = async (args = {}) => callMcpTool('reddit_by_id', args);

// 27. reddit_subreddits_popular
const mcpRedditSubredditsPopular = async (args = {}) => callMcpTool('reddit_subreddits_popular', args);

// 28. reddit_subreddits_new
const mcpRedditSubredditsNew = async (args = {}) => callMcpTool('reddit_subreddits_new', args);

// 29. reddit_subreddits_default
const mcpRedditSubredditsDefault = async (args = {}) => callMcpTool('reddit_subreddits_default', args);

// 30. reddit_subreddit_moderators
const mcpRedditSubredditModerators = async (args = {}) => callMcpTool('reddit_subreddit_moderators', args);

// 31. reddit_subreddit_wiki
const mcpRedditSubredditWiki = async (args = {}) => callMcpTool('reddit_subreddit_wiki', args);

// 32. reddit_monitor_add
const mcpRedditMonitorAdd = async (args = {}) => callMcpTool('reddit_monitor_add', args);

// 33. reddit_monitor_list
const mcpRedditMonitorList = async (args = {}) => callMcpTool('reddit_monitor_list', args);

// 34. reddit_monitor_update
const mcpRedditMonitorUpdate = async (args = {}) => callMcpTool('reddit_monitor_update', args);

// 35. reddit_monitor_remove
const mcpRedditMonitorRemove = async (args = {}) => callMcpTool('reddit_monitor_remove', args);

// 36. reddit_monitor_health
const mcpRedditMonitorHealth = async (args = {}) => callMcpTool('reddit_monitor_health', args);

// 37. reddit_monitor_deliveries
const mcpRedditMonitorDeliveries = async (args = {}) => callMcpTool('reddit_monitor_deliveries', args);

// 38. reddit_monitor_webhook_create
const mcpRedditMonitorWebhookCreate = async (args = {}) => callMcpTool('reddit_monitor_webhook_create', args);

// 39. reddit_monitor_webhook_list
const mcpRedditMonitorWebhookList = async (args = {}) => callMcpTool('reddit_monitor_webhook_list', args);

// 40. reddit_monitor_webhook_test
const mcpRedditMonitorWebhookTest = async (args = {}) => callMcpTool('reddit_monitor_webhook_test', args);

// 41. reddit_monitor_webhook_delete
const mcpRedditMonitorWebhookDelete = async (args = {}) => callMcpTool('reddit_monitor_webhook_delete', args);

// 42. reddit_feedback_send
const mcpRedditFeedbackSend = async (args = {}) => callMcpTool('reddit_feedback_send', args);

// 43. reddit_feedback_get
const mcpRedditFeedbackGet = async (args = {}) => callMcpTool('reddit_feedback_get', args);

// 44. reddit_account_me
const mcpRedditAccountMe = async (args = {}) => callMcpTool('reddit_account_me', args);

const all44McpToolsMap = {
  reddit_post_visibility: mcpRedditPostVisibility,
  reddit_search: mcpRedditSearch,
  reddit_subreddit_posts: mcpRedditSubredditPosts,
  reddit_home_feed: mcpRedditHomeFeed,
  reddit_verify_comments: mcpRedditVerifyComments,
  reddit_feedback_list: mcpRedditFeedbackList,
  reddit_subreddit_top: mcpRedditSubredditTop,
  reddit_post: mcpRedditPost,
  reddit_post_comments: mcpRedditPostComments,
  reddit_search_comments: mcpRedditSearchComments,
  reddit_deep_comment_search: mcpRedditDeepCommentSearch,
  reddit_search_communities: mcpRedditSearchCommunities,
  reddit_search_media: mcpRedditSearchMedia,
  reddit_search_users: mcpRedditSearchUsers,
  reddit_user_profile: mcpRedditUserProfile,
  reddit_user_achievements: mcpRedditUserAchievements,
  reddit_user_comments: mcpRedditUserComments,
  reddit_user_submitted: mcpRedditUserSubmitted,
  reddit_user_upvoted: mcpRedditUserUpvoted,
  reddit_user_saved: mcpRedditUserSaved,
  reddit_user_hidden: mcpRedditUserHidden,
  reddit_user_gilded: mcpRedditUserGilded,
  reddit_subreddit_comments: mcpRedditSubredditComments,
  reddit_subreddit_about: mcpRedditSubredditAbout,
  reddit_subreddit_rules: mcpRedditSubredditRules,
  reddit_by_id: mcpRedditById,
  reddit_subreddits_popular: mcpRedditSubredditsPopular,
  reddit_subreddits_new: mcpRedditSubredditsNew,
  reddit_subreddits_default: mcpRedditSubredditsDefault,
  reddit_subreddit_moderators: mcpRedditSubredditModerators,
  reddit_subreddit_wiki: mcpRedditSubredditWiki,
  reddit_monitor_add: mcpRedditMonitorAdd,
  reddit_monitor_list: mcpRedditMonitorList,
  reddit_monitor_update: mcpRedditMonitorUpdate,
  reddit_monitor_remove: mcpRedditMonitorRemove,
  reddit_monitor_health: mcpRedditMonitorHealth,
  reddit_monitor_deliveries: mcpRedditMonitorDeliveries,
  reddit_monitor_webhook_create: mcpRedditMonitorWebhookCreate,
  reddit_monitor_webhook_list: mcpRedditMonitorWebhookList,
  reddit_monitor_webhook_test: mcpRedditMonitorWebhookTest,
  reddit_monitor_webhook_delete: mcpRedditMonitorWebhookDelete,
  reddit_feedback_send: mcpRedditFeedbackSend,
  reddit_feedback_get: mcpRedditFeedbackGet,
  reddit_account_me: mcpRedditAccountMe,
};

module.exports = {
  getMcpClient,
  callMcpTool,
  listMcpTools,
  all44McpToolsMap,

  // All 44 Individual Tool Exports
  mcpRedditPostVisibility,
  mcpRedditSearch,
  mcpRedditSubredditPosts,
  mcpRedditHomeFeed,
  mcpRedditVerifyComments,
  mcpRedditFeedbackList,
  mcpRedditSubredditTop,
  mcpRedditPost,
  mcpRedditPostComments,
  mcpRedditSearchComments,
  mcpRedditDeepCommentSearch,
  mcpRedditSearchCommunities,
  mcpRedditSearchMedia,
  mcpRedditSearchUsers,
  mcpRedditUserProfile,
  mcpRedditUserAchievements,
  mcpRedditUserComments,
  mcpRedditUserSubmitted,
  mcpRedditUserUpvoted,
  mcpRedditUserSaved,
  mcpRedditUserHidden,
  mcpRedditUserGilded,
  mcpRedditSubredditComments,
  mcpRedditSubredditAbout,
  mcpRedditSubredditRules,
  mcpRedditById,
  mcpRedditSubredditsPopular,
  mcpRedditSubredditsNew,
  mcpRedditSubredditsDefault,
  mcpRedditSubredditModerators,
  mcpRedditSubredditWiki,
  mcpRedditMonitorAdd,
  mcpRedditMonitorList,
  mcpRedditMonitorUpdate,
  mcpRedditMonitorRemove,
  mcpRedditMonitorHealth,
  mcpRedditMonitorDeliveries,
  mcpRedditMonitorWebhookCreate,
  mcpRedditMonitorWebhookList,
  mcpRedditMonitorWebhookTest,
  mcpRedditMonitorWebhookDelete,
  mcpRedditFeedbackSend,
  mcpRedditFeedbackGet,
  mcpRedditAccountMe,
};
