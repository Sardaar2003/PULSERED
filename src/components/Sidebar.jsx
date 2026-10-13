import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Users,
  Bookmark,
  Key,
  Sun,
  Moon,
  LogOut,
  Zap,
  Globe,
  BarChart3,
  Radio,
  Sliders,
  MessageSquare,
} from 'lucide-react';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenRedditAccount,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, isAuthenticated, logout, savedPosts, adminUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  const pendingCount = adminUsers.filter((u) => !u.isApproved).length;

  // Periodically fetch unread inbox messages count
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('pulsered_token');
        if (!token) return;
        const res = await axios.get('/api/inbox/threads?channel=all&filter=unread', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadInboxCount(res.data?.totalUnread || 0);
      } catch (err) {
        // Silently catch in sidebar
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [isAuthenticated, activeTab]);

  if (!isAuthenticated) return null;

  return (
    <aside
      className="glass-card"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isCollapsed ? '76px' : '260px',
        borderRadius: '0 24px 24px 0',
        padding: isCollapsed ? '20px 10px' : '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 100,
        boxShadow: '4px 0 30px rgba(0, 0, 0, 0.25)',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Branding & Main Navigation */}
      <div>
        {/* Brand Logo - Single Interactive Toggle Icon */}
        {isCollapsed ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={onToggleCollapse}
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
                cursor: 'pointer',
                border: 'none',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              title="Expand Sidebar"
            >
              <Zap size={22} color="#ffffff" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingLeft: '4px' }}>
            <button
              type="button"
              onClick={onToggleCollapse}
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
                cursor: 'pointer',
                border: 'none',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              title="Collapse Sidebar"
            >
              <Zap size={22} color="#ffffff" />
            </button>

            <div
              style={{ cursor: 'pointer' }}
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
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
        )}

        {/* Nav Group Header (Full only) */}
        {!isCollapsed && (
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', paddingLeft: '8px' }}>
            Workspace
          </div>
        )}

        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
          {/* Workspace Tab */}
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`nav-tab-button ${activeTab === 'pipeline' || activeTab === 'dashboard' ? 'active' : ''}`}
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 0' : '12px 14px',
              borderRadius: '14px',
              fontSize: '0.92rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0' : '10px',
            }}
            title="Workspace"
          >
            <Zap size={20} color={activeTab === 'pipeline' || activeTab === 'dashboard' ? '#ffffff' : 'var(--accent-amber)'} />
            {!isCollapsed && <span>Workspace</span>}
          </button>

          {/* Unified Inbox Hub Tab */}
          <button
            onClick={() => setActiveTab('inbox')}
            className={`nav-tab-button ${activeTab === 'inbox' ? 'active' : ''}`}
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 0' : '10px 14px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              position: 'relative',
            }}
            title="Inbox Hub"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '10px', justifyContent: isCollapsed ? 'center' : 'flex-start', width: isCollapsed ? '100%' : 'auto' }}>
              <MessageSquare size={18} color={activeTab === 'inbox' ? '#ffffff' : '#38bdf8'} />
              {!isCollapsed && <span>Inbox Hub</span>}
            </div>
            {unreadInboxCount > 0 && (
              isCollapsed ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ec4899',
                    boxShadow: '0 0 6px #ec4899',
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: 'rgba(236, 72, 153, 0.2)',
                    color: '#f472b6',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    boxShadow: '0 0 10px rgba(236, 72, 153, 0.2)',
                  }}
                >
                  {unreadInboxCount}
                </span>
              )
            )}
          </button>

          {/* Analytics & Intelligence Tab */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`nav-tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 0' : '10px 14px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0' : '10px',
            }}
            title="Analytics & Intelligence"
          >
            <BarChart3 size={18} color={activeTab === 'analytics' ? '#ffffff' : '#a855f7'} />
            {!isCollapsed && <span>Analytics & Intelligence</span>}
          </button>

          {/* Brand Portfolio Vault Tab */}
          <button
            onClick={() => setActiveTab('brands')}
            className={`nav-tab-button ${activeTab === 'brands' ? 'active' : ''}`}
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 0' : '10px 14px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0' : '10px',
            }}
            title="Brand Vault Portfolio"
          >
            <Globe size={18} color={activeTab === 'brands' ? '#ffffff' : '#38bdf8'} />
            {!isCollapsed && <span>Brand Vault Portfolio</span>}
          </button>

          {/* Admin User Management Tab (Admin Only) */}
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`nav-tab-button ${activeTab === 'users' ? 'active' : ''}`}
              style={{
                width: '100%',
                padding: isCollapsed ? '12px 0' : '10px 14px',
                borderRadius: '14px',
                fontSize: '0.9rem',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                position: 'relative',
              }}
              title="User Management"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '10px', justifyContent: isCollapsed ? 'center' : 'flex-start', width: isCollapsed ? '100%' : 'auto' }}>
                <Users size={18} color={activeTab === 'users' ? '#ffffff' : '#818cf8'} />
                {!isCollapsed && <span>User Management</span>}
              </div>
              {pendingCount > 0 && (
                isCollapsed ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '12px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#f59e0b',
                    }}
                    title={`${pendingCount} pending users`}
                  />
                ) : (
                  <span
                    style={{
                      background: '#f59e0b',
                      color: '#000000',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      borderRadius: '10px',
                      padding: '2px 8px',
                      lineHeight: 1,
                    }}
                  >
                    {pendingCount}
                  </span>
                )
              )}
            </button>
          )}

          {/* Dedicated Saved Threads Page Tab (No longer a popup modal!) */}
          <button
            onClick={() => setActiveTab('saved-threads')}
            className={`nav-tab-button ${activeTab === 'saved-threads' ? 'active' : ''}`}
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 0' : '10px 14px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              position: 'relative',
            }}
            title="Saved Threads"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '10px', justifyContent: isCollapsed ? 'center' : 'flex-start', width: isCollapsed ? '100%' : 'auto' }}>
              <Bookmark size={18} color={activeTab === 'saved-threads' ? '#ffffff' : '#a855f7'} />
              {!isCollapsed && <span>Saved Threads</span>}
            </div>
            {savedPosts.length > 0 && (
              isCollapsed ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ec4899',
                  }}
                  title={`${savedPosts.length} saved threads`}
                />
              ) : (
                <span
                  style={{
                    background: '#ec4899',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    borderRadius: '10px',
                    padding: '2px 8px',
                    lineHeight: 1,
                  }}
                >
                  {savedPosts.length}
                </span>
              )
            )}
          </button>

          {/* API Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="nav-tab-button"
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 0' : '10px 14px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0' : '10px',
            }}
            title="API Settings"
          >
            <Key size={18} color="#6366f1" />
            {!isCollapsed && <span>API Settings</span>}
          </button>

          {/* Reddit Account & Cookies Trigger */}
          <button
            onClick={onOpenRedditAccount}
            className="nav-tab-button"
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 0' : '10px 14px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0' : '10px',
            }}
            title="Reddit Account"
          >
            <Radio size={18} color="#ff4500" />
            {!isCollapsed && <span>Reddit Account</span>}
          </button>

          {/* Unified Agent Configuration Page Navigation */}
          <button
            onClick={() => setActiveTab('agent-settings')}
            className={`nav-tab-button ${activeTab === 'agent-settings' ? 'active' : ''}`}
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 0' : '10px 14px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0' : '10px',
            }}
            title="Agent Configuration"
          >
            <Sliders size={18} color={activeTab === 'agent-settings' ? '#ffffff' : 'var(--accent-primary)'} />
            {!isCollapsed && <span>Agent Configuration</span>}
          </button>
        </div>
      </div>

      {/* Bottom Footer Controls: Theme Switcher & User Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', width: '100%', alignItems: 'center' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="glass-button-secondary"
          style={{
            width: '100%',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '10px 0' : '10px 14px',
            borderRadius: '14px',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
            {!isCollapsed && <span style={{ fontSize: '0.85rem' }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </div>
          {!isCollapsed && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Toggle</span>}
        </button>

        {/* User Profile Pill */}
        {isCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
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
                cursor: 'default',
              }}
              title={`${user.name} (${user.email})`}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <button
              onClick={logout}
              style={{
                background: 'var(--card-inner-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                width: '32px',
                height: '32px',
                color: '#f87171',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--card-inner-bg)', padding: '10px 12px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
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
        )}
      </div>
    </aside>
  );
};
