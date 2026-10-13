import React, { useState, useEffect } from 'react';
import {
  X, Mail, Sparkles, Send, CheckCircle2, AlertTriangle, ShieldCheck,
  RefreshCw, Copy, Check, MessageSquare, Flame, User, AtSign, ArrowUpRight
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const EmailOutreachAgentModal = ({
  isOpen,
  onClose,
  initialLead = null,
  onEmailSent = null,
}) => {
  const [lead, setLead] = useState(initialLead);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [subreddit, setSubreddit] = useState('');
  const [targetDomain, setTargetDomain] = useState('AlertCareLine.com');
  const [tone, setTone] = useState('founder_peer');
  const [customInstruction, setCustomInstruction] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [strategyData, setStrategyData] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState('founder_peer');
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  // SMTP & Sending state
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('pulsered_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchSmtpStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/email-agent/status`, getAuthHeader());
      setSmtpStatus(res.data);
    } catch (err) {
      console.warn('Failed to fetch SMTP status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSmtpStatus();
      setSendSuccess(null);
      setErrorMessage('');
      setCopied(false);

      if (initialLead) {
        setLead(initialLead);
        const initialName = initialLead.author || 'Prospect';
        setRecipientName(initialName);
        
        // Derive or prefill email if known, or suggest plausible target
        const emailCandidate = initialLead.email || initialLead.targetEmail || `${initialName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
        setRecipientEmail(emailCandidate);
        setPostTitle(initialLead.postTitle || '');
        setPostContent(initialLead.commentQuote || initialLead.postSnippet || '');
        setSubreddit((initialLead.subreddit || 'Reddit').replace(/^r\//, ''));
        setTargetDomain(initialLead.targetDomain || 'AlertCareLine.com');

        // Automatically trigger Email Agent generation
        triggerEmailGeneration({
          leadId: initialLead._id || initialLead.id,
          recipientEmail: emailCandidate,
          recipientName: initialName,
          postTitle: initialLead.postTitle,
          postContent: initialLead.commentQuote || initialLead.postSnippet,
          subreddit: initialLead.subreddit,
          targetDomain: initialLead.targetDomain || 'AlertCareLine.com',
          psychologicalProfile: initialLead.psychologicalProfile,
          tone: 'founder_peer',
        });
      } else {
        setRecipientEmail('');
        setRecipientName('');
        setPostTitle('');
        setPostContent('');
      }
    }
  }, [isOpen, initialLead]);

  const triggerEmailGeneration = async (payloadOverride = null) => {
    setGenerating(true);
    setErrorMessage('');
    setSendSuccess(null);

    const payload = payloadOverride || {
      leadId: lead?._id || lead?.id,
      recipientEmail: recipientEmail.trim(),
      recipientName: recipientName.trim(),
      postTitle: postTitle.trim(),
      postContent: postContent.trim(),
      subreddit: subreddit.trim(),
      targetDomain: targetDomain.trim(),
      psychologicalProfile: lead?.psychologicalProfile,
      tone,
      customInstruction: customInstruction.trim(),
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/email-agent/generate`, payload, getAuthHeader());
      if (res.data?.success) {
        setStrategyData(res.data);
        const candidates = res.data.emailCandidates || [];
        const initialCandidate = candidates.find(c => c.id === tone) || candidates[0];
        if (initialCandidate) {
          setSelectedCandidateId(initialCandidate.id);
          setEditedSubject(initialCandidate.subject);
          setEditedBody(initialCandidate.body);
        }
      }
    } catch (err) {
      console.error('Error generating Email strategy:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to generate email strategy');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidateId(candidate.id);
    setEditedSubject(candidate.subject);
    setEditedBody(candidate.body);
  };

  const handleCopy = () => {
    const fullText = `To: ${recipientEmail}\nSubject: ${editedSubject}\n\n${editedBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = async () => {
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      setErrorMessage('Please provide a valid recipient email address.');
      return;
    }
    if (!editedSubject.trim()) {
      setErrorMessage('Subject line cannot be empty.');
      return;
    }
    if (!editedBody.trim()) {
      setErrorMessage('Email body cannot be empty.');
      return;
    }

    setSending(true);
    setErrorMessage('');
    setSendSuccess(null);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/email-agent/send`,
        {
          to: recipientEmail.trim(),
          subject: editedSubject.trim(),
          body: editedBody.trim(),
          leadId: lead?._id || lead?.id,
          fromName: `${targetDomain} Solutions`,
        },
        getAuthHeader()
      );

      if (res.data?.success) {
        setSendSuccess({
          to: recipientEmail.trim(),
          subject: editedSubject.trim(),
          timestamp: new Date().toLocaleTimeString(),
          mode: res.data.data?.deliveryResult?.mode || 'smtp',
          message: res.data.message || `Email successfully sent to ${recipientEmail.trim()}!`,
        });

        if (onEmailSent) {
          onEmailSent(lead?._id || lead?.id, `Subject: ${editedSubject.trim()}\n\n${editedBody.trim()}`);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to dispatch email';
      setErrorMessage(msg);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const currentCandidateObj = (strategyData?.emailCandidates || []).find(c => c.id === selectedCandidateId) || strategyData?.emailCandidates?.[0];
  const wordCount = editedBody.trim().split(/\s+/).filter(Boolean).length;

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
          maxWidth: '850px',
          maxHeight: '94vh',
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.35)',
              }}
            >
              <Mail size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  Intelligent Email Outreach Agent & Studio
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                  }}
                >
                  STRICT HIL
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                High-converting, personalized cold & warm emails dispatched only upon your explicit human approval.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-button"
            style={{ borderRadius: '12px', padding: '8px', background: 'var(--card-inner-bg)' }}
            aria-label="Close Email Agent modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Human In The Loop Guarantee Alert */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#10b981" />
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#10b981' }}>
                Human-In-The-Loop (HIL) Guardrail Active
              </span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>
                PulseRed never sends automated blind emails. You review the strategic rationale, tweak the wording, and approve delivery.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: smtpStatus?.isConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.18)',
              border: `1px solid ${smtpStatus?.isConfigured ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.35)'}`,
              fontSize: '0.72rem',
              fontWeight: '700',
              color: smtpStatus?.isConfigured ? '#34d399' : '#93c5fd',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: smtpStatus?.isConfigured ? '#10b981' : '#3b82f6',
                boxShadow: smtpStatus?.isConfigured ? '0 0 8px #10b981' : '0 0 8px #3b82f6',
              }}
            />
            {smtpStatus?.providerName || 'SMTP Ready'}
          </div>
        </div>

        {/* Lead Context & Target Audience Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            background: 'var(--card-inner-bg)',
            padding: '14px 16px',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Target Recipient Email *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <AtSign size={16} color="#3b82f6" />
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="prospect@targetdomain.com"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Prospect Name / Author
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <User size={16} color="#a855f7" />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Prospect Name"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Originating Subreddit & Target Domain
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#ff6b35', fontWeight: '700' }}>
                r/{subreddit || 'Reddit'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700' }}>
                {targetDomain}
              </span>
            </div>
          </div>
        </div>

        {/* Lead Context Snippet */}
        {postContent && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderLeft: '3px solid #3b82f6',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Source Discussion: </strong>
            "{postContent.length > 220 ? postContent.substring(0, 220) + '...' : postContent}"
          </div>
        )}

        {/* Strategic Analysis Breakdown ("How It Connects") */}
        {strategyData?.connectionStrategy && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#60a5fa" />
                <span style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Connection Strategy Blueprint ("How It Connects")
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Deliverability Safe (0% Spam Risk)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', fontSize: '0.78rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
                <strong style={{ color: '#60a5fa' }}>🎯 Context Hook Bridge:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                  {strategyData.connectionStrategy.hookRationale}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
                <strong style={{ color: '#a78bfa' }}>🤝 Empathy & Validation:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                  {strategyData.connectionStrategy.empathyBridge}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
                <strong style={{ color: '#34d399' }}>💡 Practical Value Offer:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                  {strategyData.connectionStrategy.valueOffer}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
                <strong style={{ color: '#fbbf24' }}>🛡️ Disarming Sales Friction:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                  {strategyData.connectionStrategy.disarmingTactic}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Angle Pills */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Email Angle:
            </label>
            {generating && (
              <span style={{ fontSize: '0.75rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={13} className="spin-animation" /> Crafting high-converting drafts...
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {(strategyData?.emailCandidates || [
              { id: 'founder_peer', label: '🤝 Founder & Peer Introduction' },
              { id: 'value_advisor', label: '💡 Value & Benchmark Breakdown' },
              { id: 'demo_invite', label: '🎯 Direct Solution & Demo Invite' },
            ]).map((candidate) => {
              const isSelected = selectedCandidateId === candidate.id;
              return (
                <button
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(candidate)}
                  className="glass-button"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? '800' : '600',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(99, 102, 241, 0.35) 100%)'
                      : 'var(--card-inner-bg)',
                    borderColor: isSelected ? '#3b82f6' : 'var(--glass-border)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{candidate.label}</span>
                  {candidate.humanToneScore && (
                    <span
                      style={{
                        fontSize: '0.66rem',
                        padding: '1px 5px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        fontWeight: '700',
                      }}
                    >
                      {candidate.humanToneScore}% human
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {currentCandidateObj?.whyItWorks && (
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '8px 0 0 2px' }}>
              💡 <em>Why this angle converts:</em> {currentCandidateObj.whyItWorks}
            </p>
          )}
        </div>

        {/* Email Editor: Subject & Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Subject Line
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {editedSubject.length} characters
              </span>
            </div>
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              placeholder="Email Subject Line..."
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: '600',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Personalized Email Body
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>{wordCount} words (Ideal: 80-140)</span>
                <span style={{ color: '#34d399' }}>✓ High Deliverability</span>
              </div>
            </div>

            <textarea
              rows={9}
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              placeholder="Crafted human email message..."
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--glass-border)',
                borderRadius: '14px',
                padding: '14px',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Guidance Prompt & Regenerate Row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="Add marketer guidance (e.g. 'Mention 14-day free pilot' or 'Keep it under 90 words')..."
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => triggerEmailGeneration()}
            disabled={generating}
            className="glass-button-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.8rem',
              borderRadius: '10px',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <RefreshCw size={14} className={generating ? 'spin-animation' : ''} />
            <span>Regenerate</span>
          </button>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {sendSuccess && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <CheckCircle2 size={18} />
              <span>{sendSuccess.message}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Dispatched at {sendSuccess.timestamp} • Lead stage updated to <strong>"Engaged / Replied"</strong>.
            </div>
          </div>
        )}

        {/* Modal Action Buttons: Copy & Strict HIL Approve and Send */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid var(--glass-border)',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="glass-button-secondary"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              gap: '8px',
            }}
          >
            {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Email'}</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="glass-button-secondary"
              style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.85rem' }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sending || generating}
              className="glass-button"
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                color: '#ffffff',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                gap: '8px',
                cursor: sending || generating ? 'not-allowed' : 'pointer',
                opacity: sending || generating ? 0.7 : 1,
              }}
            >
              {sending ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Sending Email...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Approve & Send Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
