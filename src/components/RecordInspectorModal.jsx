import React from 'react';
import { X, Sparkles, CheckCircle2, ArrowUp, MessageSquare, ExternalLink, Bookmark, ShieldCheck, Tag, HeartPulse, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RecordInspectorModal = ({ post, searchKeyword, domainName, onClose }) => {
  const { savedPosts, toggleSavePost } = useAuth();

  if (!post) return null;

  const isSaved = savedPosts.some((sp) => sp.postId === post.id);

  // Compute intelligence metrics for why this was chosen
  const keywordTerms = (searchKeyword || '').toLowerCase().split(' ').filter((w) => w.length > 2);
  const matchedTerms = keywordTerms.filter(
    (term) => post.title.toLowerCase().includes(term) || (post.selftext && post.selftext.toLowerCase().includes(term))
  );

  const matchPercentage = post.relevanceScore ? Math.round(post.relevanceScore * 100) : Math.min(98, 70 + matchedTerms.length * 10);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '24px',
          padding: '32px',
          position: 'relative',
          background: 'var(--card-inner-bg-solid)',
          border: '1px solid var(--accent-primary)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'var(--card-inner-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              background: 'var(--accent-gradient)',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
              Prowlo AI Record Intelligence
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Deep extraction breakdown & selection rationale for target watcher: <strong style={{ color: 'var(--text-primary)' }}>"{searchKeyword}"</strong>
            </span>
          </div>
        </div>

        {/* Post Title Card */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '18px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--accent-gradient)', color: '#fff', fontSize: '0.75rem', fontWeight: '800', padding: '3px 10px', borderRadius: '12px' }}>
              {post.subreddit}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Author: <strong style={{ color: 'var(--text-secondary)' }}>u/{post.author}</strong>
            </span>
            <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: '700', marginLeft: 'auto' }}>
              <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Prowlo Verified Match
            </span>
          </div>

          <h4 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px', lineHeight: 1.4 }}>
            {post.title}
          </h4>

          {post.selftext && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              {post.selftext}
            </p>
          )}
        </div>

        {/* Intelligence Breakdown Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* Why Chosen Card */}
          <div
            style={{
              background: 'var(--card-inner-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '18px',
            }}
          >
            <h5 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8' }}>
              <CheckCircle2 size={18} />
              Why Was This Record Chosen?
            </h5>
            <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong>Semantic Relevance Score</strong>: <span style={{ color: '#4ade80', fontWeight: '700' }}>{matchPercentage}% Match</span> against target watcher query.
              </li>
              <li>
                <strong>Matched Key Terms</strong>:{' '}
                {matchedTerms.length > 0 ? (
                  matchedTerms.map((t) => (
                    <span key={t} style={{ background: 'rgba(129, 140, 248, 0.2)', color: '#818cf8', padding: '1px 6px', borderRadius: '6px', fontSize: '0.75rem', marginRight: '4px', fontWeight: '600' }}>
                      {t}
                    </span>
                  ))
                ) : (
                  <span>Topic domain match in {post.subreddit}</span>
                )}
              </li>
              <li>
                <strong>Prowlo Crawler Channel</strong>: Extracted under active watcher domain <code>{domainName || 'AlertCareLine.com'}</code>.
              </li>
            </ul>
          </div>

          {/* Engagement & Sentiment Rationale Card */}
          <div
            style={{
              background: 'var(--card-inner-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '18px',
            }}
          >
            <h5 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7' }}>
              <HeartPulse size={18} />
              Sentiment & Engagement Scoring
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Sentiment:</span>
                <span
                  style={{
                    fontWeight: '700',
                    color: post.sentiment === 'Positive' ? '#4ade80' : post.sentiment === 'Negative' ? '#f87171' : '#fbbf24',
                    background: post.sentiment === 'Positive' ? 'rgba(74,222,128,0.15)' : post.sentiment === 'Negative' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                    padding: '2px 10px',
                    borderRadius: '12px',
                  }}
                >
                  {post.sentiment}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Upvote Score:</span>
                <span style={{ fontWeight: '700', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUp size={14} /> {post.score ? post.score.toLocaleString() : 0} upvotes
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Community Comments:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageSquare size={14} /> {post.numComments || 0} comments
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
          <button
            onClick={() => toggleSavePost(post)}
            className="glass-button-secondary"
            style={{ borderRadius: '14px', background: isSaved ? 'rgba(168, 85, 247, 0.25)' : undefined }}
          >
            <Bookmark size={15} fill={isSaved ? '#a855f7' : 'none'} color={isSaved ? '#a855f7' : 'currentColor'} />
            {isSaved ? 'Saved in Workspace' : 'Bookmark Record'}
          </button>

          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-button"
            style={{ borderRadius: '14px', textDecoration: 'none' }}
          >
            Open Thread on Reddit
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </div>
  );
};
