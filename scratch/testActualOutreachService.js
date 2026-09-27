import dotenv from 'dotenv';
import { analyzePostAndDraftReply } from '../server/services/aiOutreachService.js';

dotenv.config();

async function runLiveOutreachTest() {
  console.log(`\n==================================================`);
  console.log(`🚀 RUNNING LIVE OPENROUTER OUTREACH TEST`);
  console.log(`==================================================`);
  console.log(`Model: ${process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat'}`);

  const mockPost = {
    title: 'Looking for an alternative to Intercom that has automated lead scoring and Reddit monitoring',
    selftext: 'Our team is spending way too much time manually scanning subreddits for potential clients. We need a tool that automatically scans Reddit, scores intent, and lets us approve DMs before sending.',
    subreddit: 'SaaS',
    author: 'alex_founder',
  };

  const targetDomain = 'PulseRed.ai';
  const tone = 'helpful_expert';

  console.log(`\nInputs:`);
  console.log(`- Subreddit: r/${mockPost.subreddit}`);
  console.log(`- Author: u/${mockPost.author}`);
  console.log(`- Title: "${mockPost.title}"`);
  console.log(`- Target Domain: ${targetDomain}`);

  console.log(`\nCalling OpenRouter API...`);
  const startTime = Date.now();
  const result = await analyzePostAndDraftReply(mockPost, targetDomain, tone);
  const duration = Date.now() - startTime;

  console.log(`\n==================================================`);
  console.log(`🎉 TEST COMPLETED IN ${duration}ms!`);
  console.log(`==================================================`);
  console.log(JSON.stringify(result, null, 2));
}

runLiveOutreachTest();
