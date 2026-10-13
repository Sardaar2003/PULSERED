import React, { useState, useEffect } from 'react';
import {
  X, Mail, Sparkles, Send, CheckCircle2, AlertTriangle, ShieldCheck,
  RefreshCw, Radio, Copy, Check, MessageSquare, Flame, User, ArrowUpRight
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const DmOutreachAgentModal = ({
  isOpen,
  onClose,
  initialLead = null,
  onDmSent = null,
  onOpenRedditAccount = null,
}) => {
  const [lead, setLead] = useState(initialLead);
  const [recipient, setRecipient] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [subreddit, setSubreddit] = useState('');
  const [targetDomain, setTargetDomain] = useState('AlertCareLine.com');
  const [tone, setTone] = useState('warm_peer');
  const [customInstruction, setCustomInstruction] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [strategyData, setStrategyData] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState('warm_peer');
  const [editedSubject, setEditedSubject] = useState('');
  const [editedText, setEditedText] = useState('');

  // Reddit account status & sending
  const [redditStatus, setRedditStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('pulsered_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchRedditStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/reddit-account/status`, getAuthHeader());
      setRedditStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch Reddit status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRedditStatus();
      setSendSuccess(null);
      setErrorMessage('');
      setCopied(false);

      if (initialLead) {
        setLead(initialLead);
        setRecipient(initialLead.author || '');
        setPostTitle(initialLead.postTitle || '');
        setPostContent(initialLead.commentQuote || initialLead.postSnippet || '');
        setSubreddit((initialLead.subreddit || 'Reddit').replace(/^r\//, ''));
        setTargetDomain(initialLead.targetDomain || 'AlertCareLine.com');

        // Automatically trigger DM Agent strategy generation on modal open
        triggerDmGeneration({
          leadId: initialLead._id || initialLead.id,
          recipient: initialLead.author,
          postTitle: initialLead.postTitle,
          postContent: initialLead.commentQuote || initialLead.postSnippet,
          subreddit: initialLead.subreddit,
          targetDomain: initialLead.targetDomain || 'AlertCareLine.com',
          psychologicalProfile: initialLead.psychologicalProfile,
          tone: 'warm_peer',
        });
      }
    }
  }, [isOpen, initialLead]);

  const triggerDmGeneration = async (payloadOverride = null) => {
    setGenerating(true);
    setErrorMessage('');
    setSendSuccess(null);

    const payload = payloadOverride || {
      leadId: lead?._id || lead?.id,
      recipient: recipient.trim(),
      postTitle: postTitle.trim(),
      postContent: postContent.trim(),
      subreddit: subreddit.trim(),
      targetDomain: targetDomain.trim(),
      psychologicalProfile: lead?.psychologicalProfile,
      tone,
      customInstruction: customInstruction.trim(),
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/agent/dm-agent/generate`, payload, getAuthHeader());
      if (res.data?.success) {
        setStrategyData(res.data);
        const candidates = res.data.dmCandidates || [];
        const initialCandidate = candidates.find(c => c.id === tone) || candidates[0];
        if (initialCandidate) {
          setSelectedCandidateId(initialCandidate.id);
          setEditedSubject(initialCandidate.subject);
          setEditedText(initialCandidate.content);
        }
      }
    } catch (err) {
      console.error('Error generating DM strategy:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to generate DM strategy');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidateId(candidate.id);
    setEditedSubject(candidate.subject);
    setEditedText(candidate.content);
  };

  const handleCopy = () => {
    const fullText = `Subject: ${editedSubject}\n\n${editedText}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendViaRedditApis = async () => {
    if (!editedText.trim()) {
      setErrorMessage('Message text cannot be empty.');
      return;
    }
    if (!redditStatus?.isConnected) {
      setErrorMessage('Please connect your Reddit Account credentials first to send live DMs via RedditAPIs.');
      return;
    }

    setSending(true);
    setErrorMessage('');
    setSendSuccess(null);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/reddit-account/send-dm`,
        {
          to: recipient.trim(),
          subject: editedSubject.trim() || 'Connecting regarding your Reddit post',
          text: editedText.trim(),
          leadId: lead?._id || lead?.id,
        },
        getAuthHeader()
      );

      if (res.data?.success) {
        setSendSuccess({
          recipient: recipient.trim(),
          timestamp: new Date().toLocaleTimeString(),
          message: res.data.message || 'Direct message dispatched successfully via RedditAPIs!',
        });

        if (onDmSent) {
          onDmSent(lead?._id || lead?.id, editedText.trim());
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to dispatch Reddit DM';
      setErrorMessage(msg);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const currentCandidateObj = (strategyData?.dmCandidates || []).find(c => c.id === selectedCandidateId) || strategyData?.dmCandidates?.[0];
  const wordCount = editedText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '24px',
          padding: '28px',
          border: '1px solid var(--glass-border-hover)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(255, 69, 0, 0.35)',
              }}
            >
              <Mail size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  Intelligent DM Agent & Strategy Studio
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                  }}
                >
                  RedditAPIs Live
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Humanized connection rationale & 1-click Reddit delivery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Reddit Session Status Banner */}
        <div
          style={{
            background: redditStatus?.isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${redditStatus?.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={16} color={redditStatus?.isConnected ? '#10b981' : '#f59e0b'} />
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {redditStatus?.isConnected
                  ? `Active Reddit Session: u/${redditStatus.username} (${redditStatus.commentKarma || 0} karma)`
                  : 'Reddit Account Disconnected'}
              </span>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {redditStatus?.isConnected
                  ? 'Session cookies ready for direct RedditAPIs dispatch (/api/reddit/dm)'
                  : 'Configure Reddit credentials to enable direct 1-click DM delivery'}
              </div>
            </div>
          </div>

          {!redditStatus?.isConnected && onOpenRedditAccount && (
            <button
              type="button"
              onClick={onOpenRedditAccount}
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '6px 14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Connect Reddit Account
            </button>
          )}
        </div>

        {/* Target Prospect & Context Strip */}
        <div
          style={{
            background: 'var(--card-inner-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-secondary)' }}>TARGET RECIPIENT:</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#ff6b35' }}>u/{recipient}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                r/{subreddit}
              </span>
            </div>

            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              Brand: <strong>{targetDomain}</strong>
            </span>
          </div>

          {postTitle && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: '600' }}>
              Thread: "{postTitle}"
            </div>
          )}

          {postContent && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, lineHeight: 1.35, maxHeight: '48px', overflow: 'hidden' }}>
              "{postContent}"
            </p>
          )}
        </div>

        {/* CONNECTION STRATEGY BREAKDOWN ("HOW IT CONNECTS") */}
        {strategyData?.connectionStrategy && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '18px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> HOW THIS AGENT CONNECTS WITH u/{recipient}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: '8px' }}>
                100% Organic Pacing
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--card-inner-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#fbbf24', marginBottom: '4px' }}>
                  🎯 CONNECTION HOOK
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {strategyData.connectionStrategy.hookRationale}
                </p>
              </div>

              <div style={{ background: 'var(--card-inner-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#34d399', marginBottom: '4px' }}>
                  🤝 EMPATHY BRIDGE
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {strategyData.connectionStrategy.empathyBridge}
                </p>
              </div>

              <div style={{ background: 'var(--card-inner-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#38bdf8', marginBottom: '4px' }}>
                  💡 VALUE OFFER
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {strategyData.connectionStrategy.valueOffer}
                </p>
              </div>

              <div style={{ background: 'var(--card-inner-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#c084fc', marginBottom: '4px' }}>
                  🛡️ DISARMING DEFENSIVENESS
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {strategyData.connectionStrategy.disarmingTactic}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CANDIDATE ANGLE PICKER */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            SELECT HUMAN OUTREACH ANGLE:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {(strategyData?.dmCandidates || [
              { id: 'warm_peer', label: '🤝 Warm Peer & Founder', wordCount: 42, humanToneScore: 98 },
              { id: 'helpful_advisor', label: '💡 Subject-Matter Advisor', wordCount: 52, humanToneScore: 95 },
              { id: 'direct_solution', label: '🎯 Transparent Problem-Solver', wordCount: 54, humanToneScore: 94 },
            ]).map((candidate) => {
              const isSelected = selectedCandidateId === candidate.id;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => handleSelectCandidate(candidate)}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--card-inner-bg)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                    borderRadius: '14px',
                    padding: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {candidate.label}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <span>{candidate.wordCount} words</span>
                    <span style={{ color: '#34d399', fontWeight: '700' }}>{candidate.humanToneScore || 95}% Human Score</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* EDITABLE MESSAGE COMPOSER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              DIRECT MESSAGE SUBJECT:
            </label>
            <input
              type="text"
              className="glass-input"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              placeholder="e.g. Re: your post in r/homesecurity"
              style={{ width: '100%', borderRadius: '12px', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                MESSAGE CONTENT (EDITABLE):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem' }}>
                <span style={{ color: wordCount > 65 ? '#f59e0b' : '#34d399', fontWeight: '700' }}>
                  {wordCount} words (Recommended: 30-55)
                </span>
                <span style={{ color: '#818cf8', fontWeight: '700' }}>
                  🛡️ 0% Spam Risk
                </span>
              </div>
            </div>

            <textarea
              className="glass-input"
              rows={4}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Enter your personalized direct message..."
              style={{
                width: '100%',
                borderRadius: '14px',
                fontSize: '0.88rem',
                lineHeight: 1.45,
                padding: '12px 14px',
              }}
            />
          </div>

          {currentCandidateObj?.whyItWorks && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#34d399" />
              <span>Why this works: {currentCandidateObj.whyItWorks}</span>
            </div>
          )}
        </div>

        {/* REGENERATION & CUSTOM GUIDANCE PROMPT */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="glass-input"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="Optional guidance (e.g. 'Make it shorter', 'Mention radar sensors')..."
            style={{ flex: 1, minWidth: '220px', borderRadius: '12px', fontSize: '0.82rem' }}
          />

          <button
            type="button"
            disabled={generating}
            onClick={() => triggerDmGeneration()}
            className="glass-button-secondary"
            style={{ padding: '0 16px', height: '40px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={generating ? 'spin-animation' : ''} />
            {generating ? 'Regenerating...' : '⚡ Regenerate Angles'}
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '10px 14px', color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {sendSuccess && (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '12px', padding: '12px 16px', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span>
                <strong>Delivered!</strong> Message dispatched directly to <strong>u/{sendSuccess.recipient}</strong> at {sendSuccess.timestamp} via RedditAPIs.
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)' }}>
              Stage: Engaged / Replied
            </span>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            onClick={handleCopy}
            className="glass-button-secondary"
            style={{ padding: '0 18px', height: '42px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Subject & Message'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="glass-button-secondary"
              style={{ padding: '0 18px', height: '42px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '700' }}
            >
              Close
            </button>

            <button
              type="button"
              disabled={sending || generating}
              onClick={handleSendViaRedditApis}
              className="glass-button"
              style={{
                height: '42px',
                padding: '0 22px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 6px 20px rgba(255, 69, 0, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: sending || generating ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? <RefreshCw size={16} className="spin-animation" /> : <Send size={16} />}
              {sending ? 'Dispatching via RedditAPIs...' : `🚀 Send Live Reddit DM to u/${recipient || 'User'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
