import React, { useState, useEffect } from 'react';
import {
  X, Sliders, Zap, MessageSquare, Mail, Save, RotateCcw,
  ShieldCheck, Check, AlertCircle, Sparkles, Server, Lock, Cpu, Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const AgentSettingsModal = ({
  isOpen,
  onClose,
  initialTab = 'lead', // 'lead' | 'dm' | 'email'
  onSettingsSaved = null,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
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
    if (isOpen) {
      setActiveTab(initialTab || 'lead');
      setSuccessMessage('');
      setErrorMessage('');
      fetchSettings();
    }
  }, [isOpen, initialTab]);

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
        setSuccessMessage('Agent configuration saved! Settings are now actively impacting all agent executions.');
        if (onSettingsSaved) {
          onSettingsSaved(res.data.settings);
        }
        setTimeout(() => setSuccessMessage(''), 3500);
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.84)',
        backdropFilter: 'blur(12px)',
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
          maxWidth: '780px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '24px',
          padding: '28px',
          border: '1px solid var(--glass-border-hover)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Sliders size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  Agent Suite Control & Configuration
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
                  LIVE PARAMETERS
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Adjust behavioral heuristics, scraping depths, prompt rules, and delivery channels.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-button"
            style={{ borderRadius: '12px', padding: '8px', background: 'var(--card-inner-bg)' }}
            aria-label="Close Agent Settings modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3 Dedicated Agent Tab Selectors */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('lead')}
            className="glass-button"
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'lead' ? '800' : '600',
              background: activeTab === 'lead' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%)' : 'var(--card-inner-bg)',
              borderColor: activeTab === 'lead' ? '#f59e0b' : 'var(--glass-border)',
              color: activeTab === 'lead' ? '#fbbf24' : 'var(--text-secondary)',
              borderRadius: '12px',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Zap size={16} color={activeTab === 'lead' ? '#fbbf24' : 'currentColor'} />
            <span>Lead Agent Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('dm')}
            className="glass-button"
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'dm' ? '800' : '600',
              background: activeTab === 'dm' ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(244, 63, 94, 0.3) 100%)' : 'var(--card-inner-bg)',
              borderColor: activeTab === 'dm' ? '#ec4899' : 'var(--glass-border)',
              color: activeTab === 'dm' ? '#f472b6' : 'var(--text-secondary)',
              borderRadius: '12px',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <MessageSquare size={16} color={activeTab === 'dm' ? '#f472b6' : 'currentColor'} />
            <span>DM Agent Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className="glass-button"
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'email' ? '800' : '600',
              background: activeTab === 'email' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)' : 'var(--card-inner-bg)',
              borderColor: activeTab === 'email' ? '#3b82f6' : 'var(--glass-border)',
              color: activeTab === 'email' ? '#60a5fa' : 'var(--text-secondary)',
              borderRadius: '12px',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Mail size={16} color={activeTab === 'email' ? '#60a5fa' : 'currentColor'} />
            <span>Email Agent Settings</span>
          </button>
        </div>

        {/* TAB 1: LEAD AGENT SETTINGS */}
        {activeTab === 'lead' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '14px', padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              ⚡ <strong>Lead Agent Engine Controls:</strong> Dictates comment tree analysis depth, minimum commercial buying intent score, and audience targeting rules.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Target Audience Extraction */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Audience Qualification Target
                </label>
                <select
                  value={settings.leadAgent.targetAudience}
                  onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, targetAudience: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="both" style={{ background: '#111827' }}>👥 Both Post Authors & Commenters</option>
                  <option value="authors" style={{ background: '#111827' }}>📝 Post Authors Only (Original Posters)</option>
                  <option value="commenters" style={{ background: '#111827' }}>💬 Thread Commenters Only</option>
                </select>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Determines who is analyzed and populated onto your pipeline Kanban board.
                </p>
              </div>

              {/* Comment Tree Scan Depth */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Comments Scan Depth: {settings.leadAgent.searchDepth} comments/post
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={settings.leadAgent.searchDepth}
                  onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, searchDepth: Number(e.target.value) } })}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <span>5 (Fast)</span>
                  <span>15 (Recommended)</span>
                  <span>50 (Deep scan)</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Minimum Intent Score Threshold */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Minimum Intent Score Threshold: {settings.leadAgent.minIntentScore}/100
                </label>
                <input
                  type="range"
                  min="50"
                  max="90"
                  step="5"
                  value={settings.leadAgent.minIntentScore}
                  onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, minIntentScore: Number(e.target.value) } })}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Posts or commenters scoring below {settings.leadAgent.minIntentScore} will be filtered out to eliminate non-commercial noise.
                </p>
              </div>

              {/* AI Extraction Model */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  AI Intelligence & Extraction Model
                </label>
                <select
                  value={settings.leadAgent.aiModel}
                  onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, aiModel: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="google/gemini-2.0-flash-001" style={{ background: '#111827' }}>⚡ Google Gemini 2.0 Flash (Fastest & Rich)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct" style={{ background: '#111827' }}>🦙 Meta Llama 3.3 70B Instruct</option>
                  <option value="anthropic/claude-3.5-sonnet" style={{ background: '#111827' }}>🧠 Anthropic Claude 3.5 Sonnet</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--card-inner-bg)', padding: '14px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.leadAgent.deduplicateSeen}
                  onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, deduplicateSeen: e.target.checked } })}
                  style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                />
                <span><strong>Strict Deduplication:</strong> Skip threads that are already answered or contacts our team already messaged.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.leadAgent.scanComments}
                  onChange={(e) => setSettings({ ...settings, leadAgent: { ...settings.leadAgent, scanComments: e.target.checked } })}
                  style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                />
                <span><strong>Scan Live Comments:</strong> Fetch and analyze user replies in the Reddit comment tree for prospective buyers.</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: DM AGENT SETTINGS */}
        {activeTab === 'dm' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.25)', borderRadius: '14px', padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              💬 <strong>DM Agent Strategy Controls:</strong> Customize tone personas, word limits, prompt guardrails, and Reddit API delivery options.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Default Tone Angle */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Default DM Persona / Tone
                </label>
                <select
                  value={settings.dmAgent.defaultTone}
                  onChange={(e) => setSettings({ ...settings, dmAgent: { ...settings.dmAgent, defaultTone: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="warm_peer" style={{ background: '#111827' }}>🤝 Warm & Empathetic Peer (Relatable, high response)</option>
                  <option value="value_advisor" style={{ background: '#111827' }}>💡 Value-Driven Problem Solver (Diagnostic insight)</option>
                  <option value="solution_consultant" style={{ background: '#111827' }}>🎯 Direct Solution Consultant (Upfront & crisp)</option>
                </select>
              </div>

              {/* Max Words Limit */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Target Word Count Limit: {settings.dmAgent.maxWords} words
                </label>
                <input
                  type="range"
                  min="50"
                  max="160"
                  step="10"
                  value={settings.dmAgent.maxWords}
                  onChange={(e) => setSettings({ ...settings, dmAgent: { ...settings.dmAgent, maxWords: Number(e.target.value) } })}
                  style={{ width: '100%', accentColor: '#ec4899' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <span>50 (Short & punchy)</span>
                  <span>100 (Optimal Reddit DM)</span>
                  <span>160 (Detailed)</span>
                </div>
              </div>
            </div>

            {/* Custom Instructions / System Prompt Injector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Global Marketer Instructions / Writing Guardrails
              </label>
              <textarea
                rows={3}
                value={settings.dmAgent.customInstructions}
                onChange={(e) => setSettings({ ...settings, dmAgent: { ...settings.dmAgent, customInstructions: e.target.value } })}
                placeholder="e.g. 'Never use corporate buzzwords like synergize. Sound like an indie hacker founder sharing a quick lesson.'"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                These instructions are injected directly into every DM generation prompt across the workspace.
              </p>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--card-inner-bg)', padding: '14px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.dmAgent.requireApproval}
                  onChange={(e) => setSettings({ ...settings, dmAgent: { ...settings.dmAgent, requireApproval: e.target.checked } })}
                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                />
                <span><strong>Enforce Strict Human-In-The-Loop:</strong> Never send a Reddit DM without user manual click approval.</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Daily Reddit DM Safety Limit:</span>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#f472b6' }}>{settings.dmAgent.dailyLimit} DMs / day (Keeps account 100% safe)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMAIL AGENT SETTINGS */}
        {activeTab === 'email' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '14px', padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              📧 <strong>Email Outreach Agent Controls:</strong> Configure your SMTP server credentials, sender name, default outreach angle, and strict HIL parameters.
            </div>

            {/* SMTP Server Settings */}
            <div style={{ background: 'var(--card-inner-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Server size={18} color="#60a5fa" />
                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  SMTP Dispatcher Credentials
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SMTP HOST</label>
                  <input
                    type="text"
                    value={settings.emailAgent.smtpHost}
                    onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpHost: e.target.value } })}
                    placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SMTP PORT</label>
                  <input
                    type="number"
                    value={settings.emailAgent.smtpPort}
                    onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpPort: Number(e.target.value) } })}
                    placeholder="587"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SMTP USERNAME / EMAIL</label>
                  <input
                    type="text"
                    value={settings.emailAgent.smtpUser}
                    onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpUser: e.target.value } })}
                    placeholder="outreach@yourdomain.com"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SMTP PASSWORD / APP KEY</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={settings.emailAgent.smtpPass}
                      onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpPass: e.target.value } })}
                      placeholder="••••••••••••"
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 36px 8px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showSmtpPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>SENDER DISPLAY NAME</label>
                  <input
                    type="text"
                    value={settings.emailAgent.fromName}
                    onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, fromName: e.target.value } })}
                    placeholder="e.g. Alex | PulseRed Outreach"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>FROM EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={settings.emailAgent.smtpFrom}
                    onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, smtpFrom: e.target.value } })}
                    placeholder="outreach@yourdomain.com"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Email Angles & Strategy */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Default Email Outreach Angle
                </label>
                <select
                  value={settings.emailAgent.defaultAngle}
                  onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, defaultAngle: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="founder_peer" style={{ background: '#111827' }}>🤝 Founder & Peer Introduction (Warm, relatable)</option>
                  <option value="value_advisor" style={{ background: '#111827' }}>💡 Value & Benchmark Breakdown (Concrete bullet points)</option>
                  <option value="demo_invite" style={{ background: '#111827' }}>🎯 Direct Solution & Demo Invite (Transparent problem-solver)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Delivery Mode
                </label>
                <select
                  value={settings.emailAgent.deliveryMode}
                  onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, deliveryMode: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="live_smtp" style={{ background: '#111827' }}>🚀 Live SMTP Inbox Delivery</option>
                  <option value="simulated_delivery" style={{ background: '#111827' }}>🧪 Verified Test Simulation Mode</option>
                </select>
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Brand Value Proposition & Email Prompt Rules
              </label>
              <textarea
                rows={3}
                value={settings.emailAgent.customInstructions}
                onChange={(e) => setSettings({ ...settings, emailAgent: { ...settings.emailAgent, customInstructions: e.target.value } })}
                placeholder="e.g. 'Highlight our 14-day free pilot and zero setup fees. Do not make exaggerated marketing promises.'"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34d399', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', gap: '12px' }}>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || loading}
            className="glass-button-secondary"
            style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '0.82rem', gap: '6px' }}
          >
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="glass-button-secondary"
              style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="glass-button"
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
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
              <Save size={16} />
              <span>{saving ? 'Saving Settings...' : 'Save & Apply Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
