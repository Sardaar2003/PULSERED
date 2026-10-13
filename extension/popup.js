// PulseRed Connect Extension Script
document.addEventListener('DOMContentLoaded', async () => {
  const redditStatus = document.getElementById('redditStatus');
  const statusDot = document.getElementById('statusDot');
  const redditUserText = document.getElementById('redditUserText');
  const serverUrlInput = document.getElementById('serverUrl');
  const authTokenInput = document.getElementById('authToken');
  const connectBtn = document.getElementById('connectBtn');
  const alertBox = document.getElementById('alertBox');
  const btnText = document.getElementById('btnText');

  let detectedUsername = 'Wild-Western-6399';
  let redditCookies = {};

  // Restore saved settings
  chrome.storage.local.get(['serverUrl', 'authToken', 'lastUsername'], (items) => {
    serverUrlInput.value = items.serverUrl || 'http://localhost:5000';
    authTokenInput.value = items.authToken || '';
    if (items.lastUsername) detectedUsername = items.lastUsername;
  });

  const showAlert = (msg, type = 'success') => {
    alertBox.className = `alert-box ${type}`;
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
  };

  // Inspect active Reddit session cookies
  try {
    const cookies = await chrome.cookies.getAll({ domain: 'reddit.com' });
    cookies.forEach((c) => {
      redditCookies[c.name] = c.value;
    });

    if (redditCookies.reddit_session) {
      statusDot.className = 'dot';
      
      // Try to determine username
      try {
        const resp = await fetch('https://www.reddit.com/api/me.json', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.data?.name) {
            detectedUsername = data.data.name;
          }
        }
      } catch (e) {
        // Fallback to stored or default
      }

      redditUserText.textContent = `Active Session: u/${detectedUsername}`;
      connectBtn.disabled = false;
    } else {
      statusDot.className = 'dot inactive';
      redditUserText.textContent = 'Not logged in on reddit.com';
      showAlert('Please open reddit.com and log in to your account first.', 'error');
    }
  } catch (err) {
    statusDot.className = 'dot inactive';
    redditUserText.textContent = 'Cookie permission needed';
  }

  // Handle Connect Click
  connectBtn.addEventListener('click', async () => {
    const serverUrl = (serverUrlInput.value || 'http://localhost:5000').trim().replace(/\/+$/, '');
    const authToken = (authTokenInput.value || '').trim();

    if (!redditCookies.reddit_session) {
      showAlert('No active reddit_session cookie detected. Please log in on reddit.com first.', 'error');
      return;
    }

    // Save preferences
    chrome.storage.local.set({ serverUrl, authToken, lastUsername: detectedUsername });

    connectBtn.disabled = true;
    btnText.textContent = 'Connecting...';

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const payload = {
        username: detectedUsername,
        reddit_session: redditCookies.reddit_session,
        loid: redditCookies.loid || '000000000000000000.2.0.0.0.0.0',
        csrf_token: redditCookies.csrf_token || 'token_' + Math.random().toString(36).slice(2),
      };

      const response = await fetch(`${serverUrl}/api/reddit-account/connect-cookies`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert(`✅ Connected u/${data.username} to PulseRed successfully!`, 'success');
        btnText.textContent = 'Connected!';
      } else {
        const errMsg = data.error || data.message || `Failed with status ${response.status}`;
        showAlert(`Error: ${errMsg}`, 'error');
        btnText.textContent = 'Retry Connection';
        connectBtn.disabled = false;
      }
    } catch (err) {
      showAlert(`Network error: ${err.message}. Make sure ${serverUrl} is running and reachable.`, 'error');
      btnText.textContent = 'Retry Connection';
      connectBtn.disabled = false;
    }
  });
});
