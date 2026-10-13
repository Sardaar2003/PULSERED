import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export const ConfirmDeleteModal = ({
  isOpen,
  title = 'Confirm Deletion',
  itemName = '',
  message = '',
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 99999 }}>
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '28px',
          background: 'var(--card-inner-bg-solid, #0f172a)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon Button */}
        <button
          onClick={onCancel}
          className="glass-button-secondary"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '6px',
            borderRadius: '50%',
            color: 'var(--text-muted)',
            border: 'none',
          }}
        >
          <X size={18} />
        </button>

        {/* Warning Icon Badge */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px auto',
            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertTriangle size={30} />
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', textAlign: 'center', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {title}
        </h3>

        {/* Item Highlight & Description */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          {itemName && (
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: '0.85rem',
                fontWeight: '700',
                marginBottom: '10px',
              }}
            >
              "{itemName}"
            </div>
          )}
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {message || `Are you sure you want to permanently delete this item? This action cannot be undone.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="glass-button-secondary"
            style={{ flex: 1, padding: '11px', fontSize: '0.88rem', fontWeight: '700', borderRadius: '14px' }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="glass-button"
            style={{
              flex: 1,
              padding: '11px',
              fontSize: '0.88rem',
              fontWeight: '800',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 18px rgba(239, 68, 68, 0.4)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isDeleting ? (
              <>
                <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
