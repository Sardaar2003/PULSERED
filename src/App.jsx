import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { LandingPortal } from './components/LandingPortal';
import { UserManagementView } from './components/UserManagementView';
import { SavedPostsModal } from './components/SavedPostsModal';
import { ProwloSettingsModal } from './components/ProwloSettingsModal';
import { SessionEvictedModal } from './components/SessionEvictedModal';
import { LeadPipelineBoard } from './components/LeadPipelineBoard';
import { BrandVaultView } from './components/BrandVaultView';
import { AnalyticsIntelligenceView } from './components/AnalyticsIntelligenceView';

const DashboardContent = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'analytics' | 'users' | 'brands'
  const [selectedDomain] = useState('AlertCareLine.com');

  // Modals state
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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
        onOpenSaved={() => setIsSavedModalOpen(true)}
      />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '40px' }}>
        <main style={{ maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '28px 24px', flex: 1 }}>
          {activeTab === 'users' && user?.role === 'admin' ? (
            <UserManagementView />
          ) : activeTab === 'brands' ? (
            <BrandVaultView />
          ) : activeTab === 'analytics' ? (
            <AnalyticsIntelligenceView />
          ) : (
            <LeadPipelineBoard selectedDomain={selectedDomain} />
          )}
        </main>

        <footer style={{ marginTop: 'auto', paddingTop: '40px', paddingBottom: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
            PulseRed AI Platform • Lead Agent Intelligence & CRM Hub
          </p>
        </footer>
      </div>

      {/* Modals */}
      <SavedPostsModal isOpen={isSavedModalOpen} onClose={() => setIsSavedModalOpen(false)} />
      <ProwloSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
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
