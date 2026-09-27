import axios from 'axios';

async function fetchOpenRouterModelsList() {
  try {
    console.log(`Fetching live model list from https://openrouter.ai/api/v1/models...\n`);
    const res = await axios.get('https://openrouter.ai/api/v1/models', { timeout: 10000 });
    const models = res.data.data || [];

    console.log(`Total Models Available on OpenRouter: ${models.length}\n`);

    // Filter for Google, DeepSeek, Anthropic, Meta, and OpenAI models
    const topProviders = ['google', 'deepseek', 'anthropic', 'meta-llama', 'openai'];
    const filtered = models.filter(m => topProviders.some(p => m.id.startsWith(p)));

    console.log(`Top Provider Models Available:`);
    filtered.slice(0, 25).forEach(m => {
      const promptCost = (parseFloat(m.pricing?.prompt || '0') * 1000000).toFixed(3);
      const completionCost = (parseFloat(m.pricing?.completion || '0') * 1000000).toFixed(3);
      console.log(`- ID: ${m.id}`);
      console.log(`  Name: ${m.name}`);
      console.log(`  Context: ${m.context_length} tokens`);
      console.log(`  Price (per 1M): Input $${promptCost} | Output $${completionCost}`);
      console.log(``);
    });
  } catch (err) {
    console.error(`Failed to fetch models list:`, err.message);
  }
}

fetchOpenRouterModelsList();
