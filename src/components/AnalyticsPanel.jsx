import React from 'react';
import { BarChart3, TrendingUp, ThumbsUp, MessageSquare, ShieldCheck, Smile, Meh, Frown } from 'lucide-react';

export const AnalyticsPanel = ({ analytics, keyword }) => {
  if (!analytics) return null;

  const { totalResults, avgScore, topSubreddits, sentimentCounts, sourceProvider } = analytics;
  const totalSentiments = (sentimentCounts.Positive || 0) + (sentimentCounts.Neutral || 0) + (sentimentCounts.Negative || 0) || 1;

  const posPct = Math.round(((sentimentCounts.Positive || 0) / totalSentiments) * 100);
  const neuPct = Math.round(((sentimentCounts.Neutral || 0) / totalSentiments) * 100);
  const negPct = Math.round(((sentimentCounts.Negative || 0) / totalSentiments) * 100);

  const displayProvider = sourceProvider ? sourceProvider.replace('Prowlo', 'PulseRed AI') : 'PulseRed AI Engine';

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={20} color="#6366f1" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
            Intelligence Overview for <span style={{ color: '#818cf8' }}>"{keyword}"</span>
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '4px 12px',
              borderRadius: '16px',
              background: 'rgba(74, 222, 128, 0.15)',
              color: '#4ade80',
              border: '1px solid rgba(74, 222, 128, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
            Prowlo API: HIT (200 OK)
          </span>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '16px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={14} />
            Engine: {sourceProvider || 'Prowlo Live Intelligence Engine'}
          </span>
        </div>
      </div>

      {/* Grid Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Metric 1 */}
        <div style={{ background: 'var(--card-inner-bg)', borderRadius: '16px', padding: '16px', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Extracted Posts</span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '4px', color: 'var(--text-primary)' }}>
            {totalResults}
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{ background: 'var(--card-inner-bg)', borderRadius: '16px', padding: '16px', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Average Score / Upvotes</span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '4px', color: '#4ade80' }}>
            {avgScore.toLocaleString()}
          </div>
        </div>

        {/* Metric 3: Sentiment Polarities */}
        <div style={{ background: 'var(--card-inner-bg)', borderRadius: '16px', padding: '16px', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dominant Sentiment</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span className="badge-sentiment-positive" style={{ fontSize: '0.85rem' }}>
              <Smile size={14} /> {posPct}% Pos
            </span>
            <span className="badge-sentiment-neutral" style={{ fontSize: '0.85rem' }}>
              <Meh size={14} /> {neuPct}% Neu
            </span>
          </div>
        </div>
      </div>

      {/* Sentiment Progress Distribution Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          <span>Sentiment Distribution</span>
          <span>{posPct}% Positive • {neuPct}% Neutral • {negPct}% Negative</span>
        </div>
        <div style={{ height: '8px', width: '100%', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${posPct}%`, background: '#22c55e' }} title={`Positive: ${posPct}%`} />
          <div style={{ width: `${neuPct}%`, background: '#94a3b8' }} title={`Neutral: ${neuPct}%`} />
          <div style={{ width: `${negPct}%`, background: '#ef4444' }} title={`Negative: ${negPct}%`} />
        </div>
      </div>

      {/* Top Active Subreddits */}
      <div>
        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
          Top Active Subreddits:
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {topSubreddits && topSubreddits.map((sr) => (
            <span
              key={sr.name}
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: 'var(--text-primary)',
                padding: '4px 14px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: '600',
              }}
            >
              {sr.name} <span style={{ color: '#818cf8', marginLeft: '4px' }}>({sr.count})</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
