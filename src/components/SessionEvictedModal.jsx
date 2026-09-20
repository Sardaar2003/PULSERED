import React from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SessionEvictedModal = () => {
  const { sessionEvicted, setSessionEvicted } = useAuth();

  if (!sessionEvicted) return null;

  return (
    <div className="modal-overlay">
      <div
        className="glass-card animate-fade-in"
        style={{ width: '100%', maxWidth: '440px', padding: '32px', textAlign: 'center' }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '10px' }}>
          Session Terminated
        </h3>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
          Your active session was automatically ended because your account was logged in from another device, browser, or tab.
        </p>

        <button
          onClick={() => setSessionEvicted(false)}
          className="glass-button"
          style={{ width: '100%', height: '46px' }}
        >
          <LogIn size={18} />
          Return to Sign In
        </button>
      </div>
    </div>
  );
};
