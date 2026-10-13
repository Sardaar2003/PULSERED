import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Mail,
  Search,
  Send,
  Sparkles,
  Check,
  CheckCheck,
  RefreshCw,
  ArrowUpRight,
  Flame,
  User,
  Filter,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  AlertTriangle,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

const API_BASE_URL = '/api';

export const InboxHubView = ({ onGoToWorkspace, onOpenRedditModal }) => {
  const [activeChannel, setActiveChannel] = useState('reddit_dm'); // 'reddit_dm' | 'email'
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread' | 'replied' | 'drafts'
  const [selectedThreadId, setSelectedThreadId] = useState(null);

  // Active Thread Data
  const [activeLead, setActiveLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeDraftOpener, setActiveDraftOpener] = useState('');
  const [isSentThread, setIsSentThread] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');

  // Reddit Connection Status
  const [redditStatus, setRedditStatus] = useState({ isConnected: false, username: '', linkKarma: 0, commentKarma: 0 });
  const [loadingRedditStatus, setLoadingRedditStatus] = useState(true);

  // Message Input & AI Co-Pilot State
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Feedback Notifications
  const [toastMsg, setToastMsg] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const messagesEndRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('pulsered_token');
    return { headers: { Authorization: token ? `Bearer ${token}` : '' } };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiSuggestion]);

  // Fetch Reddit connection status
  const fetchRedditStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/reddit-account/status`, getAuthHeader());
      setRedditStatus(res.data || { isConnected: false, username: '' });
    } catch (err) {
      console.error('Failed to fetch Reddit status:', err);
    } finally {
      setLoadingRedditStatus(false);
    }
  };

  useEffect(() => {
    fetchRedditStatus();
  }, []);

  // Fetch all inbox threads
  const fetchThreads = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/inbox/threads?channel=${activeChannel}&filter=${filterType}&search=${encodeURIComponent(
          searchQuery
        )}`,
        getAuthHeader()
      );
      const list = res.data.threads || [];
      setThreads(list);

      // Auto-select first thread if none selected or selected thread no longer exists
      if (list.length > 0) {
        if (!selectedThreadId || !list.some((t) => t.leadId === selectedThreadId)) {
          setSelectedThreadId(list[0].leadId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inbox threads:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to load inbox threads');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [activeChannel, filterType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchThreads(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch active conversation messages
  const fetchActiveConversation = async (leadId) => {
    if (!leadId) return;
    setLoadingMessages(true);
    setAiSuggestion(null);
    setErrorMessage('');
    try {
      const res = await axios.get(
        `${API_BASE_URL}/inbox/threads/${leadId}?channel=${activeChannel}`,
        getAuthHeader()
      );
      const lead = res.data.lead;
      setActiveLead(lead);
      setMessages(res.data.conversation || []);
      setIsSentThread(Boolean(res.data.isSent));
      setActiveDraftOpener(res.data.draftOpener || '');
      setInputText('');

      const defaultSubject = lead?.brandEmailDmDraft?.subject || (lead?.postTitle ? `Inquiry regarding: ${lead.postTitle}` : `Outreach from ${lead?.targetDomain || 'AlertCareLine.com'}`);
      setEmailSubject(defaultSubject);

      // If the latest message is from lead, auto-trigger AI smart suggestion
      const conv = res.data.conversation || [];
      if (conv.length > 0 && conv[conv.length - 1].sender === 'lead') {
        generateAiSuggestion(leadId);
      }
    } catch (err) {
      console.error('Failed to fetch thread detail:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to fetch conversation');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedThreadId) {
      fetchActiveConversation(selectedThreadId);
    }
  }, [selectedThreadId, activeChannel]);

  // Auto-polling Reddit messages / threads every 60 seconds
  useEffect(() => {
    const pollTimer = setInterval(() => {
      fetchThreads(true);
      if (selectedThreadId) {
        axios
          .get(`${API_BASE_URL}/inbox/threads/${selectedThreadId}?channel=${activeChannel}`, getAuthHeader())
          .then((res) => {
            if (res.data?.conversation) {
              setMessages(res.data.conversation);
              setIsSentThread(Boolean(res.data.isSent));
            }
          })
          .catch(() => {});
      }
    }, 60000);

    return () => clearInterval(pollTimer);
  }, [selectedThreadId, activeChannel, filterType]);

  // Generate AI Co-Pilot smart reply (strictly reports real errors, NO mock fallbacks)
  const generateAiSuggestion = async (leadId, customPrompt = '') => {
    setIsGeneratingAi(true);
    setErrorMessage('');
    try {
      const res = await axios.post(
        `${API_BASE_URL}/inbox/threads/${leadId}/suggest-reply`,
        { instruction: customPrompt },
        getAuthHeader()
      );
      if (res.data.suggestedReply) {
        setAiSuggestion(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to generate AI suggestion';
      console.error('AI smart reply error:', msg);
      setErrorMessage(`AI Co-Pilot Error: ${msg}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Send message in active chat or email (strictly calls real Reddit/Email API; displays error if rejected)
  const handleSendMessage = async (textToSend = null, customSubject = null) => {
    const text = textToSend || inputText;
    if (!text || !text.trim() || !selectedThreadId) return;

    setIsSending(true);
    setErrorMessage('');

    try {
      const payload = {
        content: text.trim(),
        channel: activeChannel,
        sender: 'user',
      };
      if (activeChannel === 'email') {
        payload.subject = (customSubject || emailSubject || 'Outreach Inquiry').trim();
      }

      const res = await axios.post(
        `${API_BASE_URL}/inbox/threads/${selectedThreadId}/send`,
        payload,
        getAuthHeader()
      );

      if (res.data.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setIsSentThread(true);
        setInputText('');
        setAiSuggestion(null);
        showToast(activeChannel === 'email' ? '✓ Email successfully dispatched via SMTP!' : '✓ Reddit DM dispatched successfully via live API!');
        fetchThreads(true);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to send message';
      console.error('Live dispatch rejected:', msg);
      setErrorMessage(`Live Dispatch Failed: ${msg}`);
    } finally {
      setIsSending(false);
    }
  };

  // Sync / Poll Reddit Messages (strict error display)
  const handleSyncInbox = async () => {
    setIsSyncing(true);
    setErrorMessage('');
    try {
      const res = await axios.get(`${API_BASE_URL}/inbox/sync`, getAuthHeader());
      showToast(res.data.message || 'Inbox synced!');
      await fetchThreads(true);
      if (selectedThreadId) {
        await fetchActiveConversation(selectedThreadId);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Sync failed';
      console.error('Inbox sync failed:', msg);
      setErrorMessage(`Sync Error: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalUnreadCount = threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', minHeight: '680px' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'var(--card-inner-bg-solid, #0f172a)',
            border: '1px solid var(--accent-primary)',
            color: 'var(--text-primary)',
            padding: '12px 20px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 1000,
            fontSize: '0.88rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={16} color="var(--accent-primary)" />
          {toastMsg}
        </div>
      )}

      {/* Top Header & Channel Switcher Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 24px',
          borderRadius: '20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Direct Messaging Hub
              </h2>
              {totalUnreadCount > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '2px 9px',
                    borderRadius: '10px',
                    background: 'rgba(236, 72, 153, 0.2)',
                    color: '#f472b6',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                  }}
                >
                  {totalUnreadCount} Unread
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
              Multi-turn messaging stream with live Reddit API dispatch & real-time objection handling.
            </p>
          </div>
        </div>

        {/* Channels & Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Channel Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--card-inner-bg)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid var(--glass-border)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveChannel('reddit_dm')}
              style={{
                padding: '7px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: activeChannel === 'reddit_dm' ? 'var(--accent-gradient)' : 'transparent',
                color: activeChannel === 'reddit_dm' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <MessageSquare size={14} /> Reddit DMs
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel('email')}
              style={{
                padding: '7px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: activeChannel === 'email' ? 'var(--accent-gradient)' : 'transparent',
                color: activeChannel === 'email' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <Mail size={14} /> Email Outreach
            </button>
          </div>

          {/* Reddit Live Status Badge */}
          {activeChannel === 'reddit_dm' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '14px',
                background: redditStatus.isConnected
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'rgba(239, 68, 68, 0.12)',
                border: redditStatus.isConnected
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '0.76rem',
                fontWeight: '700',
                color: redditStatus.isConnected ? '#4ade80' : '#f87171',
              }}
              title={redditStatus.isConnected ? `Connected as u/${redditStatus.username}` : 'No Reddit session connected'}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: redditStatus.isConnected ? '#22c55e' : '#ef4444',
                  boxShadow: redditStatus.isConnected ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
                }}
              />
              {redditStatus.isConnected ? `u/${redditStatus.username}` : 'Reddit Disconnected'}
            </div>
          )}

          {/* Sync Messages Action */}
          <button
            onClick={handleSyncInbox}
            disabled={isSyncing}
            className="glass-button"
            style={{ borderRadius: '14px', padding: '8px 16px', gap: '6px', fontSize: '0.8rem' }}
            title="Poll Reddit & Check for live prospect messages"
          >
            <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Messages'}
          </button>
        </div>
      </div>

      {/* Main Spacious 2-Column Messenger Canvas */}
      <div
        className="glass-card"
        style={{
          flex: 1,
          borderRadius: '24px',
          display: 'grid',
          gridTemplateColumns: '390px 1fr',
          overflow: 'hidden',
          border: '1px solid var(--glass-border)',
          minHeight: 0,
        }}
      >
        {/* ============================================================== */}
        {/* LEFT COLUMN: CONVERSATION LIST (Spacious & Clean)              */}
        {/* ============================================================== */}
        <div
          style={{
            borderRight: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--card-inner-bg)',
            height: '100%',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Search & Filter Header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search prospects, subreddits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '14px',
                  height: '38px',
                  borderRadius: '16px',
                  fontSize: '0.82rem',
                }}
              />
            </div>

            {/* Quick Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'replied', label: 'Replied' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '10px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: filterType === f.id ? 'var(--accent-primary)' : 'var(--card-inner-bg)',
                    color: filterType === f.id ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--glass-border)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scrollable Feed */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 12px auto' }} />
                Loading conversations...
              </div>
            ) : threads.length === 0 ? (
              <div style={{ padding: '50px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <MessageSquare size={36} style={{ opacity: 0.3, margin: '0 auto 12px auto' }} />
                No {activeChannel === 'reddit_dm' ? 'Reddit DM' : 'Email'} prospects found.
                {onGoToWorkspace && (
                  <button
                    onClick={onGoToWorkspace}
                    className="glass-button"
                    style={{ marginTop: '16px', fontSize: '0.78rem', padding: '8px 16px', borderRadius: '12px' }}
                  >
                    Find Prospects in Workspace
                  </button>
                )}
              </div>
            ) : (
              threads.map((thread) => {
                const isSelected = selectedThreadId === thread.leadId;
                const authorDisplay = thread.channel === 'email' ? thread.recipientEmail : `u/${thread.author}`;
                const cleanSubreddit = (thread.subreddit || 'Reddit').replace(/^r\//, '');

                return (
                  <div
                    key={thread.leadId}
                    onClick={() => setSelectedThreadId(thread.leadId)}
                    style={{
                      padding: '16px 18px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--glass-border)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                      borderLeft: isSelected ? '4px solid var(--accent-primary)' : '4px solid transparent',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Avatar Circle */}
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '14px',
                        background:
                          thread.channel === 'email'
                            ? 'rgba(59, 130, 246, 0.18)'
                            : 'rgba(255, 69, 0, 0.18)',
                        border:
                          thread.channel === 'email'
                            ? '1px solid rgba(59, 130, 246, 0.35)'
                            : '1px solid rgba(255, 69, 0, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: thread.channel === 'email' ? '#60a5fa' : '#ff6b35',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      {thread.author.charAt(0).toUpperCase()}
                      {thread.unreadCount > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-3px',
                            right: '-3px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#ec4899',
                            boxShadow: '0 0 8px #ec4899',
                          }}
                        />
                      )}
                    </div>

                    {/* Thread Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: isSelected ? '800' : '700',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {authorDisplay}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>
                          {formatTime(thread.updatedAt)}
                        </span>
                      </div>

                      {/* Subreddit / Intent info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                          r/{cleanSubreddit}
                        </span>
                        <span style={{ color: 'var(--glass-border)' }}>•</span>
                        <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '800' }}>
                          🔥 {thread.intentScore}%
                        </span>
                        {thread.isSent ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#34d399', marginLeft: 'auto' }}>
                            ✓ Sent
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#fbbf24', marginLeft: 'auto' }}>
                            📝 Draft Ready
                          </span>
                        )}
                      </div>

                      {/* Message or Draft Snippet */}
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: thread.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: thread.unreadCount > 0 ? '700' : '500',
                          margin: 0,
                          lineHeight: 1.35,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {thread.lastMessage
                          ? thread.lastMessage.isDraft
                            ? `Draft: ${thread.lastMessage.content}`
                            : `${thread.lastMessage.sender === 'user' ? 'You: ' : ''}${thread.lastMessage.content}`
                          : 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: ACTIVE CHAT CANVAS (Clean & Spacious)            */}
        {/* ============================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--card-bg)', minWidth: 0, minHeight: 0 }}>
          {!selectedThreadId || !activeLead ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  marginBottom: '16px',
                }}
              >
                <MessageSquare size={34} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Select a Prospect to Open Chat
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '420px', textAlign: 'center', marginTop: '8px' }}>
                Review live Reddit DM message history, inspect AI-generated strategy openers, and approve live responses.
              </p>
            </div>
          ) : (
            <>
              {/* Active Conversation Top Bar */}
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--glass-border)',
                  background: 'var(--card-inner-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: 'var(--accent-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '1rem',
                    }}
                  >
                    {activeLead.author?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                        {activeChannel === 'email'
                          ? activeLead.brandEmailDmDraft?.contactEmail || `${activeLead.author}@domain.com`
                          : `u/${activeLead.author}`}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '2px 9px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        🔥 {activeLead.intentScore || 85}% Intent
                      </span>
                      {isSentThread ? (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          Live Thread Active
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          Draft Opener (Not Sent Yet)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      <span>r/{(activeLead.subreddit || 'Reddit').replace(/^r\//, '')}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>
                        {activeLead.targetDomain || 'AlertCareLine.com'}
                      </span>
                      <span>•</span>
                      <span>Stage: {activeLead.stage || 'New Leads'}</span>
                    </div>
                  </div>
                </div>

                {/* Header Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Direct 1-on-1 Reddit Chat Link */}
                  {activeLead.author && activeLead.author !== 'prospect' && (
                    <a
                      href={`https://chat.reddit.com/user/${activeLead.author}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button-secondary"
                      style={{
                        padding: '7px 14px',
                        fontSize: '0.76rem',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        gap: '6px',
                        border: '1px solid rgba(255, 69, 0, 0.45)',
                        color: 'var(--accent-primary, #ff4500)',
                        fontWeight: '700',
                      }}
                      title={`Open live 1-on-1 Reddit Chat with u/${activeLead.author} on Reddit`}
                    >
                      <MessageSquare size={13} /> Reddit Chat <ArrowUpRight size={13} />
                    </a>
                  )}

                  {/* Original Source Reddit Post */}
                  {activeLead.permalink && (
                    <a
                      href={
                        activeLead.permalink.startsWith('http')
                          ? activeLead.permalink
                          : `https://reddit.com${activeLead.permalink}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button-secondary"
                      style={{ padding: '7px 14px', fontSize: '0.76rem', borderRadius: '12px', textDecoration: 'none', gap: '5px', opacity: 0.85 }}
                      title="View original Reddit forum post"
                    >
                      Reddit Post <ArrowUpRight size={13} />
                    </a>
                  )}

                  {/* Reddit Session Trigger for Reddit DM Channel */}
                  {activeChannel === 'reddit_dm' && onOpenRedditModal && (
                    <button
                      type="button"
                      onClick={onOpenRedditModal}
                      className="glass-button-secondary"
                      style={{
                        padding: '7px 14px',
                        fontSize: '0.76rem',
                        borderRadius: '12px',
                        gap: '6px',
                        border: redditStatus.isConnected
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid rgba(239, 68, 68, 0.4)',
                        color: redditStatus.isConnected ? '#34d399' : '#f87171',
                      }}
                      title="Manage authenticated Reddit session"
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: redditStatus.isConnected ? '#10b981' : '#ef4444',
                        }}
                      />
                      {redditStatus.isConnected ? `u/${redditStatus.username}` : 'Connect Reddit'}
                    </button>
                  )}

                  {onGoToWorkspace && (
                    <button
                      type="button"
                      onClick={onGoToWorkspace}
                      className="glass-button-secondary"
                      style={{ padding: '7px 14px', fontSize: '0.76rem', borderRadius: '12px', gap: '5px' }}
                      title="Open full Lead Pipeline Workspace"
                    >
                      <Zap size={13} color="var(--accent-amber)" /> Workspace
                    </button>
                  )}

                  <button
                    onClick={() => generateAiSuggestion(selectedThreadId)}
                    disabled={isGeneratingAi}
                    className="glass-button"
                    style={{ padding: '7px 14px', fontSize: '0.76rem', borderRadius: '12px', gap: '6px' }}
                    title="Generate live AI response recommendation via OpenRouter"
                  >
                    <Sparkles size={13} />
                    {isGeneratingAi ? 'Thinking...' : 'AI Co-Pilot'}
                  </button>
                </div>
              </div>

              {/* Prominent Error Alert Banner (When Real Dispatch or AI Fails) */}
              {errorMessage && (
                <div
                  className="animate-fade-in"
                  style={{
                    margin: '12px 24px 0 24px',
                    padding: '12px 18px',
                    borderRadius: '16px',
                    background: 'rgba(239, 68, 68, 0.14)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldAlert size={18} color="#f87171" style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('')}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* ============================================================== */}
              {/* CHANNEL SPECIFIC CANVAS: EMAIL vs REDDIT DM                    */}
              {/* ============================================================== */}
              {activeChannel === 'email' ? (
                /* ============================================================ */
                /* 📧 TRUE EMAIL CLIENT INBOX VIEW                              */
                /* ============================================================ */
                <>
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '24px 28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      background: 'var(--bg-gradient)',
                      minHeight: 0,
                    }}
                  >
                    {/* Email Envelope Header Card */}
                    <div
                      className="glass-card animate-fade-in"
                      style={{
                        padding: '22px 26px',
                        borderRadius: '18px',
                        background: 'var(--card-inner-bg)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      {/* Subject Row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--accent-primary)' }}>
                            Email Subject
                          </span>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                            {emailSubject || activeLead.brandEmailDmDraft?.subject || 'Outreach Inquiry'}
                          </h3>
                        </div>
                        <span
                          style={{
                            padding: '5px 14px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            background: isSentThread ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isSentThread ? '#34d399' : '#fbbf24',
                            border: isSentThread ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                            flexShrink: 0,
                          }}
                        >
                          {isSentThread ? '✓ Dispatched via SMTP' : '📝 Unsent Draft'}
                        </span>
                      </div>

                      {/* From / To / Origin Metadata Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '12px',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: 'var(--card-bg)',
                          border: '1px solid var(--glass-border)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>From: </span>
                          <strong style={{ color: 'var(--text-primary)' }}>
                            Outreach &lt;contact@{activeLead.targetDomain?.toLowerCase().replace(/^https?:\/\//, '') || 'alertcareline.com'}&gt;
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>To: </span>
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {activeLead.brandEmailDmDraft?.contactEmail || `${activeLead.author.toLowerCase()}@domain.com`}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Source Reddit Lead: </span>
                          <strong style={{ color: 'var(--accent-primary)' }}>
                            u/{activeLead.author} • r/{(activeLead.subreddit || 'Reddit').replace(/^r\//, '')}
                          </strong>
                        </div>
                      </div>

                      {/* Source Reddit Context Callout */}
                      {(activeLead.postTitle || activeLead.commentQuote || activeLead.postSnippet) && (
                        <div
                          style={{
                            marginTop: '14px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.08)',
                            border: '1px solid rgba(99, 102, 241, 0.22)',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.45,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                              📌 Generated from Reddit post: "{activeLead.postTitle || activeLead.title}"
                            </span>
                            {activeLead.permalink && (
                              <a
                                href={activeLead.permalink.startsWith('http') ? activeLead.permalink : `https://reddit.com${activeLead.permalink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '700', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                View Post ↗
                              </a>
                            )}
                          </div>
                          {(activeLead.commentQuote || activeLead.postSnippet) && (
                            <div style={{ fontStyle: 'italic', opacity: 0.9 }}>
                              "{activeLead.commentQuote || activeLead.postSnippet}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Email Thread Body or Draft View */}
                    {loadingMessages ? (
                      <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                        <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 10px auto' }} />
                        Loading email thread...
                      </div>
                    ) : messages.length === 0 ? (
                      /* Draft Letter View */
                      <div
                        className="glass-card animate-fade-in"
                        style={{
                          padding: '24px 28px',
                          borderRadius: '18px',
                          background: 'var(--card-inner-bg)',
                          border: '1px solid var(--glass-border)',
                          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.1)',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fbbf24' }}>
                            ✉️ Drafted Email Outreach Letter (Unsent)
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Ready for live SMTP dispatch
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '0.92rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'inherit',
                            padding: '12px 4px',
                          }}
                        >
                          {activeDraftOpener || activeLead.brandEmailDmDraft?.content || 'No email draft generated yet.'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)' }}>
                          <button
                            type="button"
                            onClick={() => setInputText(activeDraftOpener || activeLead.brandEmailDmDraft?.content || '')}
                            className="glass-button-secondary"
                            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.8rem', gap: '6px' }}
                          >
                            <Copy size={13} /> Edit in Composer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendMessage(activeDraftOpener || activeLead.brandEmailDmDraft?.content || '', emailSubject)}
                            disabled={isSending}
                            className="glass-button"
                            style={{ padding: '8px 20px', borderRadius: '12px', fontSize: '0.82rem', gap: '7px' }}
                          >
                            <Mail size={14} />
                            {isSending ? 'Sending via SMTP...' : 'Send Email via SMTP'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Multi-turn Threaded Emails View */
                      messages.map((msg, idx) => (
                        <div
                          key={msg.messageId || idx}
                          className="glass-card animate-fade-in"
                          style={{
                            padding: '20px 24px',
                            borderRadius: '16px',
                            background: msg.sender === 'lead' ? 'var(--card-inner-bg)' : 'rgba(99, 102, 241, 0.08)',
                            border: msg.sender === 'lead' ? '1px solid var(--glass-border)' : '1px solid rgba(99, 102, 241, 0.3)',
                            marginBottom: '14px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '10px',
                                  background: msg.sender === 'lead' ? 'rgba(245, 158, 11, 0.2)' : 'var(--accent-gradient)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: msg.sender === 'lead' ? '#fbbf24' : '#ffffff',
                                  fontWeight: '800',
                                  fontSize: '0.82rem',
                                }}
                              >
                                {msg.sender === 'lead' ? activeLead.author?.charAt(0).toUpperCase() : 'You'}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                  {msg.sender === 'lead' ? activeLead.author : 'Outreach Specialist'}
                                </strong>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {msg.sender === 'lead' ? `Recipient: <${activeLead.brandEmailDmDraft?.contactEmail || activeLead.author + '@domain.com'}>` : 'Sent via SMTP'}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}

                    {/* AI Smart Suggestion */}
                    {aiSuggestion && (
                      <div
                        className="glass-card animate-fade-in"
                        style={{
                          marginTop: '8px',
                          padding: '18px 20px',
                          borderRadius: '18px',
                          background: 'rgba(99, 102, 241, 0.09)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={14} color="var(--accent-primary)" />
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                              AI Co-Pilot Email Recommendation
                            </span>
                          </div>
                          {aiSuggestion.objectionType && (
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '3px 10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              {aiSuggestion.objectionType}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '10px' }}>
                          💡 Strategy: {aiSuggestion.strategyRationale}
                        </p>
                        <div style={{ background: 'var(--card-inner-bg)', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--glass-border)', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '14px', whiteSpace: 'pre-wrap' }}>
                          {aiSuggestion.suggestedReply}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setInputText(aiSuggestion.suggestedReply)}
                            className="glass-button-secondary"
                            style={{ padding: '7px 16px', fontSize: '0.78rem', borderRadius: '10px', gap: '5px' }}
                          >
                            <Copy size={13} /> Insert into Email Composer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendMessage(aiSuggestion.suggestedReply, emailSubject)}
                            disabled={isSending}
                            className="glass-button"
                            style={{ padding: '7px 16px', fontSize: '0.78rem', borderRadius: '10px', gap: '5px' }}
                          >
                            <Mail size={13} /> Send Email via SMTP
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiSuggestion(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.76rem', cursor: 'pointer', marginLeft: 'auto' }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* ✉️ Dedicated Email Compose & Reply Station */}
                  <div
                    style={{
                      padding: '20px 24px',
                      borderTop: '1px solid var(--glass-border)',
                      background: 'var(--card-inner-bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      flexShrink: 0,
                    }}
                  >
                    {/* Email Composer Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={16} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                          Compose Email Reply
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        To: <strong style={{ color: 'var(--text-primary)' }}>{activeLead.brandEmailDmDraft?.contactEmail || `${activeLead.author.toLowerCase()}@domain.com`}</strong>
                      </span>
                    </div>

                    {/* Subject Line Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', width: '60px' }}>
                        Subject:
                      </span>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Email Subject Line..."
                        className="glass-input"
                        style={{ flex: 1, height: '36px', borderRadius: '10px', fontSize: '0.84rem' }}
                      />
                    </div>

                    {/* Quick Email Strategy Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
                      {[
                        'Offer 10-minute solution walk-through',
                        'Share 1-page pricing sheet with zero lock-in',
                        'Address hardware & sensor compatibility',
                        'Follow up on previous email exchange',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => generateAiSuggestion(selectedThreadId, chip)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '10px',
                            background: 'var(--card-inner-bg)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          💡 {chip}
                        </button>
                      ))}
                    </div>

                    {/* Email Body Textarea */}
                    <textarea
                      rows={4}
                      placeholder="Compose your email message here... (Live SMTP dispatch)"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="glass-input"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        resize: 'vertical',
                        minHeight: '85px',
                      }}
                    />

                    {/* Email Bottom Actions Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        Dispatches via configured SMTP server
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {inputText.trim() && (
                          <button
                            type="button"
                            onClick={() => setInputText('')}
                            className="glass-button-secondary"
                            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.78rem' }}
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSendMessage()}
                          disabled={isSending || !inputText.trim()}
                          className="glass-button"
                          style={{
                            padding: '8px 24px',
                            borderRadius: '12px',
                            fontSize: '0.84rem',
                            fontWeight: '700',
                            gap: '8px',
                          }}
                        >
                          <Mail size={15} />
                          {isSending ? 'Sending via SMTP...' : 'Send Email via SMTP'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ============================================================ */
                /* 💬 REDDIT DIRECT MESSAGES STREAM VIEW                        */
                /* ============================================================ */
                <>
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '24px 28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      background: 'var(--bg-gradient)',
                      minHeight: 0,
                    }}
                  >
                    {/* Pinned Original Reddit Context & Account Card */}
                    <div
                      className="glass-card animate-fade-in"
                      style={{
                        padding: '16px 20px',
                        borderRadius: '18px',
                        background: 'rgba(255, 69, 0, 0.08)',
                        border: '1px solid rgba(255, 69, 0, 0.28)',
                        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.12)',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: '800',
                              padding: '3px 10px',
                              borderRadius: '10px',
                              background: 'rgba(255, 69, 0, 0.2)',
                              color: '#ff6b35',
                              border: '1px solid rgba(255, 69, 0, 0.35)',
                            }}
                          >
                            r/{(activeLead.subreddit || 'Reddit').replace(/^r\//, '')}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Prospect: <strong style={{ color: 'var(--text-primary)' }}>u/{activeLead.author}</strong>
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '800' }}>
                            🔥 {activeLead.intentScore || 85}% Intent
                          </span>
                        </div>
                        {activeLead.permalink && (
                          <a
                            href={activeLead.permalink.startsWith('http') ? activeLead.permalink : `https://reddit.com${activeLead.permalink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            View Source Reddit Thread <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      {/* Reddit Post Title */}
                      <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                        {activeLead.postTitle || activeLead.title || 'Reddit Community Discussion'}
                      </h4>

                      {/* Prospect Post / Comment Snippet Quote */}
                      {(activeLead.commentQuote || activeLead.postSnippet) && (
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: 'var(--card-inner-bg)',
                            borderLeft: '3px solid #ff4500',
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.45,
                            fontStyle: 'italic',
                            marginBottom: '10px',
                          }}
                        >
                          "{activeLead.commentQuote || activeLead.postSnippet}"
                        </div>
                      )}

                      {/* Active Reddit Session Banner */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '0.74rem',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: redditStatus.isConnected ? '#10b981' : '#ef4444',
                              boxShadow: redditStatus.isConnected ? '0 0 8px #10b981' : '0 0 8px #ef4444',
                            }}
                          />
                          {redditStatus.isConnected ? (
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Live DMs sent as <strong style={{ color: '#34d399' }}>u/{redditStatus.username}</strong> via RedditAPIs (Karma: {redditStatus.linkKarma + redditStatus.commentKarma})
                            </span>
                          ) : (
                            <span style={{ color: '#f87171', fontWeight: '600' }}>
                              No Reddit session active. Live DMs require an authenticated account.
                            </span>
                          )}
                        </div>
                        {onOpenRedditModal && (
                          <button
                            type="button"
                            onClick={onOpenRedditModal}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-primary)',
                              fontSize: '0.73rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            {redditStatus.isConnected ? 'Manage Reddit Account' : 'Connect Account Now ↗'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chat Messages or Unsent Draft View */}
                    {loadingMessages ? (
                      <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                        <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 10px auto' }} />
                        Loading conversation stream...
                      </div>
                    ) : messages.length === 0 ? (
                      /* UNSENT DRAFT STATE */
                      <div style={{ maxWidth: '780px', width: '100%', margin: '14px auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div
                          className="glass-card animate-fade-in"
                          style={{
                            padding: '24px 28px',
                            borderRadius: '20px',
                            background: 'rgba(99, 102, 241, 0.08)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: '800',
                                  padding: '4px 10px',
                                  borderRadius: '10px',
                                  background: 'rgba(245, 158, 11, 0.18)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                }}
                              >
                                📝 Drafted Opener • Not Dispatched Yet
                              </span>
                            </div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Target: u/{activeLead.author}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.45 }}>
                            The Lead Agent drafted this initial outreach for <strong style={{ color: 'var(--text-primary)' }}>u/{activeLead.author}</strong> based on their post in <strong style={{ color: 'var(--accent-primary)' }}>r/{(activeLead.subreddit || '').replace(/^r\//, '')}</strong>. You can dispatch it live now or edit it below:
                          </p>

                          <div
                            style={{
                              background: 'var(--card-inner-bg)',
                              padding: '16px 18px',
                              borderRadius: '14px',
                              border: '1px solid var(--glass-border)',
                              fontSize: '0.9rem',
                              color: 'var(--text-primary)',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-wrap',
                              marginBottom: '16px',
                            }}
                          >
                            {activeDraftOpener || activeLead.openerDraft?.content || 'No draft generated yet.'}
                          </div>

                          {/* Dispatch Action Row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: redditStatus.isConnected ? '#34d399' : '#f87171' }}>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: redditStatus.isConnected ? '#10b981' : '#ef4444',
                                }}
                              />
                              {redditStatus.isConnected
                                ? `Live dispatch will send from u/${redditStatus.username}`
                                : 'Reddit account not connected (Dispatches require active Reddit session)'}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button
                                type="button"
                                onClick={() => setInputText(activeDraftOpener || activeLead.openerDraft?.content || '')}
                                className="glass-button-secondary"
                                style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.8rem', gap: '6px' }}
                              >
                                <Copy size={13} /> Edit in Composer
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSendMessage(activeDraftOpener || activeLead.openerDraft?.content || '')}
                                disabled={isSending}
                                className="glass-button"
                                style={{ padding: '8px 20px', borderRadius: '12px', fontSize: '0.82rem', gap: '7px' }}
                              >
                                <Zap size={14} color="#fbbf24" />
                                {isSending ? 'Dispatching Live...' : 'Dispatch Live Reddit DM'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* MULTI-TURN MESSAGE STREAM */
                      messages.map((msg, idx) => {
                        const isFromLead = msg.sender === 'lead';
                        const showDateHeader =
                          idx === 0 ||
                          formatDateLabel(msg.timestamp) !== formatDateLabel(messages[idx - 1].timestamp);

                        return (
                          <React.Fragment key={msg.messageId || idx}>
                            {showDateHeader && (
                              <div style={{ textAlign: 'center', margin: '8px 0' }}>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '3px 12px',
                                    borderRadius: '12px',
                                    background: 'var(--card-inner-bg)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  {formatDateLabel(msg.timestamp)}
                                </span>
                              </div>
                            )}

                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isFromLead ? 'flex-start' : 'flex-end',
                                width: '100%',
                              }}
                            >
                              <div
                                style={{
                                  maxWidth: '74%',
                                  padding: '14px 18px',
                                  borderRadius: isFromLead ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                                  background: isFromLead
                                    ? 'var(--card-inner-bg)'
                                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.28) 0%, rgba(139, 92, 246, 0.28) 100%)',
                                  border: isFromLead
                                    ? '1px solid var(--glass-border)'
                                    : '1px solid rgba(99, 102, 241, 0.45)',
                                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: '800',
                                      color: isFromLead ? '#f59e0b' : 'var(--accent-primary)',
                                    }}
                                  >
                                    {isFromLead ? `u/${activeLead.author}` : `You (u/${redditStatus.username || 'user'})`}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                    {formatTime(msg.timestamp)}
                                  </span>
                                </div>

                                <p
                                  style={{
                                    fontSize: '0.88rem',
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                    lineHeight: 1.45,
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {msg.content}
                                </p>

                                {!isFromLead && (
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '0.68rem', color: '#60a5fa' }}>
                                      <CheckCheck size={13} />
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })
                    )}

                    {/* AI Co-Pilot Recommendation Card */}
                    {aiSuggestion && (
                      <div
                        className="glass-card animate-fade-in"
                        style={{
                          marginTop: '12px',
                          padding: '18px 20px',
                          borderRadius: '18px',
                          background: 'rgba(99, 102, 241, 0.09)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '8px',
                                background: 'var(--accent-gradient)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                              }}
                            >
                              <Sparkles size={13} />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                              AI Co-Pilot Live Recommendation
                            </span>
                          </div>

                          {aiSuggestion.objectionType && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                padding: '3px 10px',
                                borderRadius: '10px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              {aiSuggestion.objectionType}
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '10px' }}>
                          💡 Strategy: {aiSuggestion.strategyRationale}
                        </p>

                        <div
                          style={{
                            background: 'var(--card-inner-bg)',
                            padding: '14px 16px',
                            borderRadius: '14px',
                            border: '1px solid var(--glass-border)',
                            fontSize: '0.88rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.45,
                            marginBottom: '14px',
                          }}
                        >
                          "{aiSuggestion.suggestedReply}"
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setInputText(aiSuggestion.suggestedReply)}
                            className="glass-button-secondary"
                            style={{ padding: '7px 16px', fontSize: '0.78rem', borderRadius: '10px', gap: '5px' }}
                          >
                            <Copy size={13} /> Insert into Composer
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMessage(aiSuggestion.suggestedReply)}
                            disabled={isSending}
                            className="glass-button"
                            style={{ padding: '7px 16px', fontSize: '0.78rem', borderRadius: '10px', gap: '5px' }}
                          >
                            <Zap size={13} color="#fbbf24" /> 1-Click Approve & Dispatch
                          </button>

                          <button
                            type="button"
                            onClick={() => setAiSuggestion(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.76rem',
                              cursor: 'pointer',
                              marginLeft: 'auto',
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reddit DM Composer Bar */}
                  <div
                    style={{
                      padding: '16px 24px',
                      borderTop: '1px solid var(--glass-border)',
                      background: 'var(--card-inner-bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      flexShrink: 0,
                    }}
                  >
                    {/* Quick Strategy Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {[
                        'Clarify zero monthly contract',
                        'Share 1-page spec sheet comparison',
                        'Ask for specific camera requirements',
                        'Offer 5-min walk-through demo',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => generateAiSuggestion(selectedThreadId, chip)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '12px',
                            background: 'var(--card-inner-bg)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.color = 'var(--accent-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          💡 {chip}
                        </button>
                      ))}
                    </div>

                    {/* Textarea & Send Button */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                      <textarea
                        rows={2}
                        placeholder={`Type direct message to u/${activeLead.author}... (Strict Live Dispatch via RedditAPIs)`}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="glass-input"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          borderRadius: '16px',
                          fontSize: '0.88rem',
                          lineHeight: 1.45,
                          resize: 'none',
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleSendMessage()}
                        disabled={isSending || !inputText.trim()}
                        className="glass-button"
                        style={{
                          height: '48px',
                          padding: '0 22px',
                          borderRadius: '14px',
                          gap: '7px',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                        }}
                      >
                        <Send size={15} />
                        {isSending ? 'Sending...' : 'Send Reddit DM'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
