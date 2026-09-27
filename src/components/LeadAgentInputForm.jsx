import React, { useState } from 'react';
import { Target, Sparkles, Search, Sliders, Globe, AlertCircle, CheckCircle, Filter, Clock, Smile, ArrowUpDown } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

export const LeadAgentInputForm = ({
  onRunScan,
  isLoading,
  lastScanStats,
  searchMode = 'semantic',
  setSearchMode,
  timeFrame = 'all',
  setTimeFrame,
  sentimentFilter = 'all',
  setSentimentFilter,
  sortBy = 'relevance',
  setSortBy,
}) => {
  const [keyword, setKeyword] = useState('affordable security cameras homeowners');
  const [subreddit, setSubreddit] = useState('homesecurity, homeautomation, SaaS');
  const [targetOffer, setTargetOffer] = useState('Automated home security, camera alerts, and 24/7 emergency response systems');
  const [targetDomain, setTargetDomain] = useState('AlertCareLine.com');

  const presetKeywords = [
    'affordable security cameras homeowners',
    'home security system compare',
    'home security for new homeowner',
    'wireless doorbell',
    'someone broke into my car',
    'cheapest home security system for home',
    'adt alternatives',
    'neighborhood break-in',
    'best security system for my home',
    'ring doorbell not working',
  ];

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;
    onRunScan({
      keyword,
      subreddit,
      targetOffer,
      targetDomain,
    });
  };

  const handleKeywordPillClick = (preset) => {
    setKeyword(preset);
    onRunScan({
      keyword: preset,
      subreddit,
      targetOffer,
      targetDomain,
    });
  };

  return (
    <div className="agent-form-container animate-fade-in" style={{ marginBottom: '28px', border: '1px solid rgba(245, 158, 11, 0.35)', boxShadow: '0 16px 48px -10px rgba(245, 158, 11, 0.12)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
            <Target size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                Lead Agent Command Center
              </h2>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot status-dot-active" style={{ backgroundColor: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }} /> Prowlo & OpenRouter AI Intelligence
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              Real-time semantic crawl, community metrics, intent scoring (0–100), and lead extraction across target subreddits.
            </p>
          </div>
        </div>

        {lastScanStats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: '700', background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '8px 16px', borderRadius: '14px' }}>
            <CheckCircle size={16} />
            <span>Last Scan: {lastScanStats.count || 0} Buyers Found</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid-2" style={{ marginBottom: '14px' }}>
          {/* Keyword Input */}
          <div>
            <label className="form-label">
              <Search size={15} color="#fbbf24" />
              Target Keyword or Buyer Problem
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. looking for CRM, alternative to Intercom, need lead gen tool"
              className="glass-input"
              style={{ width: '100%' }}
              required
            />
          </div>

          {/* Subreddit Filter */}
          <div>
            <label className="form-label">
              <Sliders size={15} color="#fbbf24" />
              Subreddit Filter (Optional)
            </label>
            <input
              type="text"
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              placeholder="e.g. SaaS, startups, Entrepreneur"
              className="glass-input"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="form-grid-2" style={{ marginBottom: '16px' }}>
          {/* Target Offer / Product Value Proposition */}
          <div>
            <label className="form-label">
              <Sparkles size={15} color="#fbbf24" />
              Product / Service Value Proposition (For AI Fit Matching)
            </label>
            <input
              type="text"
              value={targetOffer}
              onChange={(e) => setTargetOffer(e.target.value)}
              placeholder="Explain what problem your product solves so AI can match intent..."
              className="glass-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Target Domain */}
          <div>
            <label className="form-label">
              <Globe size={15} color="#fbbf24" />
              Target Brand / Domain Name
            </label>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              placeholder="e.g. YourCompany.com"
              className="glass-input"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Filter Toolbar (Mode, Time, Sentiment, Sort) */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="#818cf8" />
            <CustomSelect
              label="Mode:"
              value={searchMode || 'semantic'}
              onChange={(val) => setSearchMode && setSearchMode(val)}
              options={[
                { value: 'semantic', label: '✨ Semantic Context' },
                { value: 'exact', label: '🎯 Exact Keyword' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="#818cf8" />
            <CustomSelect
              label="Time:"
              value={timeFrame || 'all'}
              onChange={(val) => setTimeFrame && setTimeFrame(val)}
              options={[
                { value: 'all', label: '🕒 All Time' },
                { value: 'day', label: '⚡ Past 24 Hours' },
                { value: 'week', label: '📅 Past Week' },
                { value: 'month', label: '🗓️ Past Month' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smile size={14} color="#818cf8" />
            <CustomSelect
              label="Sentiment:"
              value={sentimentFilter || 'all'}
              onChange={(val) => setSentimentFilter && setSentimentFilter(val)}
              options={[
                { value: 'all', label: '💬 All Sentiments' },
                { value: 'positive', label: '😊 Positive Only' },
                { value: 'negative', label: '😡 Frustrated / Problem Seeking' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={14} color="#818cf8" />
            <CustomSelect
              label="Sort:"
              value={sortBy || 'relevance'}
              onChange={(val) => setSortBy && setSortBy(val)}
              options={[
                { value: 'relevance', label: '🔥 Relevance Score' },
                { value: 'recent', label: '🕒 Most Recent' },
                { value: 'upvotes', label: '⬆️ Highest Upvotes' },
                { value: 'comments', label: '💬 Most Comments' },
              ]}
            />
          </div>
        </div>

        {/* Preset Keyword Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Quick Keywords:</span>
          {presetKeywords.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleKeywordPillClick(preset)}
              style={{
                background: keyword === preset ? 'rgba(245, 158, 11, 0.25)' : 'var(--card-inner-bg)',
                border: `1px solid ${keyword === preset ? '#f59e0b' : 'var(--glass-border)'}`,
                color: keyword === preset ? '#fbbf24' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Submit Action */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <AlertCircle size={15} color="#fbbf24" />
            <span>Parses Reddit post authors & top thread commenters for 0–100 buying intent.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="glass-button"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)', padding: '12px 24px', fontSize: '0.92rem', fontWeight: '800' }}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Scanning Reddit via Lead Agent...
              </>
            ) : (
              <>
                <Target size={18} />
                ⚡ Run Lead Agent (Scan & Score Buyers)
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

