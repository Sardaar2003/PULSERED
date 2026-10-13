import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { LandingPortal } from './components/LandingPortal';
import { UserManagementView } from './components/UserManagementView';
import { ProwloSettingsModal } from './components/ProwloSettingsModal';
import { RedditAccountModal } from './components/RedditAccountModal';
import { SessionEvictedModal } from './components/SessionEvictedModal';
import { AgentSettingsView } from './components/AgentSettingsView';
import { SavedThreadsView } from './components/SavedThreadsView';
import { InboxHubView } from './components/InboxHubView';
import { LeadPipelineBoard } from './components/LeadPipelineBoard';
import { BrandVaultView } from './components/BrandVaultView';
import { AnalyticsIntelligenceView } from './components/AnalyticsIntelligenceView';

const DashboardContent = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'inbox' | 'analytics' | 'users' | 'brands' | 'agent-settings' | 'saved-threads'
  const [selectedDomain] = useState('AlertCareLine.com');

  // Modals state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRedditModalOpen, setIsRedditModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '42px', height: '42px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPortal />
        <SessionEvictedModal />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', paddingBottom: '48px' }}>
      <div className="ambient-bg-glow">
        <div className="glow-blob glow-blob-1" />
        <div className="glow-blob glow-blob-2" />
        <div className="glow-blob glow-blob-3" />
      </div>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenRedditAccount={() => setIsRedditModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          marginLeft: isSidebarCollapsed ? '76px' : '260px',
          transition: 'margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          width: isSidebarCollapsed ? 'calc(100% - 76px)' : 'calc(100% - 260px)',
          paddingBottom: activeTab === 'inbox' ? '0' : '40px',
        }}
      >
        <main
          style={{
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            padding: activeTab === 'inbox' ? '16px 20px 0 20px' : '28px 24px',
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === 'users' && user?.role === 'admin' ? (
            <UserManagementView />
          ) : activeTab === 'inbox' ? (
            <InboxHubView
              onGoToWorkspace={() => setActiveTab('pipeline')}
              onOpenRedditModal={() => setIsRedditModalOpen(true)}
            />
          ) : activeTab === 'brands' ? (
            <BrandVaultView />
          ) : activeTab === 'analytics' ? (
            <AnalyticsIntelligenceView />
          ) : activeTab === 'agent-settings' ? (
            <AgentSettingsView />
          ) : activeTab === 'saved-threads' ? (
            <SavedThreadsView onGoToWorkspace={() => setActiveTab('pipeline')} />
          ) : (
            <LeadPipelineBoard selectedDomain={selectedDomain} />
          )}
        </main>

        {activeTab !== 'inbox' && (
          <footer style={{ marginTop: 'auto', paddingTop: '40px', paddingBottom: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
              PulseRed AI Platform • Lead Agent Intelligence & CRM Hub
            </p>
          </footer>
        )}
      </div>

      {/* Modals */}
      <ProwloSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      <RedditAccountModal isOpen={isRedditModalOpen} onClose={() => setIsRedditModalOpen(false)} />
      <SessionEvictedModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
