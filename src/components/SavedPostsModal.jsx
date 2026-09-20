import React from 'react';
import { X, Bookmark, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SavedPostsModal = ({ isOpen, onClose }) => {
  const { savedPosts, toggleSavePost } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card animate-fade-in"
        style={{ width: '100%', maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bookmark size={22} color="#a855f7" />
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Your Saved Reddit Threads</h3>
            <span style={{ fontSize: '0.8rem', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
              {savedPosts.length}
            </span>
          </div>

          <button onClick={onClose} className="glass-button-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* List Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {savedPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <p>You haven't bookmarked any Reddit threads yet.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Click the "Save" button on any post in your search results to keep track of it here.</p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <div
                key={post.id || post.postId}
                style={{
                  background: 'var(--card-inner-bg)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '700' }}>
                    {post.subreddit}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Saved by u/{post.author}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px' }}>
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {post.title}
                  </a>
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: '600' }}>
                    {post.score} upvotes • {post.numComments} comments
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleSavePost({ id: post.postId || post.id })}
                      className="glass-button-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#f87171' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>

                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Open <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
