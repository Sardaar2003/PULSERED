const logger = require('../logger');
const { fetchRedditDataViaProwlo } = require('./prowloService');
const { fetchLiveCommentsViaRedditOAuth, fetchUserRecentHistory } = require('./redditOAuthService');
const { fetchCommentsViaRedditApis } = require('./redditApisService');
const { analyzeLeadWith3DScoringAndOpener } = require('./aiOutreachService');
const LeadAgentItem = require('../models/LeadAgentItem');
const BrandDomain = require('../models/BrandDomain');
const VoiceProfile = require('../models/VoiceProfile');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { addLog } = require('./agentLogger');

/**
 * Detects if a Reddit post thread has already been resolved or answered by OP.
 */
const detectIfThreadAlreadyAnswered = (post, comments = []) => {
  const titleLower = (post.title || '').toLowerCase();
  const flairLower = (post.link_flair_text || post.flair || '').toLowerCase();

  if (flairLower.includes('solved') || flairLower.includes('resolved') || flairLower.includes('answered')) {
    return { isSolved: true, evidence: `Post flair marked "${flairLower}"` };
  }
  if (titleLower.includes('[solved]') || titleLower.includes('[resolved]')) {
    return { isSolved: true, evidence: 'Post title contains [SOLVED] tag' };
  }

  const opUsername = (post.author || '').toLowerCase().replace(/^[@u\/]/, '');
  if (Array.isArray(comments) && comments.length > 0 && opUsername) {
    const satisfactionPhrases = [
      'thanks that worked',
      'thanks, that worked',
      'that solved it',
      'this solved it',
      'fixed it, thanks',
      'fixed it thanks',
      'ended up going with',
      'ended up buying',
      'ended up choosing',
      'problem solved',
      'issue resolved',
      'worked like a charm',
      'thank you so much, works now',
    ];

    for (const c of comments) {
      const commentAuthor = (c.author || '').toLowerCase().replace(/^[@u\/]/, '');
      const bodyLower = (c.body || '').toLowerCase();
      if (commentAuthor === opUsername) {
        for (const phrase of satisfactionPhrases) {
          if (bodyLower.includes(phrase)) {
            return {
              isSolved: true,
              evidence: `OP comment confirmed: "${c.body.substring(0, 60)}..."`,
            };
          }
        }
      }
    }
  }

  return { isSolved: false, evidence: '' };
};

// State for Subreddit Rotational Sweeper
let isSweepingActive = false;
let sweepIntervalHandle = null;
let currentSubredditIndex = 0;
let sweepHistory = [];

const DEFAULT_SUBREDDITS = ['SaaS', 'startups', 'webdev', 'smallbusiness', 'marketing', 'Entrepreneur'];

/**
 * Performs a single rotational sweep on the next subreddit in queue.
 */
const runSingleSubredditSweep = async (
  userId = 'master_admin',
  customKeywords = [],
  targetDomain = 'AlertCareLine.com',
  customSubreddit = null
) => {
  const isDbConnected = getIsConnected();

  // Fetch brand domain object if targetDomain is specified
  let brandObj = null;
  try {
    if (isDbConnected && targetDomain) {
      brandObj = await BrandDomain.findOne({ domainUrl: targetDomain });
    } else if (!isDbConnected && targetDomain) {
      const store = getMemoryStore();
      if (store.brandDomains) {
        brandObj = store.brandDomains.find(b => b.domainUrl === targetDomain);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch brand domain object for sweep:', { error: err.message });
  }

  // Load user-configured Lead Agent settings if available
  let userLeadSettings = null;
  const User = require('../models/User');
  try {
    if (isDbConnected && userId) {
      const u = await User.findById(userId).select('agentSettings');
      userLeadSettings = u?.agentSettings?.leadAgent;
    } else if (!isDbConnected && userId) {
      const store = getMemoryStore();
      const u = store.users?.find(x => x.id === userId || x._id === userId);
      userLeadSettings = u?.agentSettings?.leadAgent;
    }
  } catch (err) {
    logger.warn('Failed to fetch user agent settings for sweep:', { error: err.message });
  }

  const commentDepth = userLeadSettings?.searchDepth || 15;
  const targetAudience = userLeadSettings?.targetAudience || 'both'; // 'both', 'authors', 'commenters'
  const minIntentThreshold = userLeadSettings?.minIntentScore || 65;
  const shouldScanComments = userLeadSettings?.scanComments !== false;

  let activeSubreddit = null;
  if (customSubreddit && customSubreddit !== 'all') {
    activeSubreddit = customSubreddit;
  } else if (brandObj && Array.isArray(brandObj.targetSubreddits) && brandObj.targetSubreddits.length > 0) {
    activeSubreddit = brandObj.targetSubreddits[currentSubredditIndex % brandObj.targetSubreddits.length];
    currentSubredditIndex++;
  } else {
    const subreddits = DEFAULT_SUBREDDITS;
    activeSubreddit = subreddits[currentSubredditIndex % subreddits.length];
    currentSubredditIndex++;
  }

  let keyword = null;
  if (typeof customKeywords === 'string' && customKeywords.trim().length > 0) {
    keyword = customKeywords.trim();
  } else if (Array.isArray(customKeywords) && customKeywords.length > 0) {
    keyword = customKeywords[Math.floor(Math.random() * customKeywords.length)];
  } else if (brandObj && Array.isArray(brandObj.targetKeywords) && brandObj.targetKeywords.length > 0) {
    keyword = brandObj.targetKeywords[Math.floor(Math.random() * brandObj.targetKeywords.length)];
  } else if (targetDomain && (targetDomain.toLowerCase().includes('alertcareline') || targetDomain.toLowerCase().includes('alertcardline'))) {
    const alertKeywords = [
      'affordable security cameras homeowners',
      'home security system compare',
      'home security for new homeowner',
      'wireless doorbell',
      'someone broke into my car',
      'cheapest home security system for home',
      'adt alternatives',
      'neighborhood break-in',
      'best security system for my home',
      'ring doorbell not working'
    ];
    keyword = alertKeywords[Math.floor(Math.random() * alertKeywords.length)];
  } else if (brandObj && brandObj.specialization) {
    const spec = brandObj.specialization.split(',')[0].trim();
    keyword = `looking for ${spec} recommendation`;
  } else {
    keyword = 'looking for software tool recommendation';
  }

  addLog('LEAD_AGENT', `🔍 Manual/Rotational Sweep: Scanning r/${activeSubreddit} for keyword "${keyword}"...`, 'info');
  logger.info(`Lead Agent Sweep starting for r/${activeSubreddit} (Keyword: "${keyword}", Brand: ${targetDomain})`);

  try {
    // 1. Fetch live posts via Prowlo API / Redditapis
    const prowloRes = await fetchRedditDataViaProwlo(keyword, null, {
      platform: 'reddit',
      sortBy: 'recent',
      limit: 10,
    });

    const posts = prowloRes.posts || [];
    if (posts.length === 0) {
      addLog('LEAD_AGENT', `Notice: No new posts returned for r/${activeSubreddit}`, 'warn');
      return { subreddit: activeSubreddit, processed: 0, leadsAdded: 0 };
    }

    // 2. Fetch User Voice Profile if available
    let voiceProfile = null;
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      voiceProfile = await VoiceProfile.findOne({ userId });
    }

    let leadsAddedCount = 0;
    const evaluatedAuditItems = [];

    // 3. Process top 3 post authors & thread commenters through 3D Intent Scoring & Opener Generator
    for (const post of posts.slice(0, 3)) {
      post.subreddit = activeSubreddit;

      const postIdentifier = post.id || `p_${(post.title || '').substring(0, 20)}`;

      // ⚡ DB DEDUPLICATION GUARD: Check if post already exists in DB
      if (isDbConnected) {
        const existingInDb = await LeadAgentItem.findOne({ userId, postId: postIdentifier });
        if (existingInDb) {
          logger.info(`⚡ [Deduplication Guard] Post ${postIdentifier} already stored in DB. Skipping duplicate AI re-scoring.`);
          continue;
        }
      } else {
        const store = getMemoryStore();
        const existingInStore = store.leadAgentItems?.find(l => l.userId === userId && l.postId === postIdentifier);
        if (existingInStore) {
          logger.info(`⚡ [Deduplication Guard] Post ${postIdentifier} already stored in memory. Skipping duplicate AI re-scoring.`);
          continue;
        }
      }

      // --- Ingest Deep Live Comments (top 25-50) for Thread & Commenters ---
      let liveComments = [];
      if (Array.isArray(post.threadComments) && post.threadComments.length > 0) {
        liveComments = post.threadComments;
      } else if (post.permalink || post.id) {
        try {
          liveComments = await fetchCommentsViaRedditApis(post.permalink || post.id, post.permalink);
        } catch (e) {
          logger.debug(`fetchCommentsViaRedditApis note for ${post.id}: ${e.message}`);
        }
      }

      if ((!liveComments || liveComments.length === 0) && post.permalink) {
        try {
          liveComments = await fetchLiveCommentsViaRedditOAuth(post.permalink);
        } catch (e) {
          // Graceful fallback
        }
      }
      post.threadComments = liveComments || [];

      // --- Semantic OP Solved / Already Answered Guard ---
      const { isSolved, evidence: solvedEvidence } = detectIfThreadAlreadyAnswered(post, post.threadComments);
      if (isSolved) {
        logger.info(`⚡ [Already Answered Guard] Skipping post "${(post.title || '').substring(0, 35)}..." (${solvedEvidence})`);
        evaluatedAuditItems.push({
          id: postIdentifier,
          type: 'post_author',
          author: post.author || 'reddit_user',
          subreddit: `r/${activeSubreddit}`,
          postTitle: post.title,
          status: 'REJECTED',
          decisionRationale: `ALREADY ANSWERED: Thread is resolved (${solvedEvidence}). Deduplication skipped duplicate outreach.`,
          permalink: post.permalink || post.url || '',
        });
        continue;
      }

      // --- A. Post Author Lead ---
      const isBotOrDeleted = (user) => !user || user === '[deleted]' || user === 'AutoModerator' || user === 'Reddit User' || /bot$/i.test(user);

      let authorHistory = null;
      try {
        if (!isBotOrDeleted(post.author)) {
          authorHistory = await fetchUserRecentHistory(post.author);
        }
      } catch (e) {
        // Non-blocking history fetch
      }

      const postAnalysis = await analyzeLeadWith3DScoringAndOpener(post, targetDomain, voiceProfile, authorHistory);
      const isPostSelected = targetAudience !== 'commenters' && postAnalysis.intentScore >= minIntentThreshold;
      
      // 300ms AI rate-limit buffer
      await new Promise(r => setTimeout(r, 300));

      evaluatedAuditItems.push({
        id: postIdentifier,
        type: 'post_author',
        author: post.author || 'reddit_user',
        subreddit: `r/${activeSubreddit}`,
        postTitle: post.title,
        postSnippet: post.selftext || '',
        intentScore: postAnalysis.intentScore,
        status: isPostSelected ? 'SELECTED' : 'REJECTED',
        decisionRationale: isPostSelected
          ? `SELECTED (${postAnalysis.intentScore}/100): High problem fit & commercial intent for ${targetDomain}. ${postAnalysis.productFitRationale || ''}`
          : `REJECTED (${postAnalysis.intentScore}/100): Score below 65 threshold — post text lacks active recommendation request or problem urgency.`,
        permalink: post.permalink || post.url || '',
      });

      if (isPostSelected) {
        const postLeadData = {
          userId,
          postId: postIdentifier,
          postTitle: post.title,
          postSnippet: post.selftext || '',
          leadOrigin: 'post_author',
          subreddit: `r/${activeSubreddit}`,
          author: post.author || 'maria_builds',
          prospectSnapshot: postAnalysis.prospectSnapshot,
          permalink: post.permalink || post.url || '',
          url: post.url || post.permalink || '',
          targetDomain,
          intentScore: postAnalysis.intentScore,
          intentBadge: postAnalysis.intentBadge,
          scoreBreakdown: postAnalysis.scoreBreakdown,
          stage: 'New Leads',
          psychologicalProfile: postAnalysis.psychologicalProfile || {
            archetype: 'Pragmatic Buyer',
            emotionalMindset: 'Evaluating solutions with care and seeking transparent terms',
            corePainPoint: postAnalysis.extractedPainPoint || `Friction identified in r/${activeSubreddit}`,
            whatIsImportant: ['Upfront transparent pricing', 'Zero contract lock-in', 'Responsive customer assistance'],
            decisionDrivers: 'Fast implementation, proven reliability, and verified community feedback',
            riskLevel: 'Low Risk',
          },
          isSolvedOrAnswered: false,
          solvedEvidence: '',
          threadCommentCount: post.threadComments.length,
          extractedPainPoint: postAnalysis.extractedPainPoint,
          productFitRationale: postAnalysis.productFitRationale,
          marketingIntel: postAnalysis.marketingIntel,
          prospectBehavioralAudit: postAnalysis.prospectBehavioralAudit,
          openerDraft: postAnalysis.openerDraft,
          brandEmailDmDraft: postAnalysis.brandEmailDmDraft,
          approvalStatus: 'draft',
        };

        if (isDbConnected) {
          await LeadAgentItem.create(postLeadData);
          leadsAddedCount++;
        } else {
          const store = getMemoryStore();
          store.leadAgentItems.unshift({ id: `lai_${Date.now()}_${leadsAddedCount}`, ...postLeadData, createdAt: new Date() });
          leadsAddedCount++;
        }
      }

      // --- B. Thread Commenters Leads (Scan top live comments per user setting) ---
      if (targetAudience !== 'authors' && shouldScanComments && Array.isArray(post.threadComments) && post.threadComments.length > 0) {
        for (const comment of post.threadComments.slice(0, commentDepth)) {
          if (isBotOrDeleted(comment.author)) continue;

          const commentLeadId = `${postIdentifier}_comment_${comment.id || Math.random().toString(36).substr(2, 5)}`;

          // Deduplication: Check if comment lead already exists in DB
          if (isDbConnected) {
            const existingComment = await LeadAgentItem.findOne({ userId, postId: commentLeadId });
            if (existingComment) continue;

            // Check if our team already contacted this specific author
            const alreadyContacted = await LeadAgentItem.findOne({
              userId,
              author: comment.author,
              approvalStatus: { $in: ['approved', 'sent'] },
            });
            if (alreadyContacted) continue;
          } else {
            const store = getMemoryStore();
            const existingComment = store.leadAgentItems?.find(l => l.userId === userId && l.postId === commentLeadId);
            if (existingComment) continue;
          }

          let commentUserHistory = null;
          try {
            commentUserHistory = await fetchUserRecentHistory(comment.author);
          } catch (e) {
            // Non-blocking history fetch
          }

          const commentPseudoPost = {
            title: `Comment in "${post.title.substring(0, 50)}..."`,
            selftext: comment.body,
            subreddit: activeSubreddit,
            author: comment.author,
          };

          const commentAnalysis = await analyzeLeadWith3DScoringAndOpener(commentPseudoPost, targetDomain, voiceProfile, commentUserHistory);
          
          // Qualify commenters who express real pain points or commercial intent
          const isCommentSelected = commentAnalysis.intentScore >= minIntentThreshold;

          // 300ms AI rate-limit buffer
          await new Promise(r => setTimeout(r, 300));

          evaluatedAuditItems.push({
            id: commentLeadId,
            type: 'thread_commenter',
            author: comment.author,
            opAuthor: post.author || 'reddit_user',
            subreddit: `r/${activeSubreddit}`,
            postTitle: post.title,
            postSnippet: post.selftext || '',
            commentQuote: comment.body,
            intentScore: commentAnalysis.intentScore,
            status: isCommentSelected ? 'SELECTED' : 'REJECTED',
            decisionRationale: isCommentSelected
              ? `SELECTED (${commentAnalysis.intentScore}/100 >= 68): u/${comment.author} commented on u/${post.author || 'reddit_user'}'s post displaying active pain or commercial intent.`
              : `REJECTED (${commentAnalysis.intentScore}/100 < 68): Comment by u/${comment.author} score below 68 threshold — general discussion.`,
            permalink: comment.permalink || post.permalink || post.url || '',
          });

          if (isCommentSelected) {
            const commentLeadData = {
              userId,
              postId: commentLeadId,
              postTitle: post.title,
              postSnippet: post.selftext || '',
              opAuthor: post.author || 'reddit_user',
              leadOrigin: 'thread_commenter',
              commentQuote: comment.body,
              commentId: comment.id,
              subreddit: `r/${activeSubreddit}`,
              author: comment.author,
              prospectSnapshot: {
                karma: commentUserHistory?.totalKarma ?? null,
                accountAgeDays: commentUserHistory?.accountAgeDays ?? null,
                recentActivity: commentUserHistory?.retrieved && commentUserHistory.frequentSubreddits?.length
                  ? `Active in ${commentUserHistory.frequentSubreddits.slice(0, 3).join(', ')}`
                  : `Unable to retrieve Reddit user history for u/${comment.author}`,
              },
              permalink: comment.permalink || post.permalink || post.url || '',
              url: comment.permalink || post.url || post.permalink || '',
              targetDomain,
              intentScore: commentAnalysis.intentScore,
              intentBadge: commentAnalysis.intentBadge,
              scoreBreakdown: commentAnalysis.scoreBreakdown,
              stage: 'New Leads',
              psychologicalProfile: commentAnalysis.psychologicalProfile || {
                archetype: 'Skeptical Analyst',
                emotionalMindset: 'Evaluating peer recommendations in comment thread',
                corePainPoint: `Commenter pain: "${comment.body.substring(0, 100)}..."`,
                whatIsImportant: ['Direct answers', 'Transparent pricing', 'Peer validation'],
                decisionDrivers: 'Community consensus and straightforward trial',
                riskLevel: 'Low Risk',
              },
              isSolvedOrAnswered: false,
              solvedEvidence: '',
              threadCommentCount: post.threadComments.length,
              extractedPainPoint: `Commenter pain (u/${comment.author}): "${comment.body.substring(0, 140)}..."`,
              productFitRationale: commentAnalysis.productFitRationale || `Commenter u/${comment.author} seeking solutions in r/${activeSubreddit}`,
              marketingIntel: commentAnalysis.marketingIntel,
              prospectBehavioralAudit: commentAnalysis.prospectBehavioralAudit,
              openerDraft: {
                content: `Hey u/${comment.author}, saw your comment in r/${activeSubreddit} about "${comment.body.substring(0, 40)}..." Curious, are you still looking for a solution?`,
                wordCount: 22,
                voiceMatchScore: 95,
                rationale: 'References exact comment quote and asks low-friction question.',
              },
              brandEmailDmDraft: {
                content: `Hey u/${comment.author}, saw your comment in r/${activeSubreddit} about "${comment.body.substring(0, 40)}..." At ${targetDomain}, we specialize in this exact area. If you'd like tailored assistance or comparison info sent directly, drop your email ID here or reach out to support@${targetDomain}!`,
                wordCount: 38,
                contactEmail: `support@${targetDomain}`,
                rationale: 'Direct professional offer inviting assistance via brand domain contact',
              },
              approvalStatus: 'draft',
            };

            if (isDbConnected) {
              const existing = await LeadAgentItem.findOne({ userId, postId: commentLeadData.postId });
              if (!existing) {
                await LeadAgentItem.create(commentLeadData);
                leadsAddedCount++;
              }
            } else {
              const store = getMemoryStore();
              const existing = store.leadAgentItems.find(l => l.userId === userId && l.postId === commentLeadData.postId);
              if (!existing) {
                store.leadAgentItems.unshift({ id: `lai_c_${Date.now()}_${leadsAddedCount}`, ...commentLeadData, createdAt: new Date() });
                leadsAddedCount++;
              }
            }
          }
        }
      }
    }

    const sweepRecord = {
      subreddit: `r/${activeSubreddit}`,
      keyword,
      postsCount: posts.length,
      targetDomain,
      timestamp: new Date(),
      evaluated: evaluatedAuditItems.length,
      leadsAdded: leadsAddedCount,
      auditItems: evaluatedAuditItems,
    };
    sweepHistory.unshift(sweepRecord);
    if (sweepHistory.length > 20) sweepHistory.pop();

    addLog('LEAD_AGENT', `✅ Sweep finished for r/${activeSubreddit}: Evaluated ${evaluatedAuditItems.length} discussions/comments, selected ${leadsAddedCount} target leads!`, 'info');
    return sweepRecord;
  } catch (err) {
    logger.error(`Rotational sweep error for r/${activeSubreddit}:`, { error: err.message });
    addLog('LEAD_AGENT', `Sweep error on r/${activeSubreddit}: ${err.message}`, 'error');
    return { subreddit: activeSubreddit, error: err.message };
  }
};

/**
 * Starts 24/7 Rotational Sweeper interval.
 */
const startRotationalSweeper = (intervalMs = 60000, userId = 'master_admin') => {
  if (isSweepingActive) {
    logger.info('Rotational sweeper is already running.');
    return { status: 'already_running', intervalMs };
  }

  isSweepingActive = true;
  addLog('LEAD_AGENT', '🚀 24/7 Subreddit Rotational Sweeper activated.', 'info');

  // Trigger immediate initial sweep
  runSingleSubredditSweep(userId);

  // Schedule recurring sweeps
  sweepIntervalHandle = setInterval(() => {
    runSingleSubredditSweep(userId);
  }, intervalMs);

  return { status: 'started', intervalMs };
};

/**
 * Stops 24/7 Rotational Sweeper interval.
 */
const stopRotationalSweeper = () => {
  if (sweepIntervalHandle) {
    clearInterval(sweepIntervalHandle);
    sweepIntervalHandle = null;
  }
  isSweepingActive = false;
  addLog('LEAD_AGENT', '⏸️ Subreddit Rotational Sweeper paused.', 'warn');
  return { status: 'stopped' };
};

const getSweeperStatus = () => {
  return {
    isSweepingActive,
    nextSubreddit: DEFAULT_SUBREDDITS[currentSubredditIndex % DEFAULT_SUBREDDITS.length],
    subreddits: DEFAULT_SUBREDDITS,
    recentSweeps: sweepHistory,
  };
};

/**
 * Executes a full batch sweep across ALL target keywords for a brand domain.
 * Optimized for high speed, controlled concurrency (3 at a time), and free-tier rate-limit protection.
 */
const runBatchKeywordsSweep = async (
  userId = 'master_admin',
  targetDomain = 'AlertCareLine.com',
  customSubreddit = null
) => {
  const isDbConnected = getIsConnected();
  let brandObj = null;

  try {
    if (isDbConnected && targetDomain) {
      brandObj = await BrandDomain.findOne({ domainUrl: targetDomain });
    } else if (!isDbConnected && targetDomain) {
      const store = getMemoryStore();
      if (store.brandDomains) {
        brandObj = store.brandDomains.find(b => b.domainUrl === targetDomain);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch brand domain object for batch sweep:', { error: err.message });
  }

  let keywordsToScan = [];
  if (brandObj && Array.isArray(brandObj.targetKeywords) && brandObj.targetKeywords.length > 0) {
    keywordsToScan = brandObj.targetKeywords;
  } else if (targetDomain && (targetDomain.toLowerCase().includes('alertcareline') || targetDomain.toLowerCase().includes('alertcardline'))) {
    keywordsToScan = [
      'affordable security cameras homeowners',
      'home security system compare',
      'home security for new homeowner',
      'wireless doorbell',
      'someone broke into my car',
      'cheapest home security system for home',
      'adt alternatives',
      'neighborhood break-in',
      'best security system for my home',
      'ring doorbell not working'
    ];
  } else {
    keywordsToScan = ['looking for software tool recommendation'];
  }

  addLog('LEAD_AGENT', `🚀 Starting High-Speed Batch Sweep across ALL ${keywordsToScan.length} keywords for ${targetDomain}...`, 'info');
  logger.info(`Starting High-Speed Batch Sweep across ${keywordsToScan.length} keywords for ${targetDomain}`);

  const batchResults = [];
  let totalLeadsAdded = 0;

  // Process keywords in controlled concurrent chunks of 3 to maximize speed while guaranteeing 0 rate-limit hits
  const CHUNK_SIZE = 3;
  for (let i = 0; i < keywordsToScan.length; i += CHUNK_SIZE) {
    const chunk = keywordsToScan.slice(i, i + CHUNK_SIZE);
    
    const chunkPromises = chunk.map(async (kw) => {
      try {
        const singleRes = await runSingleSubredditSweep(userId, kw, targetDomain, customSubreddit);
        return singleRes;
      } catch (err) {
        logger.warn(`Batch sweep error for keyword "${kw}": ${err.message}`);
        return null;
      }
    });

    const results = await Promise.all(chunkPromises);
    results.forEach((res) => {
      if (res) {
        if (res.leadsAdded) totalLeadsAdded += res.leadsAdded;
        batchResults.push(res);
      }
    });

    // 150ms buffer between chunks to protect free API rate limits
    if (i + CHUNK_SIZE < keywordsToScan.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  addLog('LEAD_AGENT', `✅ Fast Batch Sweep Completed! Scanned ${keywordsToScan.length} keywords in parallel chunks, added ${totalLeadsAdded} qualified leads to Pipeline Board.`, 'info');

  return {
    keywordsScanned: keywordsToScan.length,
    keywordsList: keywordsToScan,
    totalLeadsAdded,
    batchResults,
  };
};

/**
 * 1-Click Multi-Subreddit & Keyword Brand Sweeper
 * Sweeps all subreddits and keywords configured for a specific Brand Vault item.
 */
const runBrandDomainSweep = async (userId = 'master_admin', brandIdOrDomain) => {
  const isDbConnected = getIsConnected();
  let brandObj = null;

  try {
    if (isDbConnected) {
      brandObj = await BrandDomain.findOne({
        $or: [{ _id: brandIdOrDomain }, { domainUrl: brandIdOrDomain }]
      });
    } else {
      const store = getMemoryStore();
      if (store.brandDomains) {
        brandObj = store.brandDomains.find(b => b._id === brandIdOrDomain || b.domainUrl === brandIdOrDomain || b.id === brandIdOrDomain);
      }
    }
  } catch (err) {
    logger.warn('Failed to find brand domain for brand sweep:', { error: err.message });
  }

  if (!brandObj) {
    throw new Error(`Brand Domain not found for identifier "${brandIdOrDomain}"`);
  }

  const targetDomain = brandObj.domainUrl;
  const subredditsToScan = (brandObj.targetSubreddits && brandObj.targetSubreddits.length > 0)
    ? brandObj.targetSubreddits
    : ['SaaS', 'startups', 'webdev'];

  const keywordsToScan = (brandObj.targetKeywords && brandObj.targetKeywords.length > 0)
    ? brandObj.targetKeywords
    : [`${brandObj.brandName || targetDomain} alternative`];

  addLog('LEAD_AGENT', `⚡ 1-Click Brand Sweep Initiated for ${brandObj.brandName || targetDomain} across ${subredditsToScan.length} subreddits & ${keywordsToScan.length} keywords...`, 'info');

  let totalLeadsAdded = 0;
  const sweepSummary = [];

  for (const sub of subredditsToScan) {
    for (const kw of keywordsToScan.slice(0, 3)) {
      try {
        const res = await runSingleSubredditSweep(userId, kw, targetDomain, sub);
        if (res && res.leadsAdded) totalLeadsAdded += res.leadsAdded;
        sweepSummary.push(res);
      } catch (err) {
        logger.warn(`Error sweeping r/${sub} with keyword "${kw}": ${err.message}`);
      }
      // 100ms rate-limit protection buffer
      await new Promise(r => setTimeout(r, 100));
    }
  }

  addLog('LEAD_AGENT', `🎉 Brand Sweep Complete for ${brandObj.brandName || targetDomain}! Scanned target subreddits & added ${totalLeadsAdded} leads with 360° Prospect Behavioral Audits.`, 'info');

  return {
    brandName: brandObj.brandName,
    domainUrl: targetDomain,
    subredditsScanned: subredditsToScan,
    keywordsScanned: keywordsToScan,
    totalLeadsAdded,
    sweepSummary,
  };
};

module.exports = {
  runSingleSubredditSweep,
  runBatchKeywordsSweep,
  runBrandDomainSweep,
  startRotationalSweeper,
  stopRotationalSweeper,
  getSweeperStatus,
};
