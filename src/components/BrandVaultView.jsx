import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Edit3, X, Sparkles, ExternalLink, ShieldAlert, Sliders, Zap, Tag, Check, RefreshCw, Search } from 'lucide-react';
import axios from 'axios';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const BrandVaultView = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null); // null or domain object being edited
  const [deleteTarget, setDeleteTarget] = useState(null); // null or { id, name }
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State (for both Add and Edit)
  const [formDomainUrl, setFormDomainUrl] = useState('');
  const [formBrandName, setFormBrandName] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formOfferDescription, setFormOfferDescription] = useState('');
  
  // Array Tag States (Editable lists with add/remove)
  const [formTargetKeywords, setFormTargetKeywords] = useState([]);
  const [formTargetSubreddits, setFormTargetSubreddits] = useState([]);
  const [formNegativeKeywords, setFormNegativeKeywords] = useState([]);
  const [formWritingRules, setFormWritingRules] = useState([]);

  // Inline Tag Input States
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newSubredditInput, setNewSubredditInput] = useState('');
  const [newNegativeInput, setNewNegativeInput] = useState('');
  const [newRuleInput, setNewRuleInput] = useState('');

  // AI Generator Loading State & Confidence Gauge
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(null);
  const [saving, setSaving] = useState(false);

  // 1-Click Brand Sweep State
  const [sweepingBrandId, setSweepingBrandId] = useState(null);
  const [sweepNotice, setSweepNotice] = useState(null);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pulsered_token');
      const res = await axios.get(`${API_BASE_URL}/brand-domains`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomains(res.data?.domains || []);
    } catch (err) {
      console.error('Failed to fetch brand domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const openAddModal = () => {
    setEditingDomain(null);
    setFormDomainUrl('AlertCareLine.com');
    setFormBrandName('Alert Care Line');
    setFormSpecialization('Automated Home Security & Camera Emergency Alerts');
    setFormOfferDescription('24/7 AI-monitored wireless security camera alerts with real-time homeowner phone notifications and instant emergency dispatch.');
    setFormTargetKeywords([
      'affordable security cameras homeowners',
      'home security system compare',
      'wireless doorbell',
      'adt alternatives',
      'best security system for my home'
    ]);
    setFormTargetSubreddits(['homesecurity', 'homeautomation', 'SaaS', 'RealEstate']);
    setFormNegativeKeywords(['hiring', 'job', 'career', 'free', 'DIY scam']);
    setFormWritingRules(['Tone: Empathetic & reassure safety', 'Keep DMs under 40 words', 'No pushy sales pitch']);
    setAiConfidence(null);
    setShowAddModal(true);
  };

  const openEditModal = (d) => {
    setEditingDomain(d);
    setFormDomainUrl(d.domainUrl || '');
    setFormBrandName(d.brandName || '');
    setFormSpecialization(d.specialization || '');
    setFormOfferDescription(d.specialization || '');
    
    // Parse targetKeywords
    const kwArr = Array.isArray(d.targetKeywords) 
      ? d.targetKeywords 
      : (d.targetKeywords ? d.targetKeywords.split(',').map(s => s.trim()).filter(Boolean) : []);
    setFormTargetKeywords(kwArr);

    // Parse targetSubreddits
    const subArr = Array.isArray(d.targetSubreddits) 
      ? d.targetSubreddits 
      : (d.targetSubreddits ? d.targetSubreddits.split(',').map(s => s.trim()).filter(Boolean) : []);
    setFormTargetSubreddits(subArr);

    // Parse negativeKeywords
    const negArr = Array.isArray(d.negativeKeywords)
      ? d.negativeKeywords
      : (d.negativeKeywords ? d.negativeKeywords.split(',').map(s => s.trim()).filter(Boolean) : ['hiring', 'job', 'free', 'scam']);
    setFormNegativeKeywords(negArr);

    // Parse writingRules
    const rulesArr = Array.isArray(d.writingRules)
      ? d.writingRules
      : (d.writingRules ? d.writingRules.split(',').map(s => s.trim()).filter(Boolean) : ['Tone: Founder-to-founder']);
    setFormWritingRules(rulesArr);

    setAiConfidence(d.confidenceScore || 90);
    setShowAddModal(true);
  };

  // Tag Pill Handlers
  const handleAddKeyword = () => {
    if (!newKeywordInput.trim()) return;
    const cleanKw = newKeywordInput.trim();
    if (!formTargetKeywords.includes(cleanKw)) {
      setFormTargetKeywords([...formTargetKeywords, cleanKw]);
    }
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove) => {
    setFormTargetKeywords(formTargetKeywords.filter(k => k !== kwToRemove));
  };

  const handleAddSubreddit = () => {
    if (!newSubredditInput.trim()) return;
    const cleanSub = newSubredditInput.trim().replace(/^r\//i, '');
    if (!formTargetSubreddits.includes(cleanSub)) {
      setFormTargetSubreddits([...formTargetSubreddits, cleanSub]);
    }
    setNewSubredditInput('');
  };

  const handleRemoveSubreddit = (subToRemove) => {
    setFormTargetSubreddits(formTargetSubreddits.filter(s => s !== subToRemove));
  };

  const handleAddNegative = () => {
    if (!newNegativeInput.trim()) return;
    const cleanNeg = newNegativeInput.trim().replace(/^-/, '');
    if (!formNegativeKeywords.includes(cleanNeg)) {
      setFormNegativeKeywords([...formNegativeKeywords, cleanNeg]);
    }
    setNewNegativeInput('');
  };

  const handleRemoveNegative = (negToRemove) => {
    setFormNegativeKeywords(formNegativeKeywords.filter(n => n !== negToRemove));
  };

  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    const cleanRule = newRuleInput.trim();
    if (!formWritingRules.includes(cleanRule)) {
      setFormWritingRules([...formWritingRules, cleanRule]);
    }
    setNewRuleInput('');
  };

  const handleRemoveRule = (ruleToRemove) => {
    setFormWritingRules(formWritingRules.filter(r => r !== ruleToRemove));
  };

  // Trigger AI Strategy Auto-Generator
  const handleAutoGenerateAiStrategy = async () => {
    if (!formBrandName && !formSpecialization && !formOfferDescription) {
      alert('Please fill in Brand Name or Offer Description first so AI can analyze target buyers.');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const token = localStorage.getItem('pulsered_token');
      const res = await axios.post(`${API_BASE_URL}/brand-domains/generate-blueprint`, {
        onboardingPathway: 'pitch_brief',
        domainUrl: formDomainUrl,
        brandName: formBrandName,
        pitchBrief: `${formBrandName} - ${formSpecialization}. ${formOfferDescription}`,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const blueprint = res.data?.blueprint;
      if (blueprint) {
        if (blueprint.targetKeywords && blueprint.targetKeywords.length > 0) {
          setFormTargetKeywords(blueprint.targetKeywords);
        }
        if (blueprint.targetSubreddits && blueprint.targetSubreddits.length > 0) {
          setFormTargetSubreddits(blueprint.targetSubreddits);
        }
        if (blueprint.negativeKeywords && blueprint.negativeKeywords.length > 0) {
          setFormNegativeKeywords(blueprint.negativeKeywords);
        }
        if (blueprint.buyingIntentTriggers && blueprint.buyingIntentTriggers.length > 0) {
          setFormWritingRules([
            `Tone: Empathetic Helpful Expert`,
            `Keep DMs under 40 words`,
            `Focus on buyer triggers: ${blueprint.buyingIntentTriggers[0]}`
          ]);
        }
        setAiConfidence(blueprint.confidenceScore || 94);
      }
    } catch (err) {
      console.error('Failed to auto-generate AI strategy:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveDomain = async (e) => {
    e.preventDefault();
    if (!formBrandName || (!formSpecialization && !formOfferDescription)) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('pulsered_token');
      const payload = {
        domainUrl: formDomainUrl || 'Custom Profile',
        brandName: formBrandName,
        specialization: formOfferDescription || formSpecialization,
        targetSubreddits: formTargetSubreddits,
        targetKeywords: formTargetKeywords,
        negativeKeywords: formNegativeKeywords,
        writingRules: formWritingRules,
        confidenceScore: aiConfidence || 92,
      };

      if (editingDomain) {
        // UPDATE (PUT)
        const id = editingDomain._id || editingDomain.id;
        await axios.put(`${API_BASE_URL}/brand-domains/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // CREATE (POST)
        await axios.post(`${API_BASE_URL}/brand-domains`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowAddModal(false);
      setEditingDomain(null);
      fetchDomains();
    } catch (err) {
      console.error('Failed to save brand domain:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDomain = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('pulsered_token');
      await axios.delete(`${API_BASE_URL}/brand-domains/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      fetchDomains();
    } catch (err) {
      console.error('Failed to delete domain:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSweepBrand = async (brandObj) => {
    const brandId = brandObj._id || brandObj.id;
    setSweepingBrandId(brandId);
    setSweepNotice(null);
    try {
      const token = localStorage.getItem('pulsered_token');
      const res = await axios.post(`${API_BASE_URL}/agent/brand-sweep/${brandId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = res.data?.sweepResult;
      setSweepNotice({
        type: 'success',
        message: `⚡ Brand Sweep complete for "${brandObj.brandName || brandObj.domainUrl}"! Scanned target subreddits & added ${result?.totalLeadsAdded || 0} qualified leads with 360° Prospect Behavioral Audits to Lead Board.`,
      });
    } catch (err) {
      console.error('Failed to run brand sweep:', err);
      setSweepNotice({
        type: 'error',
        message: `Sweep notice for ${brandObj.brandName}: ${err.response?.data?.error || err.message}`,
      });
    } finally {
      setSweepingBrandId(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Sweep Result Banner */}
      {sweepNotice && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '16px',
            marginBottom: '20px',
            background: sweepNotice.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: sweepNotice.type === 'success' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            color: sweepNotice.type === 'success' ? '#4ade80' : '#f87171',
            fontSize: '0.88rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={18} /> {sweepNotice.message}
          </div>
          <button onClick={() => setSweepNotice(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Executive Header Banner */}
      <div className="glass-card" style={{ padding: '24px 28px', borderRadius: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <Globe size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Brand Portfolio Vault
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-primary)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span className="status-dot status-dot-active" />
                  {domains.length} Active {domains.length === 1 ? 'Domain' : 'Domains'}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '3px' }}>
                Configure multi-domain URLs, product value propositions, target subreddits, and AI voice personas.
              </p>
            </div>
          </div>

          <button onClick={openAddModal} className="glass-button" style={{ padding: '11px 22px' }}>
            <Plus size={18} /> Register New Brand
          </button>
        </div>
      </div>

      {/* Brand Portfolio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px auto', width: '36px', height: '36px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading Brand Vault Portfolio...
          </div>
        ) : domains.length === 0 ? (
          <div
            className="glass-card"
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 24px',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                marginBottom: '16px',
              }}
            >
              <Globe size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              No Brand Domains Registered
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '440px', marginTop: '6px', marginBottom: '20px', lineHeight: 1.5 }}>
              Register your first product or company domain to enable 3D intent scoring and auto-matching across Reddit discussions.
            </p>
            <button onClick={openAddModal} className="glass-button">
              <Plus size={18} /> Register Your First Brand
            </button>
          </div>
        ) : (
          domains.map((d) => {
            const domainId = d._id || d.id;
            const initial = (d.brandName || d.domainUrl || 'B').charAt(0).toUpperCase();

            return (
              <div
                key={domainId}
                className="glass-card animate-fade-in"
                style={{
                  padding: '24px',
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div>
                  {/* Card Top Bar */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          fontWeight: '800',
                          color: 'var(--text-primary)',
                          flexShrink: 0,
                        }}
                      >
                        {initial}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                          {d.brandName}
                        </h3>
                        <a
                          href={`https://${d.domainUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            color: 'var(--accent-primary)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '2px',
                          }}
                        >
                          {d.domainUrl} <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>

                    {d.isDefault && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#4ade80',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Primary
                      </span>
                    )}
                  </div>

                  {/* Specialization Inset Card */}
                  <div
                    style={{
                      background: 'var(--card-inner-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      marginBottom: '16px',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                      Specialization & ICP Fit
                    </span>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {d.specialization}
                    </p>
                  </div>

                  {/* Target Keywords */}
                  {d.targetKeywords && d.targetKeywords.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '6px' }}>
                        Target High-Intent Keywords ({d.targetKeywords.length})
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {d.targetKeywords.map((kw, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '600',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              background: 'rgba(52, 211, 153, 0.12)',
                              color: '#34d399',
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                            }}
                          >
                            🔍 {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Subreddits */}
                  {d.targetSubreddits && d.targetSubreddits.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '6px' }}>
                        Target Subreddits
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {d.targetSubreddits.map((sub, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.73rem',
                              fontWeight: '600',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#a5b4fc',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                            }}
                          >
                            r/{sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voice Rules */}
                  {d.writingRules && d.writingRules.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '6px' }}>
                        AI Voice Persona
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {d.writingRules.map((rule, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.73rem',
                              fontWeight: '600',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            {rule}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    onClick={() => handleSweepBrand(d)}
                    disabled={sweepingBrandId === domainId}
                    className="glass-button"
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                    }}
                  >
                    {sweepingBrandId === domainId ? (
                      <>
                        <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Sweeping Subreddits & Auditing...
                      </>
                    ) : (
                      <>
                        <Zap size={15} color="#fbbf24" /> ⚡ Sweep Brand & Extract Leads
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => openEditModal(d)}
                      className="glass-button-secondary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                    >
                      <Edit3 size={14} color="#fbbf24" /> Edit Brand
                    </button>

                    <button
                      onClick={() => handleDeleteDomain(domainId, d.brandName)}
                      className="glass-button-secondary"
                      style={{ padding: '8px 12px', color: '#f87171' }}
                      title="Delete Brand Domain"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Brand Modal Overlay */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--modal-overlay)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '740px',
              maxHeight: '88vh',
              padding: '24px 28px',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15)',
              background: 'var(--card-inner-bg-solid, #0f172a)',
              border: '1px solid var(--glass-border-hover)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed at Top) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.18)', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                  {editingDomain ? <Edit3 size={22} /> : <Sparkles size={22} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {editingDomain ? 'Edit Brand Portfolio Item' : 'Register New Brand Domain'}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {editingDomain ? 'Update product offer, keywords, and subreddits' : 'Configure domain details for automated buyer discovery'}
                  </p>
                </div>
              </div>

              <button onClick={() => setShowAddModal(false)} className="glass-button-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Scrollable Area */}
            <form onSubmit={handleSaveDomain} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingRight: '4px', gap: '16px' }}>
              <div className="form-grid-2">
                <div>
                  <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Brand / Product Name *
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Alert Care Line"
                    value={formBrandName}
                    onChange={(e) => setFormBrandName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Domain / Website URL
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. AlertCareLine.com"
                    value={formDomainUrl}
                    onChange={(e) => setFormDomainUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Industry Specialization & Category
                </label>
                <input
                  type="text"
                  className="glass-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Home Security, SaaS Automation, DevTools, E-Commerce"
                  value={formSpecialization}
                  onChange={(e) => setFormSpecialization(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Product Offer & Value Proposition (Describe What You Offer)
                </label>
                <textarea
                  className="glass-input"
                  style={{ width: '100%', height: '58px', resize: 'none', lineHeight: 1.4, fontSize: '0.83rem' }}
                  placeholder="Explain what your product offers, key features, and buyer benefits so AI can auto-discover buyer intent keywords..."
                  value={formOfferDescription}
                  onChange={(e) => setFormOfferDescription(e.target.value)}
                />
              </div>

              {/* AI Strategy Generator Trigger Box */}
              <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', border: '1px solid rgba(99, 102, 241, 0.35)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.83rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#fbbf24" /> AI Keyword & Subreddit Auto-Discovery
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Extract search keywords, target subreddits, negative filters, and voice rules from your offer.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {aiConfidence && (
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      ⚡ {aiConfidence}% AI Fit
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleAutoGenerateAiStrategy}
                    disabled={isGeneratingAi}
                    className="glass-button"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', padding: '8px 16px', fontSize: '0.8rem', fontWeight: '800', borderRadius: '10px' }}
                  >
                    {isGeneratingAi ? (
                      <>
                        <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Analyzing Offer...
                      </>
                    ) : (
                      <>
                        <Zap size={14} color="#fbbf24" /> ✨ Auto-Generate AI Strategy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tag Editors Grid (2-Column Responsive Layout) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '12px' }}>
                {/* Tag Editor 1: Target Keywords */}
                <div style={{ background: 'var(--card-inner-bg)', padding: '14px 16px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Search size={14} /> Buyer Intent Keywords ({formTargetKeywords.length})
                    </label>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Click (x) to remove</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', maxHeight: '100px', overflowY: 'auto' }}>
                    {formTargetKeywords.map((kw) => (
                      <span
                        key={kw}
                        style={{
                          fontSize: '0.73rem',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#0284c7',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {kw}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveKeyword(kw)} />
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="glass-input"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '0.78rem', borderRadius: '12px' }}
                      placeholder="+ Add keyword..."
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="glass-button-secondary"
                      style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Tag Editor 2: Target Subreddits */}
                <div style={{ background: 'var(--card-inner-bg)', padding: '14px 16px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders size={14} /> Subreddit Communities ({formTargetSubreddits.length})
                    </label>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Click (x) to remove</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', maxHeight: '100px', overflowY: 'auto' }}>
                    {formTargetSubreddits.map((sub) => (
                      <span
                        key={sub}
                        style={{
                          fontSize: '0.73rem',
                          background: 'var(--accent-amber-bg)',
                          color: 'var(--accent-amber)',
                          border: '1px solid var(--accent-amber-border)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        r/{sub}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSubreddit(sub)} />
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="glass-input"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '0.78rem', borderRadius: '12px' }}
                      placeholder="+ Add subreddit..."
                      value={newSubredditInput}
                      onChange={(e) => setNewSubredditInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubreddit(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubreddit}
                      className="glass-button-secondary"
                      style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Tag Editor 3: Negative Noise Filters */}
                <div style={{ background: 'var(--card-inner-bg)', padding: '14px 16px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} /> Excluded Noise Terms ({formNegativeKeywords.length})
                    </label>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Filters out jobs/scams</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', maxHeight: '100px', overflowY: 'auto' }}>
                    {formNegativeKeywords.map((neg) => (
                      <span
                        key={neg}
                        style={{
                          fontSize: '0.73rem',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        -{neg}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveNegative(neg)} />
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="glass-input"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '0.78rem', borderRadius: '12px' }}
                      placeholder="+ Add negative term..."
                      value={newNegativeInput}
                      onChange={(e) => setNewNegativeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNegative(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddNegative}
                      className="glass-button-secondary"
                      style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Tag Editor 4: AI Voice Guidelines */}
                <div style={{ background: 'var(--card-inner-bg)', padding: '14px 16px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={14} /> AI Voice Persona & Tone ({formWritingRules.length})
                    </label>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Click (x) to remove</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', maxHeight: '100px', overflowY: 'auto' }}>
                    {formWritingRules.map((rule) => (
                      <span
                        key={rule}
                        style={{
                          fontSize: '0.73rem',
                          background: 'rgba(167, 139, 250, 0.15)',
                          color: '#c4b5fd',
                          border: '1px solid rgba(167, 139, 250, 0.3)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {rule}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveRule(rule)} />
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="glass-input"
                      style={{ flex: 1, padding: '5px 10px', fontSize: '0.78rem' }}
                      placeholder="+ Add tone rule..."
                      value={newRuleInput}
                      onChange={(e) => setNewRuleInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRule(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddRule}
                      className="glass-button-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Sticky Submit Footer (Always Visible) */}
              <div style={{ position: 'sticky', bottom: 0, background: 'var(--card-inner-bg-solid, #0f172a)', paddingTop: '14px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto', zIndex: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="glass-button-secondary" style={{ padding: '10px 20px' }}>
                  Cancel
                </button>
                <button type="submit" className="glass-button" disabled={saving} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', padding: '10px 24px', fontWeight: '800' }}>
                  {saving ? 'Saving Brand...' : editingDomain ? 'Update Brand Domain' : 'Save Brand Portfolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Custom Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Remove Brand Portfolio"
        itemName={deleteTarget?.name}
        message={`Are you sure you want to remove "${deleteTarget?.name || 'this brand'}" from your portfolio vault? This action cannot be undone.`}
        confirmText="Remove Brand"
        cancelText="Keep Brand"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
