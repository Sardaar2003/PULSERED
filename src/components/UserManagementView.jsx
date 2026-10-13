import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, UserX, Clock, Users, Crown, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const UserManagementView = () => {
  const { adminUsers, fetchAdminUsers, approveUser, deleteUser, user: currentUser } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState(null); // null or { userId, email }
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const pendingCount = adminUsers.filter((u) => !u.isApproved).length;
  const approvedCount = adminUsers.filter((u) => u.isApproved).length;

  const handleDelete = (userId, email) => {
    setDeleteTarget({ userId, email });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.userId);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ marginBottom: '40px' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 12px', borderRadius: '20px', color: '#818cf8', fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px' }}>
              <ShieldCheck size={14} /> MASTER ADMIN WORKSPACE
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2 }}>
              Platform Access Governance & Approvals
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
              Review registration requests, approve platform access, and manage user accounts.
            </p>
          </div>

          <button onClick={fetchAdminUsers} className="glass-button-secondary" style={{ borderRadius: '20px', gap: '8px' }}>
            <RefreshCw size={16} /> Refresh Directory
          </button>
        </div>

        {/* Quick Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'var(--card-inner-bg)', borderRadius: '16px', padding: '18px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Requests</span>
              <Clock size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '6px', color: pendingCount > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
              {pendingCount}
            </div>
          </div>

          <div style={{ background: 'var(--card-inner-bg)', borderRadius: '16px', padding: '18px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Approved Active Members</span>
              <UserCheck size={20} color="#4ade80" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '6px', color: '#4ade80' }}>
              {approvedCount}
            </div>
          </div>

          <div style={{ background: 'var(--card-inner-bg)', borderRadius: '16px', padding: '18px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Registered Accounts</span>
              <Users size={20} color="#818cf8" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '6px', color: 'var(--text-primary)' }}>
              {adminUsers.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>
            User Account Management Directory
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Changes apply instantly to live authentication sessions
          </span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--card-inner-bg)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '240px' }}>Member Name & Email</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '140px' }}>Role</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '170px' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '150px' }}>Registered Date</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right', minWidth: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No registered user accounts found.
                  </td>
                </tr>
              ) : (
                adminUsers.map((user) => {
                  const isMasterAdminAccount = user.email === 'admin@pulsered.com';
                  const userId = user.id || user._id;

                  return (
                    <tr
                      key={userId}
                      style={{
                        borderBottom: '1px solid var(--glass-border)',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: user.isApproved ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              border: user.isApproved ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
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
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        {user.role === 'admin' ? (
                          <span style={{ fontSize: '0.75rem', background: 'rgba(129, 140, 248, 0.2)', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.4)', padding: '5px 12px', borderRadius: '14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Crown size={13} /> Master Admin
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', background: 'var(--card-inner-bg)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', padding: '5px 12px', borderRadius: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center' }}>
                            Standard User
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        {user.isApproved ? (
                          <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)', padding: '5px 14px', borderRadius: '14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <UserCheck size={13} /> Approved
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '5px 14px', borderRadius: '14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={13} /> Pending Approval
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap', fontWeight: '600' }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isMasterAdminAccount ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: '600' }}>Fixed Master</span>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            {user.isApproved ? (
                              <button
                                onClick={() => approveUser(userId, false)}
                                className="glass-button-secondary"
                                style={{ padding: '7px 14px', fontSize: '0.8rem', color: '#f59e0b', borderRadius: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <UserX size={14} /> Revoke Access
                              </button>
                            ) : (
                              <button
                                onClick={() => approveUser(userId, true)}
                                className="glass-button"
                                style={{ padding: '7px 16px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', borderRadius: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <UserCheck size={14} /> Approve
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(userId, user.email)}
                              className="glass-button-secondary"
                              style={{ padding: '7px 14px', fontSize: '0.8rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              title="Delete Account"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Custom Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete User Account"
        itemName={deleteTarget?.email}
        message={`Are you sure you want to permanently delete user account "${deleteTarget?.email || ''}"? Access permissions will be immediately revoked and this action cannot be undone.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
