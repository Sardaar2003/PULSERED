import React, { useState, useEffect } from 'react';
import {
  Sliders, Zap, MessageSquare, Mail, Save, RotateCcw,
  ShieldCheck, Check, AlertCircle, Sparkles, Server, Lock, Cpu, Eye, EyeOff,
  RefreshCw, Layers, CheckCircle2, ArrowRight, Gauge, Radio, Shield, Globe, Send
} from 'lucide-react';
import axios from 'axios';
import { CustomSelect } from './CustomSelect';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const AgentSettingsView = () => {
  const [activeTab, setActiveTab] = useState('lead'); // 'lead' | 'dm' | 'email'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    leadAgent: {
      searchDepth: 15,
      targetAudience: 'both', // 'both' | 'authors' | 'commenters'
      minIntentScore: 65,
      deduplicateSeen: true,
      scanComments: true,
      aiModel: 'google/gemini-2.0-flash-001',
      defaultSubreddit: 'all',
    },
    dmAgent: {
      defaultTone: 'warm_peer', // 'warm_peer' | 'value_advisor' | 'solution_consultant'
      maxWords: 110,
      requireApproval: true,
      customInstructions: 'Avoid marketing speak, sound like a helpful peer engineer.',
      dailyLimit: 25,
      dispatchMethod: 'reddit_api',
    },
    emailAgent: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      smtpFrom: '',
      fromName: 'PulseRed Outreach',
      defaultAngle: 'founder_peer', // 'founder_peer' | 'value_advisor' | 'demo_invite'
      deliveryMode: 'simulated_delivery', // 'live_smtp' | 'simulated_delivery'
      requireApproval: true,
      customInstructions: 'Highlight transparent pricing and zero lock-in contracts.',
    },
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem('pulsered_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/agent-settings`, getAuthHeader());
      if (res.data?.success && res.data?.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.warn('Could not load agent settings, using defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await axios.put(`${API_BASE_URL}/agent-settings`, settings, getAuthHeader());
      if (res.data?.success) {
        setSuccessMessage('Agent configuration saved successfully! Active parameters are now directly guiding sweeps, DMs, and emails.');
        setTimeout(() => setSuccessMessage(''), 4500);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to update agent settings';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all agent configurations to factory default parameters?')) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/agent-settings/reset`, {}, getAuthHeader());
      if (res.data?.success) {
        setSettings(res.data.settings);
        setSuccessMessage('Settings reset to system defaults.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage('Failed to reset settings');
    } finally {
      setLoading(false);
    }
  };

  // Curved CustomSelect Option Definitions with rich subtitles and badges
  const targetAudienceOptions = [
    {
      value: 'both',
      label: '👥 Both Post Authors & Commenters',
      description: 'Extracts the original poster plus all participating commenters with commercial buying intent.',
      badge: 'Recommended',
    },
    {
      value: 'authors',
      label: '📝 Post Authors Only (Original Posters)',
      description: 'Focuses exclusively on OP inquiry posts, ignoring discussion comments.',
      badge: 'High Intent',
    },
    {
      value: 'commenters',
      label: '💬 Thread Commenters Only',
      description: 'Targets prospects actively seeking alternatives or asking for solutions in replies.',
      badge: 'Broad Pool',
    },
  ];

  const aiModelOptions = [
    {
      value: 'google/gemini-2.0-flash-001',
      label: '⚡ Google Gemini 2.0 Flash',
      description: 'Ultra-fast sub-second response, optimal for real-time 3D psychological intent scoring.',
      badge: 'Default • Fastest',
    },
    {
      value: 'meta-llama/llama-3.3-70b-instruct',
      label: '🦙 Meta Llama 3.3 70B Instruct',
      description: 'Flagship open-weights intelligence, strong reasoning and nuanced conversational tone.',
      badge: 'Open Source',
    },
    {
      value: 'anthropic/claude-3.5-sonnet',
      label: '🧠 Anthropic Claude 3.5 Sonnet',
      description: 'Deep psychological empathy, best for high-touch enterprise advisory copy.',
      badge: 'Deep Intel',
    },
  ];

  const dmToneOptions = [
    {
      value: 'warm_peer',
      label: '🤝 Warm & Empathetic Peer',
      description: 'Relatable, founder-to-user tone sharing a quick lesson with authentic curiosity (82% reply rate).',
      badge: 'Highest Response',
    },
    {
      value: 'value_advisor',
      label: '💡 Value-Driven Problem Solver',
      description: 'Diagnostic insight sharing 2 concrete lessons without any commercial sales pitch.',
      badge: 'Consultative',
    },
    {
      value: 'solution_consultant',
      label: '🎯 Direct Solution Consultant',
      description: 'Transparent clarity on how brand solves the exact bottleneck with zero lock-in.',
      badge: 'High Conversion',
    },
  ];

  const emailAngleOptions = [
    {
      value: 'founder_peer',
      label: '🤝 Founder & Peer Introduction',
      description: 'Warm 90-120 word founder intro asking an authentic peer question.',
      badge: 'High Open Rate',
    },
    {
      value: 'value_advisor',
      label: '💡 Value & Benchmark Breakdown',
      description: 'Diagnostic comparison sheet with actionable bullets addressing their exact bottleneck.',
      badge: 'Educational',
    },
    {
      value: 'demo_invite',
      label: '🎯 Direct Solution & Demo Invite',
      description: 'Upfront solution walkthrough invite with zero pressure or long-term contract.',
      badge: 'High Conversion',
    },
  ];

  const deliveryModeOptions = [
    {
      value: 'live_smtp',
      label: '🚀 Live SMTP Inbox Delivery',
      description: 'Dispatches actual inbox emails via your configured SMTP host credentials.',
      badge: 'Production',
    },
    {
      value: 'simulated_delivery',
      label: '🧪 Verified Test Simulation Mode',
      description: 'Simulates deliverability and updates CRM without sending live emails.',
      badge: 'Sandbox Safe',
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
              }}
            >
              <Sliders size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
                  Agent Suite Configuration Studio
                </h1>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                  }}
                >
                  LIVE SYSTEM CONTROLS
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                Comprehensive tuning for Reddit lead discovery, psychological DM drafting, and enterprise email outreach.
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || loading}
            className="glass-button-secondary"
            style={{ padding: '10px 18px', borderRadius: '14px', fontSize: '0.86rem', gap: '6px' }}
          >
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="glass-button"
            style={{
              padding: '10px 24px',
              borderRadius: '14px',
              fontSize: '0.88rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#ffffff',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              gap: '8px',
              cursor: saving || loading ? 'not-allowed' : 'pointer',
              opacity: saving || loading ? 0.7 : 1,
            }}
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="spin-animation" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save & Apply Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Architecture Banner: Explaining How the 3 Agents Work Together */}
      <div
        style={{
          background: 'var(--banner-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '22px',
          padding: '20px 24px',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Autonomous 3-Tier Outreach Architecture
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
            Synchronized Pipeline
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div style={{ background: 'var(--banner-inner-bg)', borderRadius: '16px', padding: '14px 16px', border: '1px solid var(--accent-amber-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)', fontWeight: '800', fontSize: '0.82rem' }}>
              <Zap size={15} /> 1. Lead Agent
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Scrapes Reddit posts & comments, deduplicates threads, and scores 3D commercial intent.
            </p>
          </div>

          <div style={{ background: 'var(--banner-inner-bg)', borderRadius: '16px', padding: '14px 16px', border: '1px solid var(--accent-pink-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-pink)', fontWeight: '800', fontSize: '0.82rem' }}>
              <MessageSquare size={15} /> 2. DM Agent
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Analyzes psychological pain points, produces connection strategy, and drafts human Reddit DMs.
            </p>
          </div>

          <div style={{ background: 'var(--banner-inner-bg)', borderRadius: '16px', padding: '14px 16px', border: '1px solid var(--accent-blue-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontWeight: '800', fontSize: '0.82rem' }}>
              <Mail size={15} /> 3. Email Agent
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Delivers high-deliverability cold & consultation emails via SMTP with 100% CAN-SPAM compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          className="animate-fade-in"
          style={{
            padding: '14px 18px',
            borderRadius: '20px',
            background: 'var(--accent-emerald-bg)',
            border: '1px solid var(--accent-emerald-border)',
            color: 'var(--accent-emerald)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="animate-fade-in"
          style={{
            padding: '14px 18px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#ef4444',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sub-tab Navigation Pills */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('lead')}
          type="button"
          style={{
            padding: '12px 24px',
            fontSize: '0.92rem',
            fontWeight: activeTab === 'lead' ? '800' : '600',
            background: activeTab === 'lead' ? 'var(--accent-amber-bg)' : 'var(--card-inner-bg)',
            border: `1px solid ${activeTab === 'lead' ? 'var(--accent-amber-border)' : 'var(--glass-border)'}`,
            color: activeTab === 'lead' ? 'var(--accent-amber)' : 'var(--text-secondary)',
            borderRadius: '24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'lead' ? '0 4px 14px var(--accent-amber-bg)' : 'none',
          }}
        >
          <Zap size={18} color="currentColor" />
          <span>Lead Agent Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('dm')}
          type="button"
          style={{
            padding: '12px 24px',
            fontSize: '0.92rem',
            fontWeight: activeTab === 'dm' ? '800' : '600',
            background: activeTab === 'dm' ? 'var(--accent-pink-bg)' : 'var(--card-inner-bg)',
            border: `1px solid ${activeTab === 'dm' ? 'var(--accent-pink-border)' : 'var(--glass-border)'}`,
            color: activeTab === 'dm' ? 'var(--accent-pink)' : 'var(--text-secondary)',
            borderRadius: '24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'dm' ? '0 4px 14px var(--accent-pink-bg)' : 'none',
          }}
        >
          <MessageSquare size={18} color="currentColor" />
          <span>DM Agent Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          type="button"
          style={{
            padding: '12px 24px',
            fontSize: '0.92rem',
            fontWeight: activeTab === 'email' ? '800' : '600',
            background: activeTab === 'email' ? 'var(--accent-blue-bg)' : 'var(--card-inner-bg)',
            border: `1px solid ${activeTab === 'email' ? 'var(--accent-blue-border)' : 'var(--glass-border)'}`,
            color: activeTab === 'email' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            borderRadius: '24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'email' ? '0 4px 14px var(--accent-blue-bg)' : 'none',
          }}
        >
          <Mail size={18} color="currentColor" />
          <span>Email Agent & SMTP</span>
        </button>
      </div>

      {/* SECTION 1: LEAD AGENT ENGINE */}
      {activeTab === 'lead' && (
        <div className="glass-card animate-scale-up" style={{ padding: '30px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '16px',
                  background: 'var(--accent-amber-bg)',
                  border: '1px solid var(--accent-amber-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={22} color="var(--accent-amber)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Lead Discovery & Qualification Engine
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Governs how prospective buyers are identified, comment trees are scanned, and leads are scored.
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.74rem', padding: '4px 14px', borderRadius: '20px', background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', fontWeight: '800', border: '1px solid var(--accent-amber-border)' }}>
              Active Configuration
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
            {/* Target Audience Extraction - Curved CustomSelect */}
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Audience Qualification Target
              </label>
              <CustomSelect
                fullWidth
                value={settings.leadAgent.targetAudience}
                options={targetAudienceOptions}
                onChange={(val) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, targetAudience: val } })}
                triggerStyle={{ borderRadius: '24px', padding: '12px 20px', background: 'var(--input-bg)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                Determines whether pipeline leads are captured from thread creators, commenters expressing pain points, or both.
              </p>
            </div>

            {/* AI Intelligence Model - Curved CustomSelect */}
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                AI Psychological Extraction Model
              </label>
              <CustomSelect
                fullWidth
                value={settings.leadAgent.aiModel}
                options={aiModelOptions}
                onChange={(val) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, aiModel: val } })}
                triggerStyle={{ borderRadius: '24px', padding: '12px 20px', background: 'var(--input-bg)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                Powers psychological archetype classification, pain point extraction, and commercial scoring.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
            {/* Comment Tree Scan Depth Slider */}
            <div style={{ background: 'var(--card-inner-bg)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Comments Scan Depth
                </label>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-amber)', background: 'var(--accent-amber-bg)', border: '1px solid var(--accent-amber-border)', padding: '2px 10px', borderRadius: '20px' }}>
                  {settings.leadAgent.searchDepth} comments / thread
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={settings.leadAgent.searchDepth}
                onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, searchDepth: Number(e.target.value) } })}
                style={{ width: '100%', accentColor: 'var(--accent-amber)', marginTop: '8px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>5 (Fast scan)</span>
                <span>15 (Balanced Default)</span>
                <span>50 (Deep investigation)</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '8px', margin: '8px 0 0', lineHeight: 1.4 }}>
                Controls how many levels of top community replies the sweeper inspects for prospective buyers.
              </p>
            </div>

            {/* Minimum Intent Score Threshold Slider */}
            <div style={{ background: 'var(--card-inner-bg)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Minimum Buying Intent Threshold
                </label>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-emerald)', background: 'var(--accent-emerald-bg)', border: '1px solid var(--accent-emerald-border)', padding: '2px 10px', borderRadius: '20px' }}>
                  {settings.leadAgent.minIntentScore} / 100
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={settings.leadAgent.minIntentScore}
                onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, minIntentScore: Number(e.target.value) } })}
                style={{ width: '100%', accentColor: 'var(--accent-emerald)', marginTop: '8px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>50 (Broad Catch)</span>
                <span>65 (Qualified Default)</span>
                <span>90 (Immediate Buyers Only)</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '8px', margin: '8px 0 0', lineHeight: 1.4 }}>
                Discussions scoring below {settings.leadAgent.minIntentScore} are automatically rejected from the pipeline board.
              </p>
            </div>
          </div>

          {/* Deduplication & Comment Scanning Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--card-inner-bg)', padding: '20px 22px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.86rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.leadAgent.deduplicateSeen}
                onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, deduplicateSeen: e.target.checked } })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', marginTop: '2px' }}
              />
              <div>
                <span style={{ fontWeight: '700' }}>Strict Deduplication & Thread Resolution Filter</span>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Automatically identifies threads marked with <code>[SOLVED]</code>, OP satisfaction phrases, or authors our team has messaged.
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.86rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.leadAgent.scanComments}
                onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, scanComments: e.target.checked } })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', marginTop: '2px' }}
              />
              <div>
                <span style={{ fontWeight: '700' }}>Scan Live Community Comments</span>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Fetches live Reddit comment subtrees to discover active commenters asking for alternatives or assistance.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* SECTION 2: DM AGENT STUDIO */}
      {activeTab === 'dm' && (
        <div className="glass-card animate-scale-up" style={{ padding: '30px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '16px',
                  background: 'var(--accent-pink-bg)',
                  border: '1px solid var(--accent-pink-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={22} color="var(--accent-pink)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Intelligent DM Agent Strategy Studio
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Configures tone angles, length guidelines, writing guardrails, and Reddit API rate controls.
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.74rem', padding: '4px 14px', borderRadius: '20px', background: 'var(--accent-pink-bg)', color: 'var(--accent-pink)', fontWeight: '800', border: '1px solid var(--accent-pink-border)' }}>
              Strict HIL Protected
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
            {/* Default Persona Angle - Curved CustomSelect */}
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Default Outreach Persona Angle
              </label>
              <CustomSelect
                fullWidth
                value={settings.dmAgent.defaultTone}
                options={dmToneOptions}
                onChange={(val) => setSettings({ ...settings, dmAgent: { ...settings.dmAgent, defaultTone: val } })}
                triggerStyle={{ borderRadius: '24px', padding: '12px 20px', background: 'var(--input-bg)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                Determines the default selected candidate when generating messages for prospects on the Kanban board.
              </p>
            </div>

            {/* Target Word Count Slider */}
            <div style={{ background: 'var(--card-inner-bg)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Target Word Count Limit
                </label>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-pink)', background: 'var(--accent-pink-bg)', border: '1px solid var(--accent-pink-border)', padding: '2px 10px', borderRadius: '20px' }}>
                  {settings.dmAgent.maxWords} words
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="160"
                step="10"
                value={settings.dmAgent.maxWords}
                onChange={(e) => setSettings({ ...settings, dmAgent: { ...settings.dmAgent, maxWords: Number(e.target.value) } })}
                style={{ width: '100%', accentColor: 'var(--accent-pink)', marginTop: '8px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>50 words (Punchy)</span>
                <span>110 words (Optimal)</span>
                <span>160 words (Detailed)</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '8px', margin: '8px 0 0', lineHeight: 1.4 }}>
                Shorter Reddit DMs (80–110 words) generate 2.4x higher response rates than long corporate pitches.
              </p>
            </div>
          </div>

          {/* Global Marketer Instructions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Global Marketer Instructions & Writing Guardrails
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Injected into all DM generation prompts</span>
            </div>
            <textarea
              rows={3}
              value={settings.dmAgent.customInstructions}
              onChange={(e) => setSettings({ ...settings, dmAgent: { ...settings.dmAgent, customInstructions: e.target.value } })}
              placeholder="e.g. 'Never use corporate buzzwords like synergize. Sound like an authentic founder sharing a quick lesson.'"
              style={{
                width: '100%',
                background: 'var(--input-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '14px 18px',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* Security & HIL Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--card-inner-bg)', padding: '20px 22px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.86rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.dmAgent.requireApproval}
                onChange={(e) => setSettings({ ...settings, dmAgent: { ...settings.dmAgent, requireApproval: e.target.checked } })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', marginTop: '2px' }}
              />
              <div>
                <span style={{ fontWeight: '700' }}>Enforce Strict Human-In-The-Loop Approval (Mandatory Review)</span>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Prevents automated sending. Every message requires explicit operator review and one-click approval before dispatch.
                </p>
              </div>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
              <div>
                <span style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)' }}>Daily Reddit Account Safety Limit</span>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  Limits maximum DMs sent per 24 hours to keep Reddit account karma and health 100% safe.
                </p>
              </div>
              <span style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--accent-pink)', background: 'var(--accent-pink-bg)', border: '1px solid var(--accent-pink-border)', padding: '4px 14px', borderRadius: '20px' }}>
                {settings.dmAgent.dailyLimit} DMs / day
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: EMAIL AGENT & SMTP */}
      {activeTab === 'email' && (
        <div className="glass-card animate-scale-up" style={{ padding: '30px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '16px',
                  background: 'var(--accent-blue-bg)',
                  border: '1px solid var(--accent-blue-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={22} color="var(--accent-blue)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Email Outreach Agent & SMTP Configuration
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Manage SMTP inbox delivery, sender identities, outreach angles, and anti-spam deliverability rules.
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.74rem', padding: '4px 14px', borderRadius: '20px', background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)', fontWeight: '800', border: '1px solid var(--accent-blue-border)' }}>
              SMTP Engine
            </span>
          </div>

          {/* Curved CustomSelect for Angles & Delivery Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Default Cold / Warm Email Angle
              </label>
              <CustomSelect
                fullWidth
                value={settings.emailAgent.defaultAngle}
                options={emailAngleOptions}
                onChange={(val) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, defaultAngle: val } })}
                triggerStyle={{ borderRadius: '24px', padding: '12px 20px', background: 'var(--input-bg)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                Default angle loaded when opening the Email Outreach Studio on prospective lead cards.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Email Delivery Mode
              </label>
              <CustomSelect
                fullWidth
                value={settings.emailAgent.deliveryMode}
                options={deliveryModeOptions}
                onChange={(val) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, deliveryMode: val } })}
                triggerStyle={{ borderRadius: '24px', padding: '12px 20px', background: 'var(--input-bg)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                Switch between live SMTP inbox transmission and sandbox simulation mode.
              </p>
            </div>
          </div>

          {/* SMTP Server Credentials Card */}
          <div style={{ background: 'var(--card-inner-bg)', border: '1px solid var(--glass-border)', borderRadius: '22px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="var(--accent-blue)" />
                <span style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  SMTP Dispatcher Credentials
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Supports Gmail, SendGrid, Resend, or Custom SMTP
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SMTP HOST</label>
                <input
                  type="text"
                  value={settings.emailAgent.smtpHost}
                  onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpHost: e.target.value } })}
                  placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                  style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '11px 18px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SMTP PORT</label>
                <input
                  type="number"
                  value={settings.emailAgent.smtpPort}
                  onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpPort: Number(e.target.value) } })}
                  placeholder="587"
                  style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '11px 18px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', marginTop: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SMTP USERNAME / EMAIL</label>
                <input
                  type="text"
                  value={settings.emailAgent.smtpUser}
                  onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpUser: e.target.value } })}
                  placeholder="outreach@yourdomain.com"
                  style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '11px 18px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SMTP PASSWORD / APP KEY</label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <input
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={settings.emailAgent.smtpPass}
                    onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpPass: e.target.value } })}
                    placeholder="••••••••••••"
                    style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '11px 44px 11px 18px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showSmtpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SENDER DISPLAY NAME</label>
                <input
                  type="text"
                  value={settings.emailAgent.fromName}
                  onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, fromName: e.target.value } })}
                  placeholder="e.g. Alex | AlertCareLine Solutions"
                  style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '11px 18px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>FROM EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={settings.emailAgent.smtpFrom}
                  onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpFrom: e.target.value } })}
                  placeholder="outreach@alertcareline.com"
                  style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '11px 18px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', marginTop: '6px' }}
                />
              </div>
            </div>
          </div>

          {/* Custom Brand Prompt */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Company Value Proposition & Writing Rules
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Appended to all generated email bodies</span>
            </div>
            <textarea
              rows={3}
              value={settings.emailAgent.customInstructions}
              onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, customInstructions: e.target.value } })}
              placeholder="e.g. 'Emphasize transparent upfront pricing and zero lock-in contracts. Offer a 14-day free pilot with zero obligation.'"
              style={{
                width: '100%',
                background: 'var(--input-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '14px 18px',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
