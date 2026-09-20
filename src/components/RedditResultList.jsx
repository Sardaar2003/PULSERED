import React, { useState } from 'react';
import { ExternalLink, Bookmark, ArrowUp, MessageSquare, Download, ChevronLeft, ChevronRight, Smile, Meh, Frown, Sparkles, LayoutGrid, Table as TableIcon, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RecordInspectorModal } from './RecordInspectorModal';
import confetti from 'canvas-confetti';

export const RedditResultList = ({ posts, keyword, pagination, page, setPage, allPosts, selectedDomain }) => {
  const { savedPosts, toggleSavePost } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const activeDomainName = selectedDomain || 'AlertCareLine.com';

  if (!posts || posts.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          No Reddit results found for your search term. Try searching for another topic above!
        </p>
      </div>
    );
  }

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      // ignore
    }
  };

  const exportData = allPosts && allPosts.length ? allPosts : posts;

  const handleExportCSV = () => {
    const headers = ['ID', 'Domain', 'WatcherKeyword', 'Title', 'Subreddit', 'Author', 'Score', 'NumComments', 'Sentiment', 'URL'];
    const rows = exportData.map((p) => [
      `"${p.id}"`,
      `"${activeDomainName.replace(/"/g, '""')}"`,
      `"${keyword.replace(/"/g, '""')}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.subreddit}"`,
      `"${p.author}"`,
      p.score,
      p.numComments,
      `"${p.sentiment}"`,
      `"${p.url}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pulsered_reddit_${keyword.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerConfetti();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `pulsered_reddit_${keyword.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerConfetti();
  };

  const { totalPosts = posts.length, totalPages = 1 } = pagination || {};

  return (
    <div style={{ marginBottom: '40px' }}>
      {/* Header with View Toggle & Export Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
            Extracted Records ({totalPosts} Total Found)
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Domain: <strong style={{ color: 'var(--accent-primary)' }}>{activeDomainName}</strong> | Click any record or "Why Chosen?" to inspect Prowlo selection logic.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Switcher Toggle */}
          <div style={{ display: 'flex', background: 'var(--card-inner-bg)', padding: '3px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '11px',
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '11px',
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <TableIcon size={14} /> Data Table
            </button>
          </div>

          <button onClick={handleExportCSV} className="glass-button-secondary" style={{ borderRadius: '14px', padding: '6px 14px' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={handleExportJSON} className="glass-button-secondary" style={{ borderRadius: '14px', padding: '6px 14px' }}>
            <Download size={14} /> JSON
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: CARDS FEED */}
      {viewMode === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {posts.map((post) => {
            const isSaved = savedPosts.some((sp) => sp.postId === post.id);

            return (
              <div
                key={post.id}
                className="glass-card glass-card-interactive animate-fade-in"
                style={{ padding: '22px', cursor: 'pointer' }}
                onClick={() => setSelectedPost(post)}
              >
                {/* Card Meta Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#818cf8',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {post.subreddit}
                    </span>

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Domain: <strong style={{ color: 'var(--text-secondary)' }}>{activeDomainName}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Why Chosen Inspector Badge */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPost(post);
                      }}
                      style={{
                        background: 'rgba(129, 140, 248, 0.15)',
                        border: '1px solid rgba(129, 140, 248, 0.35)',
                        color: '#818cf8',
                        borderRadius: '14px',
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Sparkles size={13} /> Why Chosen?
                    </button>

                    {/* Sentiment Badge */}
                    {post.sentiment === 'Positive' && (
                      <span className="badge-sentiment-positive">
                        <Smile size={12} /> Positive
                      </span>
                    )}
                    {post.sentiment === 'Neutral' && (
                      <span className="badge-sentiment-neutral">
                        <Meh size={12} /> Neutral
                      </span>
                    )}
                    {post.sentiment === 'Negative' && (
                      <span className="badge-sentiment-negative">
                        <Frown size={12} /> Negative
                      </span>
                    )}

                    {/* Bookmark Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSavePost(post);
                      }}
                      style={{
                        background: isSaved ? 'rgba(168, 85, 247, 0.25)' : 'var(--card-inner-bg)',
                        border: isSaved ? '1px solid #a855f7' : '1px solid var(--glass-border)',
                        color: isSaved ? '#a855f7' : 'var(--text-secondary)',
                        borderRadius: '14px',
                        padding: '5px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                      }}
                      title={isSaved ? 'Bookmarked' : 'Save post'}
                    >
                      <Bookmark size={14} fill={isSaved ? '#a855f7' : 'none'} />
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{post.title}</span>
                </h4>

                {/* Body Text / Excerpt */}
                {post.selftext && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '14px' }}>
                    {post.selftext}
                  </p>
                )}

                {/* Footer Engagement Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '700', color: '#4ade80' }}>
                      <ArrowUp size={16} />
                      {post.score ? post.score.toLocaleString() : 0} upvotes
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <MessageSquare size={15} />
                      {post.numComments || 0} comments
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                    }}
                    className="glass-button-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '14px' }}
                  >
                    Inspect Rationale <Info size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: TABULAR DIRECTORY VIEW */}
      {viewMode === 'table' && (
        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', overflowX: 'auto', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>Domain</th>
                <th style={{ padding: '12px 14px' }}>Watcher Term</th>
                <th style={{ padding: '12px 14px' }}>Subreddit</th>
                <th style={{ padding: '12px 14px', minWidth: '220px' }}>Thread Title</th>
                <th style={{ padding: '12px 14px' }}>Upvotes</th>
                <th style={{ padding: '12px 14px' }}>Comments</th>
                <th style={{ padding: '12px 14px' }}>Sentiment</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Intelligence Rationale</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const isSaved = savedPosts.some((sp) => sp.postId === post.id);

                return (
                  <tr
                    key={post.id}
                    style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s ease', cursor: 'pointer' }}
                    onClick={() => setSelectedPost(post)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-inner-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                      {activeDomainName}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                      <span style={{ background: 'var(--card-inner-bg)', border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.78rem' }}>
                        {keyword}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontWeight: '700', color: '#818cf8' }}>
                      {post.subreddit}
                    </td>
                    <td style={{ padding: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {post.title}
                    </td>
                    <td style={{ padding: '14px', fontWeight: '700', color: '#4ade80' }}>
                      {post.score ? post.score.toLocaleString() : 0}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                      {post.numComments || 0}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span
                        style={{
                          fontWeight: '700',
                          fontSize: '0.75rem',
                          color: post.sentiment === 'Positive' ? '#4ade80' : post.sentiment === 'Negative' ? '#f87171' : '#fbbf24',
                          background: post.sentiment === 'Positive' ? 'rgba(74,222,128,0.15)' : post.sentiment === 'Negative' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                          padding: '3px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        {post.sentiment}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPost(post);
                        }}
                        style={{
                          background: 'var(--accent-gradient)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '6px 14px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                        }}
                      >
                        <Sparkles size={13} /> Why Chosen?
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar Controls */}
      {totalPages > 1 && (
        <div
          className="glass-card"
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="glass-button-secondary"
              style={{ padding: '6px 12px', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: 'none',
                  background: page === pageNum ? 'var(--accent-gradient)' : 'var(--card-inner-bg)',
                  color: page === pageNum ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: page === pageNum ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
                }}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="glass-button-secondary"
              style={{ padding: '6px 12px', opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Record Inspector Modal */}
      {selectedPost && (
        <RecordInspectorModal
          post={selectedPost}
          searchKeyword={keyword}
          domainName={activeDomainName}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

