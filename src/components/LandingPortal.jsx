import React, { useState } from 'react';
import { Sparkles, Shield, BarChart2, Lock, User, Mail, Eye, EyeOff, CheckCircle, Clock, Zap, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LandingPortal = () => {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingApprovalMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        const res = await register(name, email, password);
        if (res.requiresApproval) {
          setPendingApprovalMsg('Your registration request has been submitted! Access is pending admin approval. Please wait for an administrator to activate your account.');
          setMode('login');
        }
      }
    } catch (err) {
      if (err.response?.data?.isPendingApproval) {
        setPendingApprovalMsg('Your account is pending admin approval. You will be able to log in once an administrator approves your request.');
      } else {
        setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
      {/* Top Bar */}
      <header style={{ padding: '24px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Zap size={24} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
              PULSERED AI
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)', marginLeft: '8px' }}>
              ENTERPRISE PLATFORM
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Dark / Light Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="glass-button-secondary"
            style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#6366f1" />}
          </button>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Secure Social Intelligence Engine
          </span>
        </div>
      </header>

      {/* Main Hero Section */}
      <div style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '20px 36px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '48px', alignItems: 'center' }}>
        {/* Left Copy & Feature Highlights */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 14px', borderRadius: '20px', color: '#818cf8', fontSize: '0.85rem', fontWeight: '600', marginBottom: '20px' }}>
            <Sparkles size={16} /> Admin-Controlled Access & Single Session Security
          </div>

          <h1 style={{ fontSize: '3.1rem', fontWeight: '800', lineHeight: 1.15, marginBottom: '20px' }}>
            Deep Social Listening & <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Reddit Intelligence</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
            Extract actionable community insights, sentiment breakdown, and market conversations with real-time semantic analysis and enterprise-grade multi-user governance.
          </p>

          {/* Feature Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px' }}>
              <Shield size={20} color="#818cf8" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Admin Approval System</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Only vetted members granted access by administrators can enter.</p>
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <Lock size={20} color="#ec4899" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Single Active Session</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prevents concurrent logins across multiple devices/tabs.</p>
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <BarChart2 size={20} color="#4ade80" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Keyword Sentiment</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automated positive, neutral, and negative text polarities.</p>
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <Zap size={20} color="#f59e0b" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Resilient Data Engine</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>High-capacity crawling with automatic live fallback.</p>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="glass-card" style={{ padding: '36px', width: '100%', maxWidth: '480px', justifySelf: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '6px' }}>
              {mode === 'login' ? 'Sign In to Workspace' : 'Request Access Account'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {mode === 'login' ? 'Enter your credentials to enter the platform' : 'Submit your details for admin approval'}
            </p>
          </div>

          {/* Pending Approval Banner */}
          {pendingApprovalMsg && (
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '12px', padding: '14px', marginBottom: '20px', color: '#f59e0b', fontSize: '0.85rem', display: 'flex', gap: '10px' }}>
              <Clock size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Approval Required</strong>
                <p style={{ marginTop: '2px', lineHeight: 1.4, color: 'var(--text-primary)' }}>{pendingApprovalMsg}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '12px', marginBottom: '20px', color: '#f87171', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Mode Tabs */}
          <div style={{ display: 'flex', background: 'var(--card-inner-bg)', borderRadius: '12px', padding: '4px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setPendingApprovalMsg(null); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'login' ? 'var(--accent-primary)' : 'transparent',
                color: mode === 'login' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setPendingApprovalMsg(null); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'register' ? 'var(--accent-primary)' : 'transparent',
                color: mode === 'register' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Register Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    required
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '42px' }}
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2, pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '42px' }}
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2, pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '42px', paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 2 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="glass-button" style={{ height: '50px', fontSize: '1rem', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Workspace' : 'Submit Registration Request'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '20px' }}>
            Protected by PulseRed Enterprise Single Session Governance & MongoDB Atlas Encryption.
          </p>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        © 2026 PulseRed Social Intelligence Platform • All Rights Reserved
      </footer>
    </div>
  );
};
