import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Search,
  ExternalLink,
  Trash2,
  Flame,
  MessageSquare,
  Filter,
  Sparkles,
  ArrowUpRight,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CustomSelect } from './CustomSelect';

export const SavedThreadsView = ({ onGoToWorkspace }) => {
  const { savedPosts, toggleSavePost } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubreddit, setSelectedSubreddit] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'score' | 'comments'
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Extract unique subreddits
  const uniqueSubreddits = useMemo(() => {
    const subs = new Set();
    savedPosts.forEach((p) => {
      if (p.subreddit) subs.add(p.subreddit.replace(/^r\//, ''));
    });
    return Array.from(subs);
  }, [savedPosts]);

  // Filter and sort
  const filteredPosts = useMemo(() => {
    let list = [...savedPosts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.subreddit && p.subreddit.toLowerCase().includes(q)) ||
          (p.author && p.author.toLowerCase().includes(q))
      );
    }

    if (selectedSubreddit !== 'all') {
      list = list.filter(
        (p) => p.subreddit && p.subreddit.replace(/^r\//, '').toLowerCase() === selectedSubreddit.toLowerCase()
      );
    }

    if (sortBy === 'score') {
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === 'comments') {
      list.sort((a, b) => (b.numComments || 0) - (a.numComments || 0));
    } else {
      // 'newest' default
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [savedPosts, searchQuery, selectedSubreddit, sortBy]);

  const handleRemove = async (post) => {
    const id = post.postId || post.id;
    await toggleSavePost({ id });
    showToast('🗑️ Thread removed from Saved Threads');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--accent-primary)',
            color: 'var(--text-primary)',
            padding: '12px 20px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            zIndex: 1000,
            fontSize: '0.88rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={16} color="var(--accent-primary)" />
          {toastMsg}
        </div>
      )}

      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '28px', borderRadius: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(168, 85, 247, 0.35)',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <Bookmark size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Saved Reddit Threads
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                  }}
                >
                  {savedPosts.length} Threads Stored
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
                Organize, review, and follow up with bookmarked buyer discussions and high-interest prospect posts.
              </p>
            </div>
          </div>

          {onGoToWorkspace && (
            <button
              onClick={onGoToWorkspace}
              className="glass-button"
              style={{ borderRadius: '14px', padding: '10px 18px', gap: '8px' }}
            >
              <Compass size={16} /> Explore Workspace Leads
            </button>
          )}
        </div>

        {/* Quick Stats Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'var(--card-inner-bg)', borderRadius: '16px', padding: '16px 20px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Total Bookmarks</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
              {savedPosts.length}
            </div>
          </div>

          <div style={{ background: 'var(--card-inner-bg)', borderRadius: '16px', padding: '16px 20px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Target Subreddits</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#a855f7', marginTop: '4px' }}>
              {uniqueSubreddits.length}
            </div>
          </div>

          <div style={{ background: 'var(--card-inner-bg)', borderRadius: '16px', padding: '16px 20px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Filtered Results</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>
              {filteredPosts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '18px 24px',
          borderRadius: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Search Input */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search saved threads by title, subreddit, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input"
            style={{ width: '100%', paddingLeft: '40px', paddingRight: '14px', height: '42px', borderRadius: '22px', fontSize: '0.85rem' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ width: '180px' }}>
            <CustomSelect
              value={selectedSubreddit}
              onChange={(val) => setSelectedSubreddit(val)}
              options={[
                { value: 'all', label: 'All Subreddits' },
                ...uniqueSubreddits.map((sub) => ({ value: sub, label: `r/${sub}` })),
              ]}
              placeholder="Filter Subreddit"
            />
          </div>

          <div style={{ width: '160px' }}>
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'newest', label: 'Most Recent' },
                { value: 'score', label: 'Highest Upvotes' },
                { value: 'comments', label: 'Most Comments' },
              ]}
              placeholder="Sort By"
            />
          </div>
        </div>
      </div>

      {/* Saved Threads Grid */}
      {savedPosts.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            borderRadius: '24px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#c084fc',
            }}
          >
            <Bookmark size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            No Saved Threads Yet
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '440px', margin: '8px auto 24px auto' }}>
            Click the "Save" or "Bookmark" button on any discussion in your Workspace to keep track of valuable buyer conversations here.
          </p>
          {onGoToWorkspace && (
            <button onClick={onGoToWorkspace} className="glass-button" style={{ borderRadius: '16px', padding: '10px 24px' }}>
              <Compass size={16} /> Go to Workspace
            </button>
          )}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '50px 24px',
            borderRadius: '24px',
          }}
        >
          <Search size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            No Threads Match Your Filter
          </h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: '18px' }}>
            Try clearing your search query or switching to "All Subreddits".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSubreddit('all');
            }}
            className="glass-button-secondary"
            style={{ borderRadius: '14px', padding: '8px 18px' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredPosts.map((post) => {
            const postId = post.postId || post.id;
            const fullUrl = post.permalink?.startsWith('http')
              ? post.permalink
              : `https://reddit.com${post.permalink || ''}`;

            return (
              <div
                key={postId}
                className="glass-card animate-fade-in"
                style={{
                  padding: '20px',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  border: '1px solid var(--glass-border)',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  {/* Top Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        color: '#818cf8',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        padding: '3px 10px',
                        borderRadius: '12px',
                      }}
                    >
                      {post.subreddit?.startsWith('r/') ? post.subreddit : `r/${post.subreddit || 'reddit'}`}
                    </span>

                    {post.author && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        u/{post.author}
                      </span>
                    )}
                  </div>

                  {/* Title Link */}
                  <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '10px' }}>
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    >
                      {post.title}
                    </a>
                  </h4>

                  {/* Telemetry Metrics */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      color: 'var(--text-secondary)',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: 'var(--card-inner-bg)',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                      <Flame size={13} /> {post.score?.toLocaleString() || 0} Upvotes
                    </span>
                    <span style={{ color: 'var(--glass-border)' }}>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
                      <MessageSquare size={13} /> {post.numComments?.toLocaleString() || 0} Comments
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    type="button"
                    onClick={() => handleRemove(post)}
                    className="glass-button-secondary"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      color: '#f87171',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      justifyContent: 'center',
                    }}
                    title="Remove from Saved Threads"
                  >
                    <Trash2 size={13} /> Remove
                  </button>

                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    Open Thread <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
