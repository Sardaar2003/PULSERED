import axios from 'axios';

async function testReddit() {
  const urls = [
    'https://www.reddit.com/r/homesecurity/comments/1w7lhls/new_home_security_system.json',
    'https://old.reddit.com/r/homesecurity/comments/1w7lhls/new_home_security_system.json',
    'https://api.reddit.com/r/homesecurity/comments/1w7lhls/new_home_security_system.json',
  ];

  const userAgents = [
    'android:com.pulsered.app:v1.0.0 (by /u/pulsered_bot)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
    'PulseRedBot/1.0',
    'curl/7.68.0',
  ];

  for (const url of urls) {
    for (const ua of userAgents) {
      try {
        const res = await axios.get(url, {
          headers: { 'User-Agent': ua },
          timeout: 5000,
        });
        console.log(`SUCCESS [${url}] [${ua.substring(0, 20)}...]: Status ${res.status}, comments count: ${res.data?.[1]?.data?.children?.length}`);
      } catch (err) {
        console.log(`FAILED [${url}] [${ua.substring(0, 20)}...]: ${err.response?.status || err.message}`);
      }
    }
  }
}

testReddit();
