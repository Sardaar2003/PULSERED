import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testProwlo() {
  const apiKey = process.env.PROWLO_API_KEY;
  console.log('Testing Prowlo API with key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING');
  if (!apiKey) return;

  try {
    const res = await axios.post(
      'https://api.prowlo.com/v1/search',
      {
        q: 'affordable security cameras homeowners',
        platform: 'reddit',
        mode: 'semantic',
        limit: 5,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Prowlo API Response Status:', res.status);
    const items = res.data?.data?.items || res.data?.results || res.data?.data || [];
    console.log('Total items returned:', items.length);
    if (items.length > 0) {
      console.log('First Item Keys:', Object.keys(items[0]));
      console.log('First Item Author:', items[0].author);
      console.log('First Item Title:', items[0].title);
      console.log('First Item Comments:', items[0].comments || items[0].threadComments || items[0].replies);
    }
  } catch (err) {
    console.error('Prowlo API Test Error:', err.response?.data || err.message);
  }
}

testProwlo();
