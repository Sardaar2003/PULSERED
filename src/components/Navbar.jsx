import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Key, Bookmark, LogOut, ShieldCheck, Zap, LayoutDashboard, Users } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenSettings, onOpenSaved }) => {
  const { user, isAuthenticated, logout, savedPosts, adminUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const pendingCount = adminUsers.filter((u) => !u.isApproved).length;

  return (
    <header className="glass-card" style={{ borderRadius: '0 0 20px 20px', padding: '14px 28px', marginBottom: '28px', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1240px', margin: '0 auto', gap: '20px' }}>
        
        {/* 1. Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                PULSERED
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                SOCIAL AI
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-2px' }}>
              Social Intelligence & Analytics
            </p>
          </div>
        </div>

        {/* 2. Center Workspace Navigation Tabs (Admin Only gets User Management Tab) */}
        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-inner-bg)', padding: '4px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={15} />
              Insights Dashboard
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`nav-tab-button ${activeTab === 'users' ? 'active' : ''}`}
                style={{ position: 'relative' }}
              >
                <Users size={15} />
                User Management
                {pendingCount > 0 && (
                  <span
                    style={{
                      background: '#f59e0b',
                      color: '#000000',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      borderRadius: '10px',
                      padding: '2px 6px',
                      lineHeight: 1,
                      marginLeft: '4px',
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {/* 3. Right Utility Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="glass-button-secondary"
            style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>

          {isAuthenticated && (
            <>
              {/* Saved Posts Counter */}
              <button
                onClick={onOpenSaved}
                className="glass-button-secondary"
                style={{ position: 'relative' }}
              >
                <Bookmark size={16} color="#a855f7" />
                <span>Saved</span>
                {savedPosts.length > 0 && (
                  <span
                    style={{
                      background: '#ec4899',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      borderRadius: '10px',
                      padding: '2px 6px',
                      lineHeight: 1,
                      marginLeft: '4px',
                    }}
                  >
                    {savedPosts.length}
                  </span>
                )}
              </button>

              {/* API Settings */}
              <button
                onClick={onOpenSettings}
                className="glass-button-secondary"
                title="API Settings"
              >
                <Key size={16} color="#6366f1" />
                <span>API Key</span>
              </button>

              {/* User Profile Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      flexShrink: 0,
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {user.name}
                      </span>
                      {user.role === 'admin' && (
                        <span style={{ fontSize: '0.65rem', background: '#818cf8', color: '#fff', borderRadius: '4px', padding: '1px 5px', fontWeight: '700' }}>ADMIN</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {user.email}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="glass-button-secondary"
                  style={{ padding: '8px', borderRadius: '50%', color: '#f87171' }}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
