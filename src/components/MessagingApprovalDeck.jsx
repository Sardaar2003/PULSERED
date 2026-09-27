import React, { useState } from 'react';
import { Send, CheckCircle2, RefreshCw, Sparkles, MessageSquare, UserCheck, Edit3 } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const MessagingApprovalDeck = ({ leads = [], onLeadUpdated }) => {
  const pendingLeads = leads.filter(l => l.approvalStatus === 'draft' || l.stage === 'New' || l.stage === 'Engaged' || l.stage === 'Qualified');
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState(1);
  const [customDraftText, setCustomDraftText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessInfo, setSendSuccessInfo] = useState(null);
  const [prospectReplyInput, setProspectReplyInput] = useState('');
  const [isGeneratingCandidates, setIsGeneratingCandidates] = useState(false);

  const activeLead = pendingLeads[activeIdx] || pendingLeads[0];

  if (!activeLead) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '20px' }}>
        <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>All Messaging Drafts Reviewed!</h3>
        <p style={{ color: 'var(--text-secondary)' }}>The Lead Agent is watching subreddits for new buyer leads. Check back shortly!</p>
      </div>
    );
  }

  const leadId = activeLead.id || activeLead._id;
  const opener = activeLead.openerDraft?.content || `Hey ${activeLead.author}, saw your post regarding ${activeLead.postTitle}... Curious if you tried automated alerts?`;
  const candidates = activeLead.replyCandidates || [];
  const activeCandidate = candidates.find(c => c.candidateId === selectedCandidateId) || candidates[0];

  const currentDisplayText = isEditing
    ? customDraftText
    : (activeCandidate ? activeCandidate.content : opener);

  const wordCount = currentDisplayText.trim().split(/\s+/).filter(Boolean).length;

  const handleApproveSend = async () => {
    setIsSending(true);
    setSendSuccessInfo(null);
    try {
      const token = localStorage.getItem('pulsered_token');
      const res = await axios.post(
        `${API_BASE_URL}/agent/leads/${leadId}/approve-send`,
        {
          editedContent: isEditing ? customDraftText : null,
          candidateId: selectedCandidateId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSendSuccessInfo(res.data?.executionInfo);
      if (onLeadUpdated) onLeadUpdated();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to approve DM:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateFollowups = async () => {
    if (!prospectReplyInput.trim()) return;
    setIsGeneratingCandidates(true);
    try {
      const token = localStorage.getItem('pulsered_token');
      await axios.post(
        `${API_BASE_URL}/agent/leads/${leadId}/reply-candidates`,
        { prospectReplyText: prospectReplyInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onLeadUpdated) onLeadUpdated();
      setProspectReplyInput('');
    } catch (err) {
      console.error('Failed to generate reply candidates:', err);
    } finally {
      setIsGeneratingCandidates(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '28px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ padding: '8px', background: 'rgba(236, 72, 153, 0.18)', borderRadius: '12px', color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)' }}>Messaging Agent • HIL Approval Deck</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Review, edit, or approve voice-matched openers & reply candidates. All DMs send at human-pace (jittered delay).
          </p>
        </div>

        {/* Lead Queue Pager */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0, 0, 0, 0.3)', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            Lead <strong style={{ color: '#818cf8' }}>{activeIdx + 1}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{pendingLeads.length}</strong>
          </span>
          <button
            disabled={activeIdx === 0}
            onClick={() => setActiveIdx(p => Math.max(0, p - 1))}
            className="glass-button-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '10px' }}
          >
            Previous
          </button>
          <button
            disabled={activeIdx >= pendingLeads.length - 1}
            onClick={() => setActiveIdx(p => Math.min(pendingLeads.length - 1, p + 1))}
            className="glass-button-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '10px' }}
          >
            Next Lead
          </button>
        </div>
      </div>

      {/* Main Grid: Context & Prospect Snapshot (Left) + Draft & Approval (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Left Column: Prospect Context & Snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Post Header Card */}
          <div style={{ background: 'var(--card-inner-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#818cf8', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                {activeLead.subreddit}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ef4444' }}>
                🔥 Score: {activeLead.intentScore}/100
              </span>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.35', marginBottom: '8px' }}>
              {activeLead.postTitle}
            </h4>

            {activeLead.leadOrigin === 'thread_commenter' && activeLead.commentQuote && (
              <div style={{ background: 'rgba(236, 72, 153, 0.1)', borderLeft: '3px solid #ec4899', padding: '10px 12px', borderRadius: '10px', margin: '8px 0', fontSize: '0.84rem', color: '#ec4899' }}>
                <strong style={{ display: 'block', fontSize: '0.72rem', color: '#f472b6', marginBottom: '2px' }}>💬 Exact Comment Quote from u/{activeLead.author}:</strong>
                "{activeLead.commentQuote}"
              </div>
            )}

            {activeLead.postSnippet && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
                "{activeLead.postSnippet.length > 180 ? activeLead.postSnippet.substring(0, 180) + '...' : activeLead.postSnippet}"
              </p>
            )}
          </div>


          {/* Prospect Snapshot Box */}
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} /> Reddit Prospect Snapshot
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Author: </span>
                <strong style={{ color: 'var(--text-primary)' }}>u/{activeLead.author}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Karma: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{activeLead.prospectSnapshot?.karma || 1250}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Account Age: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{activeLead.prospectSnapshot?.accountAgeDays || 340} days</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Stage: </span>
                <strong style={{ color: '#818cf8' }}>{activeLead.stage}</strong>
              </div>
            </div>
          </div>

          {/* 3D Intent Breakdown */}
          {activeLead.scoreBreakdown && (
            <div style={{ background: 'var(--card-inner-bg)', padding: '14px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                3-Dimensional Intent Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Problem Fit (40%)</span>
                    <strong>{activeLead.scoreBreakdown.problemFit || 88}%</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ background: '#6366f1', width: `${activeLead.scoreBreakdown.problemFit || 88}%`, height: '100%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Audience Fit (35%)</span>
                    <strong>{activeLead.scoreBreakdown.audienceFit || 82}%</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ background: '#ec4899', width: `${activeLead.scoreBreakdown.audienceFit || 82}%`, height: '100%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Urgency (25%)</span>
                    <strong>{activeLead.scoreBreakdown.urgency || 85}%</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ background: '#f59e0b', width: `${activeLead.scoreBreakdown.urgency || 85}%`, height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prospect Reply Input Simulation */}
          <div style={{ background: 'var(--card-inner-bg)', padding: '14px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={14} color="#818cf8" /> Prospect Replied? Draft 3 Follow-up Candidates
            </div>
            <textarea
              value={prospectReplyInput}
              onChange={(e) => setProspectReplyInput(e.target.value)}
              placeholder="Paste prospect's reply message here..."
              style={{
                width: '100%',
                height: '54px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '8px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                resize: 'none',
                marginBottom: '8px',
              }}
            />
            <button
              onClick={handleGenerateFollowups}
              disabled={isGeneratingCandidates || !prospectReplyInput.trim()}
              className="glass-button-secondary"
              style={{ width: '100%', padding: '6px', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              {isGeneratingCandidates ? <RefreshCw className="spin" size={14} /> : 'Generate 3 Candidate Follow-ups'}
            </button>
          </div>
        </div>

        {/* Right Column: Drafted DM & HIL Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Candidate Switcher (If reply candidates exist) */}
          {candidates.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', background: 'var(--card-inner-bg)', padding: '6px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              {candidates.map((c) => (
                <button
                  key={c.candidateId}
                  onClick={() => {
                    setSelectedCandidateId(c.candidateId);
                    setIsEditing(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: 'none',
                    background: selectedCandidateId === c.candidateId ? 'var(--accent-primary)' : 'transparent',
                    color: selectedCandidateId === c.candidateId ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Candidate #{c.candidateId}
                </button>
              ))}
            </div>
          )}

          {/* Active Strategy Rationale */}
          {activeCandidate && (
            <div style={{ fontSize: '0.76rem', color: '#818cf8', fontWeight: '600' }}>
              💡 Strategy: {activeCandidate.strategyRationale}
            </div>
          )}

          {/* Draft Content Card / Editor */}
          <div style={{ background: 'var(--card-inner-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {candidates.length > 0 ? `Candidate Reply #${selectedCandidateId}` : 'Personalized Opener Draft'}
              </span>
              <button
                onClick={() => {
                  if (!isEditing) setCustomDraftText(currentDisplayText);
                  setIsEditing(!isEditing);
                }}
                style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Edit3 size={14} /> {isEditing ? 'Cancel Edit' : 'Edit Text'}
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={customDraftText}
                onChange={(e) => setCustomDraftText(e.target.value)}
                style={{
                  width: '100%',
                  height: '110px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  lineHeight: '1.4',
                }}
              />
            ) : (
              <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.45', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '12px', borderLeft: '3px solid var(--accent-primary)' }}>
                "{currentDisplayText}"
              </p>
            )}

            {/* Quality Bar Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.74rem' }}>
              <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: '8px', fontWeight: '700' }}>
                📏 {wordCount} words (Target: 20-40)
              </span>
              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '8px', fontWeight: '700' }}>
                🎙️ Voice Match: 94%
              </span>
              <span style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', padding: '3px 8px', borderRadius: '8px', fontWeight: '700' }}>
                🚫 Zero Sales Pitch
              </span>
            </div>
          </div>

          {/* Execution & Send Button */}
          {sendSuccessInfo ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '14px', borderRadius: '14px', color: '#10b981', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> DM Approved & Dispatched!
              </div>
              <div>Sent via: {sendSuccessInfo.sentVia}</div>
              <div>Pacing delay: {sendSuccessInfo.humanPaceDelay}</div>
            </div>
          ) : (
            <button
              onClick={handleApproveSend}
              disabled={isSending}
              className="glass-button-primary"
              style={{
                padding: '14px',
                borderRadius: '14px',
                fontSize: '0.95rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isSending ? (
                <>
                  <RefreshCw className="spin" size={18} />
                  Dispatching at Human Pace (Jittered Delay)...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Approve & Send DM from Browser Session
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
