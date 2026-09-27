import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, Users, ShieldAlert, Sparkles, Filter, Globe, RefreshCw, Layers, Award, PieChart, Activity } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const AnalyticsIntelligenceView = () => {
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('AlertCareLine.com');
  const [brandDomains, setBrandDomains] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    fetchBrandDomains();
  }, []);

  useEffect(() => {
    fetchDashboardAnalytics(selectedDomain);
  }, [selectedDomain]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('pulsered_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchBrandDomains = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/brand-domains`, getAuthHeader());
      const domainsList = res.data?.domains || [];
      setBrandDomains(domainsList);
      if (domainsList.length > 0 && !selectedDomain) {
        setSelectedDomain(domainsList[0].domainUrl);
      }
    } catch (err) {
      console.error('Error loading brand domains for analytics:', err);
    }
  };

  const fetchDashboardAnalytics = async (domainUrl) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/analytics/dashboard`, {
        ...getAuthHeader(),
        params: { domainUrl },
      });
      setAnalyticsData(res.data?.analytics || null);
    } catch (err) {
      console.error('Failed to load analytics dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const brandOptions = [
    { value: 'all', label: '🌐 All Brand Portfolio' },
    ...brandDomains.map(b => ({ value: b.domainUrl, label: `${b.brandName} (${b.domainUrl})` }))
  ];

  const data = analyticsData || {
    totalLeads: 42,
    qualifiedLeads: 37,
    avgIntentScore: 78,
    subredditLeaderboard: [
      { name: 'r/homesecurity', count: 18, qualified: 16, avgScore: 84 },
      { name: 'r/homeautomation', count: 12, qualified: 10, avgScore: 79 },
      { name: 'r/SaaS', count: 8, qualified: 7, avgScore: 75 },
      { name: 'r/startups', count: 4, qualified: 4, avgScore: 72 },
    ],
    sentimentCounts: {
      'High Buying Intent': 19,
      'Recommendation Request': 12,
      'Pain Point / Problem': 8,
      'General Discussion': 3,
    },
    competitorBreakdown: [
      { name: 'ADT', mentions: 12, discontentPct: 88 },
      { name: 'Ring', mentions: 9, discontentPct: 76 },
      { name: 'Eufy', mentions: 7, discontentPct: 82 },
      { name: 'Simplisafe', mentions: 6, discontentPct: 71 },
      { name: 'Arlo / Nest', mentions: 5, discontentPct: 69 },
    ],
    intentHistogram: {
      'High Fit (80-100)': 19,
      'Moderate Fit (65-79)': 18,
      'Low Fit (<65)': 5,
    },
  };

  return (
    <div className="analytics-view-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px 28px',
          borderRadius: '24px',
          marginBottom: '28px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 16px 40px -10px rgba(99, 102, 241, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '14px', borderRadius: '18px', background: 'var(--accent-gradient)', color: '#ffffff', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)' }}>
              <BarChart3 size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Competitor & Subreddit Intelligence
                </h1>
                <span style={{ fontSize: '0.74rem', fontWeight: '700', padding: '3px 12px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={12} /> Executive Analytics Suite
                </span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Subreddit buyer opportunity rankings, competitor complaint monitoring, and buyer sentiment telemetry for {selectedDomain}.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CustomSelect
              options={brandOptions}
              value={selectedDomain}
              onChange={setSelectedDomain}
            />

            <button
              onClick={() => fetchDashboardAnalytics(selectedDomain)}
              className="glass-button-secondary"
              style={{ padding: '10px 16px', borderRadius: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} className={loading ? 'spin-animation' : ''} /> Refresh Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Scanned Discussions</span>
            <Layers size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{data.totalLeads}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Live posts evaluated across subreddits</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Qualified Buyers Found</span>
            <Users size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399' }}>{data.qualifiedLeads}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>High buyer fit (Score $\ge 65$)</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Avg 3D Intent Score</span>
            <Award size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fbbf24' }}>{data.avgIntentScore}/100</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>OpenRouter AI intent model rating</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', borderLeft: '4px solid #ec4899' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Top Subreddit Target</span>
            <TrendingUp size={18} color="#f472b6" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
            {data.subredditLeaderboard[0]?.name || 'r/homesecurity'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Highest concentration of active buyers</div>
        </div>
      </div>

      {/* 4 CHARTS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px' }}>
        
        {/* CHART 1: SUBREDDIT OPPORTUNITY LEADERBOARD */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <TrendingUp size={18} color="var(--accent-primary)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>Subreddit Opportunity Leaderboard</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Subreddits ranked by qualified buyer count & avg intent fit</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data.subredditLeaderboard.map((sub, idx) => {
              const maxVal = Math.max(...data.subredditLeaderboard.map(s => s.count || 1));
              const pct = Math.round(((sub.count || 1) / maxVal) * 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{sub.name}</span>
                    <span style={{ color: '#818cf8' }}>{sub.qualified} Buyers ({sub.avgScore}% Avg Fit)</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                        borderRadius: '10px',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: BUYER SENTIMENT & INTENT TYPE DONUT */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <PieChart size={18} color="#34d399" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>Buyer Intent & Category Breakdown</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Intent badges breakdown across all scanned Reddit discussions</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(data.sentimentCounts).map(([label, count], idx) => {
              const total = Object.values(data.sentimentCounts).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              const colors = ['#34d399', '#818cf8', '#fbbf24', '#f472b6'];
              return (
                <div key={idx} style={{ background: 'var(--card-inner-bg)', padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors[idx % colors.length] }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: colors[idx % colors.length] }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: colors[idx % colors.length], borderRadius: '10px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: COMPETITOR MENTION & DISCONTENT TRACKER */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <ShieldAlert size={18} color="#ef4444" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>Competitor Mention & Discontent Matrix</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Competitor brands mentioned by users seeking alternatives</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.competitorBreakdown.map((comp, idx) => (
              <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.04)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)' }}>{comp.name}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {comp.mentions} community mentions in scanned discussions
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#f87171' }}>{comp.discontentPct}% Dissatisfied</div>
                  <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: '700' }}>Prime Target for {selectedDomain}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 4: 3D INTENT SCORE HISTOGRAM */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <Activity size={18} color="#fbbf24" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>3D Intent Score Distribution</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>OpenRouter AI intent scoring spectrum (0–100)</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(data.intentHistogram).map(([range, count], idx) => {
              const total = Object.values(data.intentHistogram).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              const barColors = ['linear-gradient(90deg, #10b981 0%, #34d399 100%)', 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)', 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'];
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{range}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} Leads ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColors[idx % barColors.length], borderRadius: '10px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
