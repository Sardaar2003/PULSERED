import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, Users, Bookmark, Key, Sun, Moon, LogOut, Zap, ShieldCheck } from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, onOpenSettings, onOpenSaved }) => {
  const { user, isAuthenticated, logout, savedPosts, adminUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const pendingCount = adminUsers.filter((u) => !u.isApproved).length;

  if (!isAuthenticated) return null;

  return (
    <aside
      className="glass-card"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '260px',
        borderRadius: '0 24px 24px 0',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 100,
        boxShadow: '4px 0 30px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Top Branding & Main Navigation */}
      <div>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '6px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)',
              flexShrink: 0,
            }}
          >
            <Zap size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                PULSERED
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: '700', padding: '1px 6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                AI
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '-2px' }}>
              Social Intelligence
            </p>
          </div>
        </div>

        {/* Nav Group Header */}
        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', paddingLeft: '8px' }}>
          Workspace
        </div>

        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Insights Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '14px', fontSize: '0.9rem', justifyContent: 'flex-start' }}
          >
            <LayoutDashboard size={18} />
            <span>Insights Dashboard</span>
          </button>

          {/* Admin User Management Tab (Admin Only) */}
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`nav-tab-button ${activeTab === 'users' ? 'active' : ''}`}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '14px', fontSize: '0.9rem', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} />
                <span>User Management</span>
              </div>
              {pendingCount > 0 && (
                <span
                  style={{
                    background: '#f59e0b',
                    color: '#000000',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    borderRadius: '10px',
                    padding: '2px 7px',
                    lineHeight: 1,
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {/* Saved Posts Trigger */}
          <button
            onClick={onOpenSaved}
            className="nav-tab-button"
            style={{ width: '100%', padding: '10px 14px', borderRadius: '14px', fontSize: '0.9rem', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bookmark size={18} color="#a855f7" />
              <span>Saved Threads</span>
            </div>
            {savedPosts.length > 0 && (
              <span
                style={{
                  background: '#ec4899',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  borderRadius: '10px',
                  padding: '2px 7px',
                  lineHeight: 1,
                }}
              >
                {savedPosts.length}
              </span>
            )}
          </button>

          {/* API Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="nav-tab-button"
            style={{ width: '100%', padding: '10px 14px', borderRadius: '14px', fontSize: '0.9rem', justifyContent: 'flex-start' }}
          >
            <Key size={18} color="#6366f1" />
            <span>API Settings</span>
          </button>
        </div>
      </div>

      {/* Bottom Footer Controls: Theme Switcher & User Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="glass-button-secondary"
          style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
            <span style={{ fontSize: '0.85rem' }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Toggle</span>
        </button>

        {/* User Profile Pill */}
        <div style={{ background: 'var(--card-inner-bg)', padding: '10px 12px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.25)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </span>
                {user.role === 'admin' && (
                  <span style={{ fontSize: '0.6rem', background: '#818cf8', color: '#fff', borderRadius: '4px', padding: '1px 4px', fontWeight: '700' }}>ADMIN</span>
                )}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
