import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, X, Sparkles, Search, Sliders, ShieldAlert, Tag, Zap } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const BrandVaultModal = ({ isOpen, onClose, onDomainsUpdated }) => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [domainUrl, setDomainUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [offerDescription, setOfferDescription] = useState('');

  // Array Tag States
  const [targetKeywords, setTargetKeywords] = useState([]);
  const [targetSubreddits, setTargetSubreddits] = useState([]);
  const [negativeKeywords, setNegativeKeywords] = useState([]);
  const [writingRules, setWritingRules] = useState([]);

  // Inline Inputs
  const [newKwInput, setNewKwInput] = useState('');
  const [newSubInput, setNewSubInput] = useState('');
  const [newNegInput, setNewNegInput] = useState('');
  const [newRuleInput, setNewRuleInput] = useState('');

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(null);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pulsered_token');
      const res = await axios.get(`${API_BASE_URL}/brand-domains`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomains(res.data?.domains || []);
      if (onDomainsUpdated) onDomainsUpdated(res.data?.domains || []);
    } catch (err) {
      console.error('Failed to fetch brand domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDomains();
    }
  }, [isOpen]);

  const handleAutoGenerate = async () => {
    if (!brandName && !specialization && !offerDescription) {
      alert('Please fill in Brand Name or Offer Description first so AI can analyze target buyers.');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const token = localStorage.getItem('pulsered_token');
      const res = await axios.post(`${API_BASE_URL}/brand-domains/generate-blueprint`, {
        onboardingPathway: 'pitch_brief',
        domainUrl,
        brandName,
        pitchBrief: `${brandName} - ${specialization}. ${offerDescription}`,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const blueprint = res.data?.blueprint;
      if (blueprint) {
        if (blueprint.targetKeywords?.length) setTargetKeywords(blueprint.targetKeywords);
        if (blueprint.targetSubreddits?.length) setTargetSubreddits(blueprint.targetSubreddits);
        if (blueprint.negativeKeywords?.length) setNegativeKeywords(blueprint.negativeKeywords);
        setWritingRules(['Tone: Helpful Expert', 'Keep DMs under 40 words']);
        setAiConfidence(blueprint.confidenceScore || 92);
      }
    } catch (err) {
      console.error('Failed to auto generate AI blueprint:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!brandName || (!specialization && !offerDescription)) return;

    try {
      const token = localStorage.getItem('pulsered_token');
      await axios.post(
        `${API_BASE_URL}/brand-domains`,
        {
          domainUrl: domainUrl || 'Custom Profile',
          brandName,
          specialization: offerDescription || specialization,
          targetSubreddits,
          targetKeywords,
          negativeKeywords,
          writingRules,
          confidenceScore: aiConfidence || 90,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDomainUrl('');
      setBrandName('');
      setSpecialization('');
      setOfferDescription('');
      setShowAddForm(false);
      fetchDomains();
    } catch (err) {
      console.error('Failed to add brand domain:', err);
    }
  };

  const handleDeleteDomain = async (id) => {
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '28px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={24} color="var(--accent-primary)" />
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                Multi-Domain Brand Vault
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Manage domain URLs, product specializations, and AI matching rules.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Active Portfolio ({domains.length} Brands)
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="glass-button"
            style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add Brand Domain
          </button>
        </div>

        {/* Add Brand Form Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleAddDomain}
            style={{
              background: 'var(--card-inner-bg)',
              border: '1px solid var(--accent-primary)',
              padding: '16px',
              borderRadius: '16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
              Add New Product Domain
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Domain URL</label>
                <input
                  type="text"
                  value={domainUrl}
                  onChange={(e) => setDomainUrl(e.target.value)}
                  placeholder="e.g. DocuAI.io"
                  className="glass-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Brand / Product Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. DocuAI Suite"
                  className="glass-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Specialization & Value Proposition</label>
              <textarea
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Describe what this brand specializes in so Lead Agent matches buyer intent..."
                className="glass-input"
                style={{ width: '100%', height: '54px', fontSize: '0.82rem', resize: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Target High-Intent Keywords (Comma-separated)</label>
              <textarea
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="e.g. affordable security cameras homeowners, home security system compare, adt alternatives"
                className="glass-input"
                style={{ width: '100%', height: '54px', fontSize: '0.82rem', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Target Subreddits (Comma-separated)</label>
                <input
                  type="text"
                  value={targetSubreddits}
                  onChange={(e) => setTargetSubreddits(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Voice Guidelines</label>
                <input
                  type="text"
                  value={writingRules}
                  onChange={(e) => setWritingRules(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="glass-button-primary"
              style={{ padding: '8px', fontSize: '0.85rem', fontWeight: '800', borderRadius: '10px', marginTop: '4px' }}
            >
              Save Brand Domain
            </button>
          </form>
        )}

        {/* Domain List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading Portfolio...</div>
          ) : domains.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No brand domains added yet.</div>
          ) : (
            domains.map((d) => (
              <div
                key={d._id || d.id}
                style={{
                  background: 'var(--card-inner-bg)',
                  border: '1px solid var(--glass-border)',
                  padding: '16px',
                  borderRadius: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{d.brandName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                      {d.domainUrl}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                    💡 <strong>Specialization:</strong> {d.specialization}
                  </p>
                  {d.targetKeywords && d.targetKeywords.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      {d.targetKeywords.map((kw, i) => (
                        <span key={i} style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(52,211,153,0.25)' }}>
                          🔍 {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  {d.targetSubreddits && d.targetSubreddits.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {d.targetSubreddits.map((sub, i) => (
                        <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '6px' }}>
                          r/{sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteDomain(d._id || d.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  title="Remove Brand Domain"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
