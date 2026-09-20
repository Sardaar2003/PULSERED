import React, { useEffect } from 'react';
import { X, ShieldCheck, UserCheck, UserX, Clock, Users, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminUsersModal = ({ isOpen, onClose }) => {
  const { adminUsers, fetchAdminUsers, approveUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchAdminUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingUsers = adminUsers.filter((u) => !u.isApproved);
  const approvedUsers = adminUsers.filter((u) => u.isApproved);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card animate-fade-in"
        style={{ width: '100%', maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="#818cf8" />
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Admin User Approval Management</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Review and approve access for newly registered platform members
              </p>
            </div>
          </div>

          <button onClick={onClose} className="glass-button-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* List Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pending Approval Section */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Clock size={16} /> Pending Approvals ({pendingUsers.length})
            </h4>

            {pendingUsers.length === 0 ? (
              <div style={{ background: 'var(--card-inner-bg)', borderRadius: '10px', padding: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No pending registration requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingUsers.map((user) => (
                  <div
                    key={user.id || user._id}
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{user.name}</span>
                        <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: '#000', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>
                          Pending Approval
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{user.email}</p>
                    </div>

                    <button
                      onClick={() => approveUser(user.id || user._id, true)}
                      className="glass-button"
                      style={{ padding: '6px 16px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                    >
                      <UserCheck size={14} /> Approve Access
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Users Section */}
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Users size={16} /> Active Approved Members ({approvedUsers.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {approvedUsers.map((user) => (
                <div
                  key={user.id || user._id}
                  style={{
                    background: 'var(--card-inner-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{user.name}</span>
                      {user.role === 'admin' ? (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(129, 140, 248, 0.2)', color: '#818cf8', border: '1px solid #818cf8', padding: '2px 6px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Crown size={10} /> Admin
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '2px 6px', borderRadius: '6px', fontWeight: '600' }}>
                          Approved User
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{user.email}</p>
                  </div>

                  {user.role !== 'admin' && (
                    <button
                      onClick={() => approveUser(user.id || user._id, false)}
                      className="glass-button-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#f87171' }}
                    >
                      <UserX size={14} /> Revoke Access
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
