const axios = require('axios');
const logger = require('../logger');

/**
 * Universal AI Client
 * Prioritizes official OpenAI API (gpt-4o-mini) for industry-leading quality,
 * ultra-low cost ($0.15/1M input tokens), and generous RPM rate limits (eliminates 429 errors).
 * Seamlessly falls back to OpenRouter if OPENAI_API_KEY is missing.
 */
const getAiConfig = () => {
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const openrouterKey = (process.env.OPENROUTER_API_KEY || '').trim();

  const isOpenAiValid = openaiKey && !openaiKey.includes('your_openai_api_key_here');
  const isOpenRouterValid = openrouterKey && !openrouterKey.includes('your_openrouter_api_key_here');

  // 1. Primary: Official OpenAI API
  if (isOpenAiValid) {
    return {
      provider: 'openai',
      apiKey: openaiKey,
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // 2. Secondary Fallback: OpenRouter
  if (isOpenRouterValid) {
    return {
      provider: 'openrouter',
      apiKey: openrouterKey,
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      defaultModel: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pulsered.com',
        'X-Title': 'PulseRed AI Outreach Platform',
      },
    };
  }

  return { provider: 'none', apiKey: null };
};

/**
 * Executes a resilient Chat Completion request with automatic retry and provider awareness.
 */
const callAiCompletion = async ({
  messages,
  model,
  responseFormat,
  temperature = 0.7,
  timeout = 16000,
  maxTokens,
}) => {
  const config = getAiConfig();
  if (config.provider === 'none') {
    throw new Error('Neither OPENAI_API_KEY nor OPENROUTER_API_KEY is configured in .env');
  }

  const selectedModel = model || config.defaultModel;

  const payload = {
    model: selectedModel,
    messages,
    temperature,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }
  if (maxTokens) {
    payload.max_tokens = maxTokens;
  }

  let lastError = null;
  // Up to 2 retry attempts for transient network issues or rate limits
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await axios.post(config.baseUrl, payload, {
        headers: config.headers,
        timeout,
      });

      const content = res.data?.choices?.[0]?.message?.content || '';
      return {
        content,
        raw: res.data,
        provider: config.provider,
        model: selectedModel,
      };
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      if (status === 429 && attempt === 0) {
        logger.warn(`[${config.provider.toUpperCase()}] Rate limit (429) hit. Backing off 2000ms...`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      break;
    }
  }

  throw lastError;
};

module.exports = {
  getAiConfig,
  callAiCompletion,
};
