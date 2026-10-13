import React, { useState } from 'react';
import { Target, Sparkles, Search, Sliders, Globe, AlertCircle, CheckCircle, Filter, Clock, Smile, ArrowUpDown, Layers, ShieldAlert, Cpu, Zap, Plus, X, BookmarkCheck } from 'lucide-react';
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
  const [onboardingPathway, setOnboardingPathway] = useState('pitch_brief'); // website_url | competitors | pitch_brief | industry_blueprint
  const [targetDomain, setTargetDomain] = useState('AlertCareLine.com');
  const [competitors, setCompetitors] = useState('Ring Doorbell, ADT, SimpliSafe');
  const [pitchBrief, setPitchBrief] = useState('Automated home security, camera alerts, and 24/7 emergency response systems');
  const [industryBlueprint, setIndustryBlueprint] = useState('saas');
  
  const [keyword, setKeyword] = useState('affordable security cameras homeowners');
  const [subreddit, setSubreddit] = useState('homesecurity, homeautomation, SaaS');
  const [targetOffer, setTargetOffer] = useState('Automated home security, camera alerts, and 24/7 emergency response systems');
  
  // AI Strategy Blueprint Preview State
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [aiBlueprint, setAiBlueprint] = useState(null);

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

  const handleGenerateBlueprint = async () => {
    setIsGeneratingBlueprint(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/brand-domains/generate-blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          onboardingPathway,
          domainUrl: targetDomain,
          competitors,
          pitchBrief,
          industryBlueprint,
        }),
      });

      const data = await res.json();
      if (data.blueprint) {
        setAiBlueprint(data.blueprint);
        if (data.blueprint.targetKeywords && data.blueprint.targetKeywords.length > 0) {
          setKeyword(data.blueprint.targetKeywords[0]);
        }
        if (data.blueprint.targetSubreddits && data.blueprint.targetSubreddits.length > 0) {
          setSubreddit(data.blueprint.targetSubreddits.join(', '));
        }
        if (data.blueprint.specialization) {
          setTargetOffer(data.blueprint.specialization);
        }
      }
    } catch (err) {
      console.error('Failed to generate AI blueprint:', err);
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;
    onRunScan({
      keyword,
      subreddit,
      targetOffer: aiBlueprint?.specialization || targetOffer,
      targetDomain: targetDomain || 'Custom Profile',
      negativeKeywords: aiBlueprint?.negativeKeywords || [],
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

  const handleRemoveBlueprintKeyword = (kwToRemove) => {
    if (!aiBlueprint) return;
    setAiBlueprint({
      ...aiBlueprint,
      targetKeywords: aiBlueprint.targetKeywords.filter((k) => k !== kwToRemove),
    });
  };

  const handleRemoveBlueprintSubreddit = (subToRemove) => {
    if (!aiBlueprint) return;
    const updatedSubs = aiBlueprint.targetSubreddits.filter((s) => s !== subToRemove);
    setAiBlueprint({
      ...aiBlueprint,
      targetSubreddits: updatedSubs,
    });
    setSubreddit(updatedSubs.join(', '));
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
                <span className="status-dot status-dot-active" style={{ backgroundColor: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }} /> URL-Free Market Profiling Active
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              Derive buyer intent, target subreddits, and keyword strategy via Website URL, Competitors, Pitch Brief, or Presets.
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

      {/* Onboarding Pathway Selector Tabs */}
      <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} /> Market Discovery Pathway (Select Your Starting Input)
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>No website required!</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setOnboardingPathway('pitch_brief')}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: `1px solid ${onboardingPathway === 'pitch_brief' ? '#f59e0b' : 'var(--glass-border)'}`,
              background: onboardingPathway === 'pitch_brief' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
              color: onboardingPathway === 'pitch_brief' ? '#fbbf24' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={16} /> 1-Sentence Pitch
          </button>

          <button
            type="button"
            onClick={() => setOnboardingPathway('competitors')}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: `1px solid ${onboardingPathway === 'competitors' ? '#f59e0b' : 'var(--glass-border)'}`,
              background: onboardingPathway === 'competitors' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
              color: onboardingPathway === 'competitors' ? '#fbbf24' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Target size={16} /> Competitor Benchmarks
          </button>

          <button
            type="button"
            onClick={() => setOnboardingPathway('industry_blueprint')}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: `1px solid ${onboardingPathway === 'industry_blueprint' ? '#f59e0b' : 'var(--glass-border)'}`,
              background: onboardingPathway === 'industry_blueprint' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
              color: onboardingPathway === 'industry_blueprint' ? '#fbbf24' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Cpu size={16} /> Industry Preset
          </button>

          <button
            type="button"
            onClick={() => setOnboardingPathway('website_url')}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: `1px solid ${onboardingPathway === 'website_url' ? '#f59e0b' : 'var(--glass-border)'}`,
              background: onboardingPathway === 'website_url' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
              color: onboardingPathway === 'website_url' ? '#fbbf24' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Globe size={16} /> Website URL (Optional)
          </button>
        </div>
      </div>

      {/* Dynamic Input Based on Active Pathway */}
      <div style={{ marginBottom: '18px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        {onboardingPathway === 'pitch_brief' && (
          <div>
            <label className="form-label">
              <Sparkles size={15} color="#fbbf24" />
              Product / Offer 1-Sentence Pitch Brief
            </label>
            <input
              type="text"
              value={pitchBrief}
              onChange={(e) => setPitchBrief(e.target.value)}
              placeholder="e.g. We build lightweight AI chatbots for Shopify store owners to reduce cart abandonment..."
              className="glass-input"
              style={{ width: '100%', marginBottom: '10px' }}
            />
          </div>
        )}

        {onboardingPathway === 'competitors' && (
          <div>
            <label className="form-label">
              <Target size={15} color="#fbbf24" />
              Competitors / Alternatives (Separate with commas)
            </label>
            <input
              type="text"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="e.g. Ring Doorbell, ADT, SimpliSafe OR HubSpot, Zapier, Intercom"
              className="glass-input"
              style={{ width: '100%', marginBottom: '10px' }}
            />
          </div>
        )}

        {onboardingPathway === 'industry_blueprint' && (
          <div>
            <label className="form-label">
              <Cpu size={15} color="#fbbf24" />
              Select Targeted Industry Category
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { id: 'saas', name: '💼 B2B SaaS & Productivity' },
                { id: 'devtools', name: '⚙️ DevTools & Infrastructure' },
                { id: 'ecommerce', name: '🛒 E-Commerce & Shopify' },
                { id: 'security', name: '🛡️ Home Security & Hardware' },
                { id: 'agency', name: '📈 Lead Gen & Marketing Agency' },
              ].map((ind) => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setIndustryBlueprint(ind.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: `1px solid ${industryBlueprint === ind.id ? '#f59e0b' : 'var(--glass-border)'}`,
                    background: industryBlueprint === ind.id ? 'rgba(245, 158, 11, 0.25)' : 'var(--card-inner-bg)',
                    color: industryBlueprint === ind.id ? '#fbbf24' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {ind.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {onboardingPathway === 'website_url' && (
          <div>
            <label className="form-label">
              <Globe size={15} color="#fbbf24" />
              Website or Landing Page Domain URL
            </label>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              placeholder="e.g. AlertCareLine.com"
              className="glass-input"
              style={{ width: '100%', marginBottom: '10px' }}
            />
          </div>
        )}

        {/* Blueprint Generator Trigger Button */}
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleGenerateBlueprint}
            disabled={isGeneratingBlueprint}
            className="glass-button"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            {isGeneratingBlueprint ? (
              <>
                <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Analyzing Market Signals & Generating Blueprint...
              </>
            ) : (
              <>
                <Zap size={16} color="#fbbf24" />
                ✨ Generate AI Strategy Blueprint
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Strategy Blueprint Preview Card (Trust & Scalability Layer) */}
      {aiBlueprint && (
        <div style={{ marginBottom: '22px', background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '18px', padding: '18px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }} className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <BookmarkCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>
                  AI Strategy Blueprint: {aiBlueprint.brandName}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {aiBlueprint.specialization}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: '0.82rem', fontWeight: '800' }}>
              <Zap size={14} />
              <span>{aiBlueprint.confidenceScore || 92}% Strategy Confidence</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            {/* Target ICP */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Ideal Customer Persona (ICP)</span>
              <p style={{ fontSize: '0.83rem', color: '#f1f5f9', marginTop: '4px', fontWeight: '500' }}>
                {aiBlueprint.targetICP}
              </p>
            </div>

            {/* Buying Intent Triggers */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Buying Intent Signals Detected</span>
              <ul style={{ paddingLeft: '16px', marginTop: '4px', margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>
                {aiBlueprint.buyingIntentTriggers?.map((trig, idx) => (
                  <li key={idx}>{trig}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Subreddits & Keywords Tag Editors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            {/* Target Subreddits */}
            <div>
              <span style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Sliders size={13} /> Target Communities (Subreddits):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {aiBlueprint.targetSubreddits?.map((sub) => (
                  <span key={sub} style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    r/{sub}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveBlueprintSubreddit(sub)} />
                  </span>
                ))}
              </div>
            </div>

            {/* Negative Exclude Keywords */}
            <div>
              <span style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <ShieldAlert size={13} /> Excluded Noise Terms (Negative Filters):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {aiBlueprint.negativeKeywords?.map((neg) => (
                  <span key={neg} style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 8px', borderRadius: '12px' }}>
                    -{neg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* High Intent Buyer Keywords */}
          <div>
            <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Search size={13} /> Auto-Discovered Buying Intent Keywords:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {aiBlueprint.targetKeywords?.map((kw) => (
                <span
                  key={kw}
                  onClick={() => setKeyword(kw)}
                  style={{
                    fontSize: '0.76rem',
                    background: keyword === kw ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.06)',
                    color: keyword === kw ? '#38bdf8' : '#e2e8f0',
                    border: `1px solid ${keyword === kw ? '#38bdf8' : 'rgba(255,255,255,0.12)'}`,
                    padding: '4px 10px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {kw}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleRemoveBlueprintKeyword(kw); }} />
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Scan Form */}
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
              Target Brand Name / Identifier
            </label>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              placeholder="e.g. YourBrand or Custom Profile"
              className="glass-input"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Filter Toolbar (Mode, Time, Sentiment, Sort) */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px', background: 'var(--card-inner-bg)', padding: '12px 18px', borderRadius: '22px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--accent-primary)" />
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


