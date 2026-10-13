import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle2, AlertTriangle, Shield, RefreshCw, Eye, EyeOff, Radio, LogOut, Sparkles, KeyRound, ExternalLink, HelpCircle, Copy, Check, Download, FolderArchive } from 'lucide-react';
import axios from 'axios';
import { CustomSelect } from './CustomSelect';

const LOGIN_ENGINE_OPTIONS = [
  { value: 'browser', label: 'browser (Recommended for /vote & /dm)' },
  { value: 'http', label: 'http (Faster read-only)' },
];

const API_BASE_URL = '/api';

export const RedditAccountModal = ({ isOpen, onClose, onSessionUpdated }) => {
  const [activeTab, setActiveTab] = useState('extension'); // 'extension' | 'cookie' | 'automated'
  const [username, setUsername] = useState('Wild-Western-6399');
  const [password, setPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [proxy, setProxy] = useState('');
  const [method, setMethod] = useState('browser');
  const [showPassword, setShowPassword] = useState(false);

  // Cookie Connect state
  const [cookieInput, setCookieInput] = useState('');
  const [showCookieGuide, setShowCookieGuide] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [...prev, { time, text, type }]);
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('pulsered_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchStatus = async () => {
    setFetchingStatus(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/reddit-account/status`, getAuthHeader());
      setStatus(res.data);
      if (res.data?.username) {
        setUsername(res.data.username);
      }
    } catch (err) {
      console.error('Failed to fetch Reddit account status:', err);
    } finally {
      setFetchingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Direct Session Cookie Connect (Bypasses Reddit's cloud bot block in <100ms)
  const handleConnectCookies = async (e) => {
    e.preventDefault();
    const cleanUser = (username || '').trim();
    if (!cleanUser) {
      setMessage({ type: 'error', text: 'Reddit username is required (e.g., Wild-Western-6399).' });
      return;
    }
    if (!cookieInput.trim()) {
      setMessage({ type: 'error', text: 'Please paste your reddit_session cookie or full cookie header.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setActivityLogs([]);

    addLog(`Initiating instant session activation for u/${cleanUser}...`, 'info');
    addLog(`Parsing browser cookies (reddit_session, loid, csrf_token)...`, 'info');

    try {
      const res = await axios.post(
        `${API_BASE_URL}/reddit-account/connect-cookies`,
        {
          username: cleanUser,
          cookieInput: cookieInput.trim(),
        },
        getAuthHeader()
      );

      if (res.data?.success) {
        addLog(`✅ Activated u/${res.data.username} successfully via direct cookies!`, 'success');
        addLog(`Datacenter IP blocks bypassed. Ready for Reddit DMs and comments.`, 'success');

        setMessage({
          type: 'success',
          text: `✅ Successfully connected u/${res.data.username}! Session is active for instant outreach.`,
        });
        await fetchStatus();
        if (onSessionUpdated) onSessionUpdated();
      } else {
        const errText = res.data?.error || 'Failed to activate session cookies.';
        addLog(`❌ Upstream rejected: ${errText}`, 'error');
        setMessage({ type: 'error', text: errText });
      }
    } catch (err) {
      const errText = err.response?.data?.error || err.response?.data?.message || err.message;
      addLog(`❌ Cookie Activation Error: ${errText}`, 'error');
      setMessage({ type: 'error', text: errText });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Reddit username and password are required.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setActivityLogs([]);

    addLog(`Initiating Reddit authentication for u/${username.trim()}...`, 'info');
    addLog(`Engine: ${method} | Endpoint: /api/reddit-account/login`, 'info');
    addLog(`Dispatching to upstream https://api.redditapis.com/api/reddit/login...`, 'info');
    addLog(`Note: Reddit anti-bot checks may take 60-90s without residential proxy.`, 'warn');

    try {
      const payload = {
        username: username.trim(),
        password: password.trim(),
        method,
      };
      if (totpSecret.trim()) payload.totp_secret = totpSecret.trim();
      if (proxy.trim()) payload.proxy = proxy.trim();

      const res = await axios.post(`${API_BASE_URL}/reddit-account/login`, payload, getAuthHeader());

      if (res.data?.success) {
        addLog(`✅ Authenticated u/${res.data.username} successfully!`, 'success');
        addLog(`Link Karma: ${res.data.linkKarma} | Comment Karma: ${res.data.commentKarma}`, 'success');
        addLog(`Session cookies cached securely on backend.`, 'success');

        setMessage({
          type: 'success',
          text: `✅ Successfully connected u/${res.data.username}! (Karma: Link ${res.data.linkKarma}, Comment ${res.data.commentKarma})`,
        });
        await fetchStatus();
        if (onSessionUpdated) onSessionUpdated();
      } else {
        const errText = res.data?.error || 'Failed to authenticate Reddit account.';
        addLog(`❌ Upstream rejected login: ${errText}`, 'error');
        setMessage({
          type: 'error',
          text: errText,
        });
      }
    } catch (err) {
      const errText = err.response?.data?.error || err.response?.data?.message || err.message;
      const statusCode = err.response?.status ? `(HTTP ${err.response.status}) ` : '';
      addLog(`❌ Upstream Error ${statusCode}: ${errText}`, 'error');
      setMessage({
        type: 'error',
        text: `${statusCode}${errText}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setMessage(null);
    addLog('Disconnecting active Reddit session...', 'warn');
    try {
      await axios.post(`${API_BASE_URL}/reddit-account/disconnect`, {}, getAuthHeader());
      addLog('Session cookies purged from server store.', 'info');
      setMessage({ type: 'success', text: 'Reddit account disconnected.' });
      setUsername('');
      setPassword('');
      setTotpSecret('');
      setCookieInput('');
      await fetchStatus();
      if (onSessionUpdated) onSessionUpdated();
    } catch (err) {
      addLog('Failed to disconnect Reddit account', 'error');
      setMessage({ type: 'error', text: 'Failed to disconnect Reddit account.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(255, 69, 0, 0.4)',
                background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
              }}
            >
              <img src="/icons/pulsered-extension-48.png" alt="PulseRed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Reddit Account & Cookies Manager
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Authenticate via api.redditapis.com for automated comments & DMs
              </p>
            </div>
          </div>

          <button onClick={onClose} className="glass-button-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Live Session Status Banner */}
        {fetchingStatus ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Checking Reddit account session health...
          </div>
        ) : status?.isConnected ? (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#34d399' }}>
                  Live Session Connected: u/{status.username}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="glass-button-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <LogOut size={12} style={{ marginRight: '4px' }} /> Disconnect
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>
                Link Karma: <strong style={{ color: 'var(--text-primary)' }}>{status.linkKarma || 0}</strong>
              </span>
              <span>
                Comment Karma: <strong style={{ color: 'var(--text-primary)' }}>{status.commentKarma || 0}</strong>
              </span>
              {status.lastConnectedAt && (
                <span>
                  Connected: <span style={{ opacity: 0.8 }}>{new Date(status.lastConnectedAt).toLocaleDateString()}</span>
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Sparkles size={13} />
              Session cookies (reddit_session, token_v2, loid) cached & active. Auto-refreshed on expiration.
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertTriangle size={18} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ef4444', margin: '0 0 2px 0' }}>
                No Active Reddit Session
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Connect your account via the 1-Click Extension or paste your session cookie to enable automated comments and outreach.
              </p>
              {status?.lastError && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--accent-amber-bg)',
                    border: '1px solid var(--accent-amber-border)',
                    color: 'var(--accent-amber)',
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    fontWeight: '600',
                  }}
                >
                  <strong>Notice:</strong> {status.lastError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '18px',
            background: 'var(--card-inner-bg)',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('extension')}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '0.78rem',
              borderRadius: '10px',
              fontWeight: activeTab === 'extension' ? '800' : '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              border: 'none',
              background: activeTab === 'extension' ? 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)' : 'transparent',
              color: activeTab === 'extension' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: activeTab === 'extension' ? '0 2px 8px rgba(255, 69, 0, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={14} color={activeTab === 'extension' ? '#ffffff' : '#ff4500'} />
            1-Click Extension (Best)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cookie')}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '0.78rem',
              borderRadius: '10px',
              fontWeight: activeTab === 'cookie' ? '800' : '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              border: 'none',
              background: activeTab === 'cookie' ? 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)' : 'transparent',
              color: activeTab === 'cookie' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: activeTab === 'cookie' ? '0 2px 8px rgba(255, 69, 0, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <KeyRound size={13} color={activeTab === 'cookie' ? '#ffffff' : 'var(--text-secondary)'} />
            Paste Cookie
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('automated')}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '0.78rem',
              borderRadius: '10px',
              fontWeight: activeTab === 'automated' ? '800' : '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              border: 'none',
              background: activeTab === 'automated' ? 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)' : 'transparent',
              color: activeTab === 'automated' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: activeTab === 'automated' ? '0 2px 8px rgba(255, 69, 0, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Lock size={13} color={activeTab === 'automated' ? '#ffffff' : 'var(--text-secondary)'} />
            Password + Proxy
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              marginBottom: '18px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: message.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* TAB 0: 1-Click Chrome Extension (Gold Standard) */}
        {activeTab === 'extension' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Download Extension Hero Card */}
            <div
              style={{
                background: 'var(--card-inner-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(255, 69, 0, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/icons/pulsered-extension-48.png"
                    alt="PulseRed Extension"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                      PulseRed Connect
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(255, 69, 0, 0.12)',
                        color: '#ff4500',
                        border: '1px solid rgba(255, 69, 0, 0.3)',
                      }}
                    >
                      Manifest V3 • v1.0.0
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                    1-Click Reddit residential session bridge for PulseRed
                  </p>
                </div>
              </div>

              <a
                href="/api/reddit-account/download-extension"
                download="pulsered-connect-extension.zip"
                className="glass-button"
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(255, 69, 0, 0.35)',
                  flexShrink: 0,
                }}
              >
                <Download size={15} /> Download Extension (.zip)
              </a>
            </div>

            {/* Why This is the Best Solution Banner */}
            <div
              style={{
                background: 'var(--accent-gradient-subtle)',
                border: '1px solid var(--glass-border)',
                borderLeft: '4px solid #ff4500',
                borderRadius: '14px',
                padding: '14px 16px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#ff4500', marginBottom: '4px' }}>
                <Sparkles size={16} /> Why This is the Best Solution for Deployed SaaS:
              </div>
              Just like <strong style={{ color: 'var(--text-primary)' }}>Phantombuster</strong> and <strong style={{ color: 'var(--text-primary)' }}>Lemlist</strong>, a 1-click Chrome Extension connects your Reddit session directly from your residential IP in <strong>0.5 seconds</strong> with zero passwords, zero DevTools, and zero cloud IP bans.
            </div>

            {/* Quick Setup Instructions */}
            <div
              style={{
                background: 'var(--card-inner-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px', fontSize: '0.85rem' }}>
                Quick 10-Second Setup:
              </div>
              <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li>
                  <strong>Download &amp; Unzip:</strong> Click the <strong>Download Extension (.zip)</strong> button above and extract the zip file onto your computer.
                </li>
                <li>
                  Open Chrome/Edge &rarr; Navigate to <code style={{ background: 'var(--card-inner-bg-solid)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)', color: '#ff4500', fontWeight: '700' }}>chrome://extensions</code> &rarr; Enable <strong>Developer mode</strong> (top right toggle) &rarr; Click <strong>Load unpacked</strong> &rarr; Select the extracted folder.
                </li>
                <li>
                  Go to <a href="https://www.reddit.com" target="_blank" rel="noreferrer" style={{ color: '#ff4500', fontWeight: '700', textDecoration: 'underline' }}>reddit.com</a> &rarr; Click the <strong>PulseRed Connect</strong> icon in your browser toolbar &rarr; Click <strong>"Connect to PulseRed"</strong>.
                </li>
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onClose}
                className="glass-button-secondary"
                style={{ padding: '10px 18px', borderRadius: '12px' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  fetchStatus();
                  addLog('Checking if session synced from extension...', 'info');
                }}
                className="glass-button"
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RefreshCw size={14} /> Refresh Status
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: Direct Session Cookie Connection */}
        {activeTab === 'cookie' && (
          <form onSubmit={handleConnectCookies} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick explanation banner */}
            <div
              style={{
                background: 'var(--accent-blue-bg)',
                border: '1px solid var(--accent-blue-border)',
                borderRadius: '14px',
                padding: '12px 14px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '4px' }}>
                <KeyRound size={14} /> Why Session Cookie is 100% Reliable:
              </div>
              Reddit's Cloudflare security blocks automated datacenter logins (causing 60s+ timeouts). Connecting via your browser's active <code style={{ color: '#ff4500', fontWeight: '700' }}>reddit_session</code> cookie connects in <strong>&lt;100ms</strong> and bypasses cloud IP bans completely!
            </div>

            {/* Step-by-Step Instructions */}
            <div
              style={{
                background: 'var(--card-inner-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={14} color="#ff4500" /> How to get your cookie (takes 15 seconds):
              </div>
              <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Open <strong style={{ color: 'var(--text-primary)' }}>reddit.com</strong> in your browser (logged in as <code style={{ color: '#ff4500', fontWeight: '700' }}>u/Wild-Western-6399</code>).</li>
                <li>Press <kbd style={{ background: 'var(--card-inner-bg-solid)', border: '1px solid var(--glass-border)', padding: '1px 5px', borderRadius: '4px', color: 'var(--text-primary)' }}>F12</kbd> &rarr; Click <strong style={{ color: 'var(--text-primary)' }}>Application</strong> (or Storage in Firefox) &rarr; <strong style={{ color: 'var(--text-primary)' }}>Cookies</strong> &rarr; <strong style={{ color: 'var(--text-primary)' }}>https://www.reddit.com</strong>.</li>
                <li>Find <strong style={{ color: '#ff4500' }}>reddit_session</strong> &rarr; Double-click and copy its value (or copy the entire Cookie string).</li>
              </ol>
            </div>

            {/* Reddit Username */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Reddit Username
              </label>
              <input
                type="text"
                className="glass-input"
                style={{ width: '100%', borderRadius: '12px' }}
                placeholder="Wild-Western-6399"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Cookie Input */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                reddit_session Cookie (or Full Cookie Header)
              </label>
              <textarea
                className="glass-input"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  minHeight: '85px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '0.78rem',
                  lineHeight: 1.4,
                }}
                placeholder="Paste your reddit_session value here (e.g. 123456789%2C2026-10-13...) or full cookie string (reddit_session=...; loid=...)"
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                required
              />
            </div>

            {/* Submit Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onClose}
                className="glass-button-secondary"
                style={{ padding: '10px 18px', borderRadius: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="glass-button"
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {loading && <RefreshCw size={14} className="spin" />}
                {loading ? 'Activating Session...' : 'Connect & Activate Cookies ⚡'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Automated Cloud Login Form */}
        {activeTab === 'automated' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Datacenter notice */}
            <div
              style={{
                background: 'var(--accent-amber-bg)',
                border: '1px solid var(--accent-amber-border)',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '0.78rem',
                color: 'var(--accent-amber)',
                lineHeight: 1.4,
              }}
            >
              <strong>Notice on Automated Cloud Logins:</strong> Reddit actively challenges automated logins from datacenter server IPs (often taking ~75s). If you encounter <code style={{ background: 'var(--card-inner-bg-solid)', padding: '1px 5px', borderRadius: '4px' }}>UPSTREAM_ERROR</code>, Reddit is requiring a residential proxy. Switch to the <strong>1-Click Extension</strong> tab to connect instantly without proxy requirements.
            </div>

            {/* Reddit Username */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Reddit Username or Email
              </label>
              <input
                type="text"
                className="glass-input"
                style={{ width: '100%', borderRadius: '12px' }}
                placeholder="e.g., Wild-Western-6399"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Reddit Password */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Account Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  style={{ width: '100%', borderRadius: '12px', paddingRight: '40px' }}
                  placeholder="Enter Reddit account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Login Method */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Login Engine Mode
                </label>
                <CustomSelect
                  options={LOGIN_ENGINE_OPTIONS}
                  value={method}
                  onChange={setMethod}
                  fullWidth
                />
              </div>

              {/* 2FA TOTP Secret (Optional) */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  2FA Base32 Secret <span style={{ opacity: 0.6 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  className="glass-input"
                  style={{ width: '100%', borderRadius: '12px' }}
                  placeholder="Required if 2FA active"
                  value={totpSecret}
                  onChange={(e) => setTotpSecret(e.target.value)}
                />
              </div>
            </div>

            {/* Sticky Proxy (Optional) */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Custom Sticky Proxy <span style={{ opacity: 0.6 }}>(Recommended if cloud IP blocked)</span>
              </label>
              <input
                type="text"
                className="glass-input"
                style={{ width: '100%', borderRadius: '12px' }}
                placeholder="e.g. http://user:pass@proxy-host:port"
                value={proxy}
                onChange={(e) => setProxy(e.target.value)}
              />
            </div>

            {/* Submit Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="glass-button-secondary"
                style={{ padding: '10px 18px', borderRadius: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="glass-button"
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {loading && <RefreshCw size={14} className="spin" />}
                {loading ? 'Authenticating (takes ~75s)...' : status?.isConnected ? 'Update & Refresh Session' : 'Automated Cloud Login'}
              </button>
            </div>
          </form>
        )}

        {/* Live Activity & Hit Terminal Box */}
        {(activityLogs.length > 0 || loading) && (
          <div
            style={{
              marginTop: '18px',
              borderRadius: '14px',
              background: 'var(--card-inner-bg-solid, #0f172a)',
              border: '1px solid var(--glass-border)',
              padding: '12px 16px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.74rem',
              maxHeight: '160px',
              overflowY: 'auto',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                borderBottom: '1px solid var(--glass-border)',
                paddingBottom: '6px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: loading ? '#fbbf24' : '#10b981', display: 'inline-block' }} />
                Live API Hit & Authentication Console
              </span>
              {loading && <span style={{ color: 'var(--accent-amber)', fontSize: '0.7rem' }}>Awaiting Upstream... ⏳</span>}
            </div>
            {activityLogs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '4px',
                  lineHeight: 1.45,
                  color:
                    log.type === 'success'
                      ? '#10b981'
                      : log.type === 'error'
                      ? '#ef4444'
                      : log.type === 'warn'
                      ? '#f59e0b'
                      : 'var(--accent-primary)',
                }}
              >
                <span style={{ opacity: 0.7, marginRight: '6px' }}>[{log.time}]</span>
                <span>{log.text}</span>
              </div>
            ))}
            {loading && (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
                &gt; Executing live login on api.redditapis.com (15-30s)...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
