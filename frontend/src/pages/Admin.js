import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Admin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);

  // ✅ Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState(null);
  // confirmModal = { type: 'delete' | 'ban' | 'unban', user: {...} }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (err) {
      toast.error('Admin API not configured yet.');
      setUsers([]);
    }
    setLoading(false);
  };

  // ✅ Ask confirmation via modal
  const askConfirm = (type, user) => {
    setConfirmModal({ type, user });
  };

  // ✅ Execute confirmed action
  const handleConfirm = async () => {
    if (!confirmModal) return;
    const { type, user } = confirmModal;
    setConfirmModal(null);

    try {
      if (type === 'delete') {
        await API.delete(`/admin/users/${user._id}`);
        toast.success(`"${user.name}" মুছে ফেলা হয়েছে।`);
      } else if (type === 'ban') {
        await API.patch(`/admin/users/${user._id}`, { banned: true });
        toast.success('🚫 ব্যবহারকারী ব্যান করা হয়েছে');
      } else if (type === 'unban') {
        await API.patch(`/admin/users/${user._id}`, { banned: false });
        toast.success('✅ ব্যান তুলে নেওয়া হয়েছে');
      }
      fetchUsers();
    } catch {
      toast.error('ব্যর্থ হয়েছে');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Modal config by type ──────────────────────────────
  const modalCfg = confirmModal
    ? {
        delete: {
          title: '🗑️ User Delete করবেন?',
          body: (
            <>
              <p
                style={{
                  color: 'var(--text2)',
                  marginBottom: 10,
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: 'var(--text)' }}>
                  "{confirmModal.user.name}"
                </strong>{' '}
                এবং তার সমস্ত ডেটা স্থায়ীভাবে মুছে যাবে:
              </p>
              <div
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 10,
                }}
              >
                {[
                  'সকল আমল রেকর্ড',
                  'সকল General Rules',
                  'Rule Statuses',
                  'User Account',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      fontSize: 12,
                      color: '#f87171',
                      display: 'flex',
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    <span>🗑️</span> {item}
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: '#f87171',
                  fontFamily: 'var(--font-bengali)',
                }}
              >
                ⚠️ এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না!
              </p>
            </>
          ),
          confirmLabel: '🗑️ সব মুছুন',
          confirmClass: 'btn btn-danger',
        },
        ban: {
          title: '🚫 User ব্যান করবেন?',
          body: (
            <>
              <p
                style={{
                  color: 'var(--text2)',
                  marginBottom: 10,
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: 'var(--text)' }}>
                  "{confirmModal.user.name}"
                </strong>{' '}
                কে ব্যান করলে তিনি আর login করতে পারবেন না।
              </p>
              <div
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: 8,
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: 12, color: '#f87171' }}>
                  📧 {confirmModal.user.email}
                </div>
              </div>
            </>
          ),
          confirmLabel: '🚫 ব্যান করুন',
          confirmClass: 'btn btn-danger',
        },
        unban: {
          title: '✅ ব্যান তুলবেন?',
          body: (
            <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>
                "{confirmModal.user.name}"
              </strong>{' '}
              এর ব্যান তুলে নিলে তিনি আবার login করতে পারবেন।
            </p>
          ),
          confirmLabel: '✅ ব্যান তুলুন',
          confirmClass: 'btn btn-primary',
        },
      }[confirmModal.type]
    : null;

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <h1>🛡️ Admin Panel / অ্যাডমিন প্যানেল</h1>
          <p>ব্যবহারকারী পরিচালনা — শুধুমাত্র অ্যাডমিনের জন্য</p>
        </div>
        <span
          className="admin-badge"
          style={{ alignSelf: 'flex-start', padding: '5px 12px', fontSize: 11 }}
        >
          🛡️ {me?.name} — Admin
        </span>
      </div>

      {/* Stats cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card gold">
          <div className="stat-label">মোট ব্যবহারকারী / Total Users</div>
          <div className="stat-value">{stats?.totalUsers ?? users.length}</div>
          <div className="stat-sub">registered accounts</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">সক্রিয় / Active Users</div>
          <div className="stat-value">
            {stats?.activeUsers ?? users.filter((u) => !u.banned).length}
          </div>
          <div className="stat-sub">not banned</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">ব্যান / Banned Users</div>
          <div className="stat-value">
            {stats?.bannedUsers ?? users.filter((u) => u.banned).length}
          </div>
          <div className="stat-sub">restricted access</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">অ্যাডমিন / Admins</div>
          <div className="stat-value">
            {stats?.adminCount ?? users.filter((u) => u.isAdmin).length}
          </div>
          <div className="stat-sub">admin accounts</div>
        </div>
      </div>

      {/* Search */}
      <div className="filter-bar" style={{ marginBottom: 14 }}>
        <div
          className="form-group"
          style={{ margin: 0, flex: 1, maxWidth: 320 }}
        >
          <label>🔍 ব্যবহারকারী খুঁজুন / Search Users</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম বা ইমেইল..."
          />
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={fetchUsers}
          style={{ alignSelf: 'flex-end' }}
        >
          ↺ রিফ্রেশ
        </button>
      </div>

      {/* Users table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-overlay">
            <div className="spinner" /> লোড হচ্ছে...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>কোনো ব্যবহারকারী পাওয়া যায়নি</p>
            <p
              style={{
                fontSize: 11,
                color: 'var(--text3)',
                marginTop: 8,
                fontFamily: 'var(--font-dm)',
              }}
            >
              Backend-এ Admin API routes যোগ করতে হবে।
              <br />
              See:{' '}
              <code
                style={{
                  background: 'var(--bg3)',
                  padding: '2px 5px',
                  borderRadius: 4,
                }}
              >
                /api/admin/users
              </code>
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>নাম / Name</th>
                  <th>ইমেইল / Email</th>
                  <th>ভূমিকা / Role</th>
                  <th>স্ট্যাটাস / Status</th>
                  <th>যোগদান / Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u._id}>
                    <td style={{ color: 'var(--text3)', fontSize: 10 }}>
                      {i + 1}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background:
                              'linear-gradient(135deg,var(--gold-dim),var(--gold))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            color: 'var(--bg)',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--text)',
                            fontSize: 13,
                          }}
                        >
                          {u.name}
                        </span>
                        {u._id === me?._id && (
                          <span
                            style={{
                              fontSize: 9,
                              background: 'rgba(82,183,136,0.15)',
                              color: 'var(--green2)',
                              border: '1px solid rgba(82,183,136,0.3)',
                              padding: '1px 5px',
                              borderRadius: 10,
                              fontFamily: 'var(--font-dm)',
                            }}
                          >
                            আপনি
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        color: 'var(--text2)',
                        fontSize: 12,
                        fontFamily: 'var(--font-dm)',
                      }}
                    >
                      {u.email}
                    </td>
                    <td>
                      {u.isAdmin ? (
                        <span className="admin-badge">🛡️ Admin</span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text3)',
                            fontFamily: 'var(--font-dm)',
                          }}
                        >
                          User
                        </span>
                      )}
                    </td>
                    <td>
                      {u.banned ? (
                        <span className="banned-badge">🚫 ব্যান</span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--green2)',
                            fontFamily: 'var(--font-dm)',
                          }}
                        >
                          ✅ সক্রিয়
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        fontSize: 11,
                        color: 'var(--text3)',
                        fontFamily: 'var(--font-dm)',
                      }}
                    >
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-GB')
                        : '—'}
                    </td>
                    <td>
                      {u._id !== me?._id && !u.isAdmin && (
                        <div style={{ display: 'flex', gap: 5 }}>
                          {/* ✅ Ban/Unban — custom modal */}
                          <button
                            className={`btn btn-xs ${u.banned ? 'btn-ghost' : 'btn-danger'}`}
                            onClick={() =>
                              askConfirm(u.banned ? 'unban' : 'ban', u)
                            }
                          >
                            {u.banned ? '✅ আনব্যান' : '🚫 ব্যান'}
                          </button>
                          {/* ✅ Delete — custom modal */}
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => askConfirm('delete', u)}
                          >
                            🗑 ডিলেট
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ Custom Confirmation Modal */}
      {confirmModal && modalCfg && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmModal(null);
          }}
        >
          <div className="modal" style={{ maxWidth: 420 }}>
            <h2 className="modal-title">{modalCfg.title}</h2>
            <div style={{ marginBottom: 20 }}>{modalCfg.body}</div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmModal(null)}
              >
                বাতিল
              </button>
              <button className={modalCfg.confirmClass} onClick={handleConfirm}>
                {modalCfg.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
