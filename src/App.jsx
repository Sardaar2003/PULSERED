import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { LandingPortal } from './components/LandingPortal';
import { SearchSection } from './components/SearchSection';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { RedditResultList } from './components/RedditResultList';
import { UserManagementView } from './components/UserManagementView';
import { SavedPostsModal } from './components/SavedPostsModal';
import { ProwloSettingsModal } from './components/ProwloSettingsModal';
import { SessionEvictedModal } from './components/SessionEvictedModal';
import { DynamicLoaderCard } from './components/DynamicLoaderCard';
const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const DashboardContent = () => {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'users'
  const [selectedDomain, setSelectedDomain] = useState('AlertCareLine.com');
  const [keyword, setKeyword] = useState('AI Agents');
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);

  const [searchMode, setSearchMode] = useState('keyword');
  const [timeFrame, setTimeFrame] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('reddit');

  const handleSearch = async (searchKeyword, targetPage = 1, filterOverrides = {}, isPagination = false) => {
    const activeMode = filterOverrides.mode || searchMode;
    const activeTime = filterOverrides.timeFrame || timeFrame;
    const activeSent = filterOverrides.sentimentFilter || sentimentFilter;
    const activeSort = filterOverrides.sortBy || sortBy;
    const activePlat = filterOverrides.platformFilter || platformFilter;

    // ⚡ Instant 0ms Pagination Optimization: Only when explicitly paginating existing search results
    if (
      isPagination &&
      searchKeyword === keyword &&
      activeMode === searchMode &&
      activeTime === timeFrame &&
      activeSent === sentimentFilter &&
      activeSort === sortBy &&
      activePlat === platformFilter &&
      allPosts &&
      allPosts.length > 0
    ) {
      setPage(targetPage);
      const limitNum = 6;
      const startIndex = (targetPage - 1) * limitNum;
      setPosts(allPosts.slice(startIndex, startIndex + limitNum));
      setPagination((prev) => (prev ? { ...prev, page: targetPage } : { totalPosts: allPosts.length, page: targetPage, limit: limitNum, totalPages: Math.ceil(allPosts.length / limitNum) }));
      return;
    }

    setLoading(true);
    setError(null);
    setKeyword(searchKeyword);
    setPage(targetPage);

    const activeToken = token || localStorage.getItem('pulsered_token');

    try {
      const response = await axios.get(
        `${API_BASE_URL}/reddit/search?q=${encodeURIComponent(searchKeyword)}&page=${targetPage}&limit=6&mode=${activeMode}&timeFrame=${activeTime}&sentiment=${activeSent}&sortBy=${activeSort}&platform=${activePlat}`,
        {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        }
      );
      setPosts(response.data.posts || []);
      setAllPosts(response.data.allPosts || response.data.posts || []);
      setPagination(response.data.pagination || null);
      setAnalytics(response.data.analytics || null);
    } catch (err) {
      console.error('Search request error:', err);
      setError(err.response?.data?.error || 'Failed to fetch Reddit data. Please ensure the backend server is active.');
    } finally {
      setLoading(false);
    }
  };

  // Initial search load
  useEffect(() => {
    if (isAuthenticated) {
      handleSearch('AI Agents', 1);
    }
  }, [isAuthenticated]);

  // Client-side sorting logic
  const getSortedPosts = () => {
    if (!posts) return [];
    const sorted = [...posts];

    if (sortBy === 'upvotes') {
      return sorted.sort((a, b) => b.score - a.score);
    }
    if (sortBy === 'comments') {
      return sorted.sort((a, b) => b.numComments - a.numComments);
    }
    if (sortBy === 'recent') {
      return sorted.sort((a, b) => b.createdUtc - a.createdUtc);
    }

    return sorted.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  };

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

  // 🔒 First-screen mandatory authentication guard
  if (!isAuthenticated) {
    return (
      <>
        <LandingPortal />
        <SessionEvictedModal />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Ambient Glow background */}
      <div className="ambient-bg-glow">
        <div className="glow-blob glow-blob-1" />
        <div className="glow-blob glow-blob-2" />
        <div className="glow-blob glow-blob-3" />
      </div>

      {/* Vertical Glassmorphism Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSaved={() => setIsSavedModalOpen(true)}
      />

      {/* Main Workspace Area (offset by sidebar width 260px) */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <main style={{ maxWidth: '1180px', width: '100%', margin: '0 auto', padding: '36px 28px', flex: 1 }}>
          {activeTab === 'users' && user?.role === 'admin' ? (
            <UserManagementView />
          ) : (
            <>
              <SearchSection
                onSearch={(k, filterOpts) => handleSearch(k, 1, filterOpts)}
                loading={loading}
                sortBy={sortBy}
                setSortBy={setSortBy}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                timeFrame={timeFrame}
                setTimeFrame={setTimeFrame}
                sentimentFilter={sentimentFilter}
                setSentimentFilter={setSentimentFilter}
                platformFilter={platformFilter}
                setPlatformFilter={setPlatformFilter}
                selectedDomain={selectedDomain}
                setSelectedDomain={setSelectedDomain}
                activeKeyword={keyword}
              />

              {error && (
                <div
                  className="glass-card animate-fade-in"
                  style={{
                    padding: '16px 24px',
                    marginBottom: '24px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{error}</span>
                  <button
                    onClick={() => handleSearch(keyword, page)}
                    className="glass-button-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {loading ? (
                <DynamicLoaderCard platform={platformFilter} keyword={keyword} />
              ) : (
                <>
                  {analytics && <AnalyticsPanel analytics={analytics} keyword={keyword} />}
                  <RedditResultList
                    posts={getSortedPosts()}
                    keyword={keyword}
                    pagination={pagination}
                    page={page}
                    setPage={(newPage) => handleSearch(keyword, newPage, {}, true)}
                    allPosts={allPosts}
                    selectedDomain={selectedDomain}
                  />
                </>
              )}
            </>
          )}
        </main>

        <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '20px 0', textAlign: 'center', marginTop: 'auto', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            PulseRed AI Social Intelligence Suite • Admin Approved Access & Single Session Protected
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
