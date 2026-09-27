import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Edit3, X, Sparkles, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const BrandVaultView = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null); // null or domain object being edited

  // Form State (for both Add and Edit)
  const [formDomainUrl, setFormDomainUrl] = useState('');
  const [formBrandName, setFormBrandName] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formTargetSubreddits, setFormTargetSubreddits] = useState('homesecurity, SaaS, startups');
  const [formTargetKeywords, setFormTargetKeywords] = useState('');
  const [formWritingRules, setFormWritingRules] = useState('Tone: Helpful Peer, Keep DMs under 40 words');
  const [saving, setSaving] = useState(false);

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
    setFormDomainUrl('');
    setFormBrandName('');
    setFormSpecialization('');
    setFormTargetSubreddits('SaaS, startups, Entrepreneur');
    setFormTargetKeywords('affordable security cameras homeowners, home security system compare, adt alternatives');
    setFormWritingRules('Tone: Empathetic Founder, Under 40 words');
    setShowAddModal(true);
  };

  const openEditModal = (d) => {
    setEditingDomain(d);
    setFormDomainUrl(d.domainUrl || '');
    setFormBrandName(d.brandName || '');
    setFormSpecialization(d.specialization || '');
    setFormTargetSubreddits(Array.isArray(d.targetSubreddits) ? d.targetSubreddits.join(', ') : (d.targetSubreddits || ''));
    setFormTargetKeywords(Array.isArray(d.targetKeywords) ? d.targetKeywords.join(', ') : (d.targetKeywords || ''));
    setFormWritingRules(Array.isArray(d.writingRules) ? d.writingRules.join(', ') : (d.writingRules || ''));
    setShowAddModal(true);
  };

  const handleSaveDomain = async (e) => {
    e.preventDefault();
    if (!formDomainUrl || !formBrandName || !formSpecialization) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('pulsered_token');
      const payload = {
        domainUrl: formDomainUrl,
        brandName: formBrandName,
        specialization: formSpecialization,
        targetSubreddits: formTargetSubreddits.split(',').map((s) => s.trim()).filter(Boolean),
        targetKeywords: formTargetKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        writingRules: formWritingRules.split(',').map((r) => r.trim()).filter(Boolean),
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

  const handleDeleteDomain = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your portfolio vault?`)) return;
    try {
      const token = localStorage.getItem('pulsered_token');
      await axios.delete(`${API_BASE_URL}/brand-domains/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDomains();
    } catch (err) {
      console.error('Failed to delete domain:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
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
                <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    onClick={() => openEditModal(d)}
                    className="glass-button-secondary"
                    style={{ flex: 1, padding: '9px', fontSize: '0.85rem' }}
                  >
                    <Edit3 size={15} color="#fbbf24" /> Edit Brand
                  </button>

                  <button
                    onClick={() => handleDeleteDomain(domainId, d.brandName)}
                    className="glass-button-secondary"
                    style={{ padding: '9px 14px', color: '#f87171' }}
                    title="Delete Brand Domain"
                  >
                    <Trash2 size={15} />
                  </button>
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
              maxWidth: '620px',
              padding: '28px',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
              background: 'var(--card-inner-bg-solid)',
              border: '1px solid var(--glass-border-hover)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
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

            {/* Modal Form */}
            <form onSubmit={handleSaveDomain} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-grid-2">
                <div>
                  <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Brand / Product Name
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. DocuAI Suite"
                    value={formBrandName}
                    onChange={(e) => setFormBrandName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Domain URL
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. DocuAI.io"
                    value={formDomainUrl}
                    onChange={(e) => setFormDomainUrl(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Specialization & Value Proposition
                </label>
                <textarea
                  className="glass-input"
                  style={{ width: '100%', height: '70px', resize: 'none', lineHeight: 1.45 }}
                  placeholder="Explain what problem this brand solves so the Lead Agent's 3D Intent Engine can accurately match buyer posts..."
                  value={formSpecialization}
                  onChange={(e) => setFormSpecialization(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Target High-Intent Keywords (Comma-separated)
                </label>
                <textarea
                  className="glass-input"
                  style={{ width: '100%', height: '64px', resize: 'none', lineHeight: 1.4, fontSize: '0.83rem' }}
                  placeholder="e.g. affordable security cameras homeowners, home security system compare, adt alternatives"
                  value={formTargetKeywords}
                  onChange={(e) => setFormTargetKeywords(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Target Subreddits (Comma-separated)
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    style={{ width: '100%' }}
                    placeholder="SaaS, startups, Entrepreneur"
                    value={formTargetSubreddits}
                    onChange={(e) => setFormTargetSubreddits(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    AI Voice Guidelines
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    style={{ width: '100%' }}
                    placeholder="Tone: Empathetic Founder, Under 40 words"
                    value={formWritingRules}
                    onChange={(e) => setFormWritingRules(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="glass-button-secondary">
                  Cancel
                </button>
                <button type="submit" className="glass-button" disabled={saving}>
                  {saving ? 'Saving...' : editingDomain ? 'Update Brand' : 'Save Brand Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
