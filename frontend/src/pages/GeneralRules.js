import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const CAT_COLORS = {
  ইবাদত: '#c9a84c',
  সুন্নাহ: '#52b788',
  চরিত্র: '#60a5fa',
  জীবনধারা: '#f472b6',
  স্বাস্থ্য: '#34d399',
  অর্থ: '#fbbf24',
  সম্পর্ক: '#a78bfa',
  আত্মশুদ্ধি: '#f87171',
  আদব: '#2dd4bf',
  'ইলম ও দাওয়াহ': '#818cf8',
  'শুকর ও তাওয়াক্কুল': '#fb923c',
  পরিবার: '#e879f9',
  'সমাজ ও উম্মাহ': '#38bdf8',
  সাধারণ: '#94a3b8',
};

const STATUS_CFG = {
  completed: {
    icon: '✅',
    label: 'Completed',
    color: '#52b788',
    bg: 'rgba(82,183,136,0.12)',
  },
  pending: { icon: '⬜', label: 'Pending', color: '#94a3b8', bg: 'var(--bg3)' },
  incompleted: {
    icon: '❌',
    label: 'Incompleted',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
  },
};

export function calcGeneralRulePoints(
  amalSubtotal,
  completedCount,
  uncompletedCount,
  totalRules,
) {
  const remaining = Math.max(0, 100 - amalSubtotal);
  if (!totalRules) return 0;
  const net = Math.max(0, completedCount - uncompletedCount);
  return Math.round(net * (remaining / totalRules) * 100) / 100;
}

export let TOTAL_RULES = 0;

export default function GeneralRules() {
  const [rules, setRules] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('সব');
  const [statusFilter, setStatusFilter] = useState('সব');
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ text: '', category: 'সাধারণ' });
  const [showHeader, setShowHeader] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handle = () => {
      const cur = window.scrollY;
      if (cur < lastScrollY.current) {
        setShowHeader(true);
        setShowScrollTop(false);
      } else if (cur > lastScrollY.current + 5) {
        setShowHeader(false);
        setShowScrollTop(cur > 200);
      }
      lastScrollY.current = cur;
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/general-rules');
      setRules(data.rules || []);
      setStatusMap(data.statusMap || {});
      TOTAL_RULES = (data.rules || []).length;
    } catch {
      toast.error('লোড ব্যর্থ');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completed = Object.values(statusMap).filter(
    (v) => v === 'completed',
  ).length;
  const incompleted = Object.values(statusMap).filter(
    (v) => v === 'incompleted',
  ).length;
  const pending = rules.length - completed - incompleted;
  const pct = rules.length ? Math.round((completed / rules.length) * 100) : 0;

  const cats = useMemo(
    () => ['সব', ...Array.from(new Set(rules.map((r) => r.category)))],
    [rules],
  );

  const filtered = useMemo(
    () =>
      rules.filter((r) => {
        if (cat !== 'সব' && r.category !== cat) return false;
        if (search && !r.text.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (statusFilter !== 'সব') {
          const s = statusMap[r._id] || 'pending';
          if (s !== statusFilter) return false;
        }
        return true;
      }),
    [rules, cat, search, statusFilter, statusMap],
  );

  const setStatus = useCallback(
    async (rule, targetStatus) => {
      const current = statusMap[rule._id] || 'pending';
      const next = current === targetStatus ? 'pending' : targetStatus;
      const prev = { ...statusMap };
      setStatusMap((s) => ({ ...s, [rule._id]: next }));
      setSaving(true);
      try {
        const { data } = await API.put(`/general-rules/status/${rule._id}`, {
          status: next,
        });
        setStatusMap(data.statusMap);
        // ✅ Tracker.jsx কে signal দাও — live score update হবে
        localStorage.setItem('gr_status_changed', Date.now().toString());
      } catch {
        setStatusMap(prev);
        toast.error('আপডেট ব্যর্থ');
      }
      setSaving(false);
    },
    [statusMap],
  );

  const handleResetStatuses = async () => {
    if (!window.confirm('সব স্ট্যাটাস রিসেট করবেন?')) return;
    try {
      const { data } = await API.delete('/general-rules/status/reset');
      setStatusMap(data.statusMap);
      // ✅ Reset হলেও Tracker কে জানাও
      localStorage.setItem('gr_status_changed', Date.now().toString());
      toast.success('রিসেট হয়েছে');
    } catch {
      toast.error('রিসেট ব্যর্থ');
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('ডিফল্ট নিয়মগুলো যোগ করবেন?')) return;
    try {
      const { data } = await API.post('/general-rules/seed');
      setRules(data.rules);
      TOTAL_RULES = data.rules.length;
      // ✅ Seed হলেও Tracker কে জানাও
      localStorage.setItem('gr_status_changed', Date.now().toString());
      toast.success(`${data.added}টি নিয়ম যোগ হয়েছে!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Seed ব্যর্থ');
    }
  };

  const openAdd = () => {
    setEditRule(null);
    setForm({ text: '', category: 'সাধারণ' });
    setShowModal(true);
  };
  const openEdit = (r) => {
    setEditRule(r);
    setForm({ text: r.text, category: r.category });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return toast.error('নিয়মের বিবরণ লিখুন।');
    try {
      if (editRule) {
        const { data } = await API.put(`/general-rules/${editRule._id}`, form);
        setRules((prev) =>
          prev.map((r) => (r._id === editRule._id ? data : r)),
        );
        toast.success('আপডেট হয়েছে!');
      } else {
        const { data } = await API.post('/general-rules', form);
        setRules((prev) => [...prev, data]);
        TOTAL_RULES = rules.length + 1;
        toast.success('নিয়ম যোগ হয়েছে!');
      }
      // ✅ Rule add/edit হলেও Tracker কে জানাও
      localStorage.setItem('gr_status_changed', Date.now().toString());
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/general-rules/${deleteId}`);
      setRules((prev) => {
        const n = prev.filter((r) => r._id !== deleteId);
        TOTAL_RULES = n.length;
        return n;
      });
      // ✅ Delete হলেও Tracker কে জানাও
      localStorage.setItem('gr_status_changed', Date.now().toString());
      toast.success('মুছে গেছে!');
    } catch {
      toast.error('Delete ব্যর্থ');
    }
    setDeleteId(null);
  };

  const previewAmal = 70;
  const previewPts = calcGeneralRulePoints(
    previewAmal,
    completed,
    incompleted,
    rules.length,
  );
  const remaining70 = Math.max(0, 100 - previewAmal);
  const perRule =
    rules.length > 0
      ? Math.round((remaining70 / rules.length) * 1000) / 1000
      : 0;

  if (loading)
    return (
      <div className="loading-overlay">
        <div className="spinner" /> লোড হচ্ছে...
      </div>
    );

  return (
    <div>
      <style>{`
        .gr-sticky {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg);
          padding-bottom: 8px;
        }
        .gr-scroll-top {
          position: fixed;
          bottom: 80px;
          right: 18px;
          z-index: 998;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--gold);
          color: var(--bg);
          border: none;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .gr-scroll-top.show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .gr-scroll-top.hide {
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none;
        }
        .status-radio-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .status-radio-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1.5px solid;
          cursor: pointer;
          font-size: 12px;
          font-family: var(--font-dm);
          transition: all .15s;
          background: transparent;
          white-space: nowrap;
        }
        .status-radio-btn .radio-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all .15s;
        }
        .status-radio-btn .radio-dot.filled::after {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          display: block;
        }
        @media (max-width: 480px) {
          .status-radio-btn { padding: 3px 8px; font-size: 11px; }
          .gr-scroll-top { bottom: 70px; right: 14px; width: 38px; height: 38px; font-size: 16px; }
        }
      `}</style>

      {/* ── Scroll to top button ── */}
      <button
        className={`gr-scroll-top ${showScrollTop ? 'show' : 'hide'}`}
        onClick={scrollToTop}
        title="উপরে যাও"
      >
        ↑
      </button>

      {/* ── Sticky Header ── */}
      <div className="gr-sticky">
        <div
          className="page-header"
          style={{ marginBottom: 10, paddingBottom: 10 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <h1>📜 General Rules / সাধারণ নিয়ম</h1>
              <p>{rules.length} টি নিয়ম</p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {saving && (
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>⏳</span>
              )}
              <button className="btn btn-ghost btn-sm" onClick={handleSeed}>
                🌱 Seed
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResetStatuses}
              >
                ↺ রিসেট
              </button>
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                ＋ নিয়ম যোগ
              </button>
            </div>
          </div>
        </div>

        {/* Status filter */}
        <div
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}
        >
          {[
            {
              key: 'সব',
              label: 'All',
              color: 'var(--text2)',
              count: rules.length,
            },
            {
              key: 'completed',
              label: '✅ Completed',
              color: '#52b788',
              count: completed,
            },
            {
              key: 'pending',
              label: '⬜ Pending',
              color: '#94a3b8',
              count: pending,
            },
            {
              key: 'incompleted',
              label: '❌ Incompleted',
              color: '#f87171',
              count: incompleted,
            },
          ].map((s) => {
            const isActive = statusFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() =>
                  setStatusFilter(isActive && s.key !== 'সব' ? 'সব' : s.key)
                }
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  cursor: 'pointer',
                  border: `1px solid ${isActive ? s.color : 'var(--border)'}`,
                  background: isActive ? `${s.color}22` : 'transparent',
                  color: isActive ? s.color : 'var(--text2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {s.label}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: isActive ? `${s.color}33` : 'var(--bg3)',
                    padding: '1px 6px',
                    borderRadius: 10,
                    color: isActive ? s.color : 'var(--text3)',
                  }}
                >
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>
        {/* Category filter */}
        <div
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}
        >
          {cats.map((c) => {
            const col = CAT_COLORS[c] || '#94a3b8';
            const isActive = cat === c;
            return (
              <button
                key={c}
                onClick={() => setCat(isActive && c !== 'সব' ? 'সব' : c)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  cursor: 'pointer',
                  border: `1px solid ${isActive ? col : 'var(--border)'}`,
                  background: isActive ? `${col}22` : 'transparent',
                  color: isActive ? col : 'var(--text2)',
                  fontFamily: 'var(--font-bengali)',
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 নিয়ম খুঁজুন..."
          style={{ marginBottom: 7, background: 'var(--bg3)' }}
        />
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6 }}>
          {filtered.length} টি
        </div>
      </div>

      {/* ── Rules List ── */}
      {rules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <p>কোনো নিয়ম নেই।</p>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              marginTop: 14,
            }}
          >
            <button className="btn btn-primary" onClick={handleSeed}>
              🌱 ডিফল্ট নিয়ম যোগ
            </button>
            <button className="btn btn-ghost" onClick={openAdd}>
              ＋ নিজে লিখুন
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>কোনো নিয়ম পাওয়া যায়নি</p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
            paddingBottom: 24,
          }}
        >
          {filtered.map((r, idx) => {
            const status = statusMap[r._id] || 'pending';
            const catColor = CAT_COLORS[r.category] || '#94a3b8';
            const isDone = status === 'completed';
            const isInc = status === 'incompleted';

            return (
              <div
                key={r._id}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  transition: 'all .2s',
                  border: `1px solid ${isDone ? 'rgba(82,183,136,0.35)' : isInc ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
                  background: isDone
                    ? 'rgba(82,183,136,0.07)'
                    : isInc
                      ? 'rgba(248,113,113,0.06)'
                      : 'var(--bg2)',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        marginBottom: 5,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--text3)',
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <span
                        style={{
                          padding: '2px 9px',
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 600,
                          background: `${catColor}18`,
                          border: `1px solid ${catColor}40`,
                          color: catColor,
                          fontFamily: 'var(--font-bengali)',
                        }}
                      >
                        {r.category}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.75,
                        margin: 0,
                        fontFamily: 'var(--font-bengali)',
                        color: isDone
                          ? 'var(--green2)'
                          : isInc
                            ? 'var(--text3)'
                            : 'var(--text)',
                        textDecoration: isInc ? 'line-through' : 'none',
                        opacity: isInc ? 0.6 : 1,
                      }}
                    >
                      {r.text}
                    </p>

                    <div className="status-radio-group">
                      {['completed', 'pending', 'incompleted'].map((s) => {
                        const cfg = STATUS_CFG[s];
                        const isActive = status === s;
                        return (
                          <button
                            key={s}
                            className="status-radio-btn"
                            onClick={() => setStatus(r, s)}
                            style={{
                              borderColor: isActive
                                ? cfg.color
                                : 'var(--border)',
                              color: isActive ? cfg.color : 'var(--text3)',
                              background: isActive ? cfg.bg : 'transparent',
                            }}
                          >
                            <span
                              className={`radio-dot${isActive ? ' filled' : ''}`}
                            />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button className="btn btn-xs" onClick={() => openEdit(r)}>
                      ✏️
                    </button>
                    <button
                      className="btn btn-danger btn-xs"
                      onClick={() => setDeleteId(r._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: 480 }}>
            <h2 className="modal-title">
              {editRule ? '✏️ নিয়ম সম্পাদনা' : '＋ নতুন নিয়ম'}
            </h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>নিয়মের বিবরণ *</label>
                <textarea
                  required
                  rows={3}
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="নিয়মটি বাংলায় লিখুন..."
                />
              </div>
              <div className="form-group">
                <label>ক্যাটেগরি</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="যেমন: ইবাদত, চরিত্র, স্বাস্থ্য..."
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text3)',
                  marginBottom: 12,
                }}
              >
                মোট নিয়ম: {rules.length}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360 }}>
            <h2 className="modal-title">⚠️ নিয়ম মুছবেন?</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 20 }}>
              এই নিয়মটি স্থায়ীভাবে মুছে যাবে।
            </p>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteId(null)}
              >
                বাতিল
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
