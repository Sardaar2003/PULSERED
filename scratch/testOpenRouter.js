import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testAllOpenRouterModels() {
  const apiKey = (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here')
    ? process.env.OPENROUTER_API_KEY
    : process.env.OPENAI_API_KEY;

  console.log(`\n--- OpenRouter Endpoint Scan ---`);

  const candidates = [
    'deepseek/deepseek-chat',
    'google/gemini-2.5-flash',
    'google/gemini-flash-1.5-8b',
    'google/gemini-2.0-flash',
    'meta-llama/llama-3.3-70b-instruct',
    'anthropic/claude-3.5-haiku',
    'openai/gpt-4o-mini',
    'qwen/qwen-2.5-72b-instruct'
  ];

  const working = [];

  for (const model of candidates) {
    try {
      const startTime = Date.now();
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [
            { role: 'user', content: 'Reply JSON: {"ok": true}' }
          ],
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://pulsered.com',
            'X-Title': 'PulseRed AI Test',
          },
          timeout: 8000,
        }
      );

      const elapsed = Date.now() - startTime;
      console.log(`✅ ACTIVE: "${model}" (${elapsed}ms) -> ${response.data.choices[0].message.content.trim()}`);
      working.push({ model, elapsed });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      console.log(`❌ UNAVAILABLE: "${model}" -> ${msg}`);
    }
  }

  console.log(`\nSummary of Active Working Models:`, working);
}

testAllOpenRouterModels();
