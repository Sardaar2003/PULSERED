import React, { useState } from 'react';
import { Search, History, Sparkles, Filter, SlidersHorizontal, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CustomSelect } from './CustomSelect';

export const SearchSection = ({ onSearch, loading, sortBy, setSortBy, selectedDomain, setSelectedDomain }) => {
  const [query, setQuery] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const { searchHistory, isAuthenticated } = useAuth();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handlePillClick = (keyword) => {
    setQuery(keyword);
    onSearch(keyword);
  };

  // Trending Prowlo Watcher Keywords from user account screenshot
  const prowloWatcherKeywords = [
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

  const sortOptions = [
    { value: 'relevance', label: 'Relevance Score' },
    { value: 'upvotes', label: 'Most Upvoted' },
    { value: 'comments', label: 'Most Comments' },
    { value: 'recent', label: 'Newest Posts' },
  ];

  const domainOptions = [
    { value: 'AlertCareLine.com', label: 'AlertCareLine.com' },
    { value: 'SecurityTechDirect.com', label: 'SecurityTechDirect.com' },
    { value: 'HomeShieldReview.com', label: 'HomeShieldReview.com' },
    { value: 'SmartHomeHQ.io', label: 'SmartHomeHQ.io' },
    { value: 'custom', label: '+ Enter Custom Domain...' },
  ];

  const handleDomainChange = (val) => {
    if (val === 'custom') {
      setIsCustomDomain(true);
    } else {
      setIsCustomDomain(false);
      setSelectedDomain(val);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '28px', marginBottom: '28px', position: 'relative', zIndex: 30, overflow: 'visible' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
          Explore Reddit Insights with <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PulseRed AI</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Real-time semantic crawl, community metrics, sentiment analysis & post extraction for any keyword.
        </p>
      </div>

      {/* Domain Selector Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', position: 'relative', zIndex: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-inner-bg)', border: '1px solid var(--glass-border)', padding: '6px 16px', borderRadius: '18px' }}>
          <Globe size={15} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Active Watcher Domain:</span>

          {!isCustomDomain ? (
            <CustomSelect
              options={domainOptions}
              value={selectedDomain}
              onChange={handleDomainChange}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="text"
                className="glass-input"
                style={{ padding: '4px 10px', fontSize: '0.85rem', height: '34px', borderRadius: '12px', width: '210px' }}
                placeholder="e.g., MyCustomBrand.com"
                value={customDomainInput}
                onChange={(e) => {
                  setCustomDomainInput(e.target.value);
                  setSelectedDomain(e.target.value || 'CustomDomain.com');
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomDomain(false);
                  setSelectedDomain('AlertCareLine.com');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '800px', margin: '0 auto 20px auto' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={20}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="glass-input"
            style={{ width: '100%', paddingLeft: '48px', fontSize: '1.05rem', height: '52px', borderRadius: '16px' }}
            placeholder="Enter any Prowlo watcher keyword (e.g., 'wireless doorbell', 'adt alternatives')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button type="submit" className="glass-button" style={{ height: '52px', padding: '0 28px', minWidth: '130px', borderRadius: '16px' }} disabled={loading}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Searching...
            </div>
          ) : (
            <>
              <Sparkles size={18} />
              Fetch Data
            </>
          )}
        </button>
      </form>

      {/* Control Bar: Prowlo Watcher Pills & Custom Glassmorphism Curved Select */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 40 }}>
        {/* Prowlo Watcher Keyword Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            <Sparkles size={14} color="#818cf8" />
            Prowlo Keywords:
          </span>
          {prowloWatcherKeywords.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => handlePillClick(topic)}
              style={{
                background: 'var(--card-inner-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--accent-primary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--glass-border)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Custom Glassmorphism Curved Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 50 }}>
          <SlidersHorizontal size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Sort:</span>
          <CustomSelect
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>
    </div>
  );
};
