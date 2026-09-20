import React, { useState } from 'react';
import { X, Key, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProwloSettingsModal = ({ isOpen, onClose }) => {
  const { user, updateProwloKey } = useAuth();
  const [apiKey, setApiKey] = useState(user?.prowloApiKey || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateProwloKey(apiKey.trim());
      setMessage({ type: 'success', text: 'PulseRed API Key updated successfully!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update API key.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card animate-fade-in"
        style={{ width: '100%', maxWidth: '520px', padding: '28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={22} color="#6366f1" />
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>PulseRed API Settings</h3>
          </div>

          <button onClick={onClose} className="glass-button-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Informational Banner */}
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Sparkles size={18} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '4px' }}>
                PulseRed Crawl Integration
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Social crawling engine extracts community discussions without API rate limit blocks. Provide your custom API Key below to unlock high-capacity search.
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              API Key
            </label>
            <input
              type="password"
              className="glass-input"
              style={{ width: '100%', borderRadius: '14px' }}
              placeholder="e.g., prowlo_live_sk_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Leave blank to automatically utilize resilient Live Reddit feed fallback.
            </p>
          </div>

          {message && (
            <div
              style={{
                fontSize: '0.85rem',
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: message.type === 'success' ? '#4ade80' : '#f87171',
                border: message.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <CheckCircle size={16} />
              {message.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="glass-button-secondary">
              Cancel
            </button>
            <button type="submit" className="glass-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save API Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
