import React, { useState } from 'react';
import { useEditableList } from '../utils/useEditableList';

const DEFAULT_FORMULAS = [
  {
    id: 1,
    icon: '💰',
    title: 'Money Saving Formula',
    titleBn: 'অর্থ সাশ্রয় ফর্মুলা',
    arabic: 'وَلَا تُسْرِفُوا',
    desc: 'কোনো কিছু কেনার আগে এই ৪টি প্রশ্ন করুন',
    color: '#f59e0b',
    questions: [
      { id: 1, q: 'Do I really need this?', qBn: 'এটা কি আমার সত্যিই দরকার?' },
      {
        id: 2,
        q: 'Can I afford it without debt?',
        qBn: 'ধার ছাড়া কিনতে পারব?',
      },
      {
        id: 3,
        q: 'Is there a cheaper alternative?',
        qBn: 'সস্তায় বিকল্প আছে কি?',
      },
      { id: 4, q: 'Will I regret this purchase?', qBn: 'পরে কি অনুতাপ করব?' },
    ],
    tips: [
      {
        id: 1,
        icon: '📊',
        title: '৫০/৩০/২০ নিয়ম',
        body: 'আয়ের ৫০% প্রয়োজনে, ৩০% চাহিদায়, ২০% সঞ্চয়ে।',
      },
      {
        id: 2,
        icon: '🏦',
        title: 'আগে সঞ্চয়',
        body: 'বেতন পাওয়ার সাথে সাথে একটি নির্দিষ্ট অংশ সরিয়ে রাখুন।',
      },
    ],
  },
  {
    id: 2,
    icon: '⏰',
    title: 'Time Saving Formula',
    titleBn: 'সময় সাশ্রয় ফর্মুলা',
    arabic: 'وَالْعَصْرِ',
    desc: 'কোনো কাজ শুরু করার আগে এই ২টি প্রশ্ন করুন',
    color: '#38bdf8',
    questions: [
      {
        id: 1,
        q: 'Is this task really necessary?',
        qBn: 'এই কাজটি কি সত্যিই জরুরি?',
      },
      {
        id: 2,
        q: 'Is this the right time to do it?',
        qBn: 'এখনই কি করার সঠিক সময়?',
      },
    ],
    tips: [
      {
        id: 1,
        icon: '📅',
        title: 'সকালের রুটিন',
        body: 'ফজরের পর একটি নির্দিষ্ট রুটিন অনুসরণ করুন।',
      },
      {
        id: 2,
        icon: '⚡',
        title: 'পমোডোরো',
        body: '২৫ মিনিট কাজ, ৫ মিনিট বিরতি।',
      },
    ],
  },
  {
    id: 3,
    icon: '🤫',
    title: 'Reduce Speaking Formula',
    titleBn: 'কথা কমানোর ফর্মুলা',
    arabic: 'مَنْ صَمَتَ نَجَا',
    desc: 'কথা বলার আগে এই ৩টি প্রশ্ন করুন',
    color: '#a78bfa',
    questions: [
      { id: 1, q: 'Is it true?', qBn: 'এটা কি সত্য?' },
      { id: 2, q: 'Is it necessary?', qBn: 'এটা কি প্রয়োজনীয়?' },
      { id: 3, q: 'Is it kind?', qBn: 'এটা কি ভালো কিছু বলছি?' },
    ],
    tips: [
      {
        id: 1,
        icon: '🧘',
        title: 'চিন্তা তারপর কথা',
        body: 'কথা বলার আগে ৩ সেকেন্ড চিন্তা করুন।',
      },
      {
        id: 2,
        icon: '👂',
        title: 'বেশি শুনুন',
        body: 'কথা বলার চেয়ে বেশি মনোযোগ দিয়ে শুনুন।',
      },
    ],
  },
];

const COLORS = [
  '#f59e0b',
  '#38bdf8',
  '#a78bfa',
  '#52b788',
  '#f87171',
  '#34d399',
  '#c9a84c',
  '#f472b6',
];
const ICONS = ['💰', '⏰', '🤫', '✈️', '🎯', '📖', '🏃', '🌿', '💡', '⭐'];
const TIP_ICONS = [
  '📊',
  '🏦',
  '📅',
  '⚡',
  '🧘',
  '👂',
  '💡',
  '🎯',
  '⭐',
  '🔑',
  '📌',
  '🚀',
];

const EMPTY_FORMULA = {
  icon: '🎯',
  title: '',
  titleBn: '',
  arabic: '',
  desc: '',
  color: '#c9a84c',
  questions: [],
  tips: [],
};

const newQuestion = () => ({ id: Date.now(), q: '', qBn: '' });
const newTip = () => ({ id: Date.now(), icon: '💡', title: '', body: '' });

// ── Inline editable list sub-component ──────────────────────────────────────
function InlineList({ label, items, onChange, renderRow }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <label style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
          {label}
        </label>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 12, padding: '2px 10px' }}
          onClick={() => onChange([...items, renderRow.empty()])}
        >
          ＋ যোগ
        </button>
      </div>
      {items.length === 0 && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text3)',
            padding: '6px 0',
            fontFamily: 'var(--font-bengali)',
          }}
        >
          কোনো আইটেম নেই — ＋ যোগ করুন।
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, idx) =>
          renderRow.render(
            item,
            idx,
            (updated) => {
              const next = [...items];
              next[idx] = updated;
              onChange(next);
            },
            () => onChange(items.filter((_, i) => i !== idx)),
          ),
        )}
      </div>
    </div>
  );
}

export default function Formulas() {
  const { items, add, edit, remove, reset } = useEditableList(
    'formulas_data',
    DEFAULT_FORMULAS,
  );
  const [active, setActive] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORMULA);
  const [checks, setChecks] = useState({});

  const current =
    active !== null ? items.find((f) => f.id === active) : items[0];

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORMULA);
    setShowModal(true);
  };
  const openEdit = (f) => {
    setEditItem(f);
    setForm({
      ...f,
      questions: [...(f.questions || [])],
      tips: [...(f.tips || [])],
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editItem) edit(editItem.id, form);
    else add(form);
    setShowModal(false);
  };

  const toggleCheck = (fId, qId) =>
    setChecks((p) => ({ ...p, [`${fId}_${qId}`]: !p[`${fId}_${qId}`] }));

  // ── Question row renderer ────────────────────────────────────────────────
  const questionRow = {
    empty: newQuestion,
    render: (q, idx, onChange, onRemove) => (
      <div
        key={q.id}
        style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 10px',
        }}
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
          <input
            value={q.qBn}
            onChange={(e) => onChange({ ...q, qBn: e.target.value })}
            placeholder="প্রশ্ন (বাংলা) *"
            style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-bengali)' }}
          />
          <button
            type="button"
            className="btn btn-danger btn-xs"
            onClick={onRemove}
            title="মুছুন"
          >
            ✕
          </button>
        </div>
        <input
          value={q.q}
          onChange={(e) => onChange({ ...q, q: e.target.value })}
          placeholder="Question (English — optional)"
          style={{ width: '100%', fontSize: 11, color: 'var(--text3)' }}
        />
      </div>
    ),
  };

  // ── Tip row renderer ─────────────────────────────────────────────────────
  const tipRow = {
    empty: newTip,
    render: (tip, idx, onChange, onRemove) => (
      <div
        key={tip.id}
        style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 5,
            alignItems: 'center',
          }}
        >
          <select
            value={tip.icon}
            onChange={(e) => onChange({ ...tip, icon: e.target.value })}
            style={{
              width: 54,
              fontSize: 15,
              padding: '2px 4px',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {TIP_ICONS.map((ic) => (
              <option key={ic} value={ic}>
                {ic}
              </option>
            ))}
          </select>
          <input
            value={tip.title}
            onChange={(e) => onChange({ ...tip, title: e.target.value })}
            placeholder="টিপের শিরোনাম *"
            style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-bengali)' }}
          />
          <button
            type="button"
            className="btn btn-danger btn-xs"
            onClick={onRemove}
            title="মুছুন"
          >
            ✕
          </button>
        </div>
        <textarea
          rows={2}
          value={tip.body}
          onChange={(e) => onChange({ ...tip, body: e.target.value })}
          placeholder="বিস্তারিত বিবরণ (optional)..."
          style={{
            width: '100%',
            fontSize: 11,
            fontFamily: 'var(--font-bengali)',
            resize: 'vertical',
          }}
        />
      </div>
    ),
  };

  return (
    <div>
      {/* Page Header */}
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
          <h1>✦ Formulas / ফর্মুলাসমূহ</h1>
          <p>জীবন পরিচালনার স্মার্ট ফর্মুলা</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (window.confirm('ডিফল্টে ফিরে যাবেন?'))
                reset(DEFAULT_FORMULAS);
            }}
          >
            🌱 Reset
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            ＋ ফর্মুলা যোগ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}
      >
        {items.map((f) => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-bengali)',
              fontSize: 12,
              fontWeight: 500,
              background: current?.id === f.id ? `${f.color}15` : 'var(--bg2)',
              border: `1px solid ${current?.id === f.id ? f.color : 'var(--border)'}`,
              color: current?.id === f.id ? f.color : 'var(--text2)',
            }}
          >
            <span style={{ fontSize: 16 }}>{f.icon}</span>
            <span>{f.titleBn || f.title}</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <p>কোনো ফর্মুলা নেই।</p>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              marginTop: 14,
            }}
          >
            <button
              className="btn btn-primary"
              onClick={() => reset(DEFAULT_FORMULAS)}
            >
              🌱 ডিফল্ট যোগ
            </button>
            <button className="btn btn-ghost" onClick={openAdd}>
              ＋ নতুন
            </button>
          </div>
        </div>
      ) : current ? (
        <div
          className="card"
          style={{ borderTop: `3px solid ${current.color}` }}
        >
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: `${current.color}15`,
                  border: `1px solid ${current.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {current.icon}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    color: current.color,
                    fontSize: 14,
                  }}
                >
                  {current.title}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-bengali)',
                    fontSize: 12,
                    color: 'var(--text2)',
                    marginTop: 1,
                  }}
                >
                  {current.titleBn}
                </div>
                {current.arabic && (
                  <div
                    style={{
                      fontFamily: 'var(--font-arabic)',
                      fontSize: 13,
                      color: 'var(--text3)',
                      marginTop: 3,
                    }}
                  >
                    {current.arabic}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button className="btn btn-xs" onClick={() => openEdit(current)}>
                ✏️
              </button>
              <button
                className="btn btn-danger btn-xs"
                onClick={() => setDeleteId(current.id)}
              >
                🗑️
              </button>
            </div>
          </div>

          {current.desc && (
            <p
              style={{
                fontSize: 12.5,
                color: 'var(--text2)',
                marginBottom: 14,
                fontFamily: 'var(--font-bengali)',
              }}
            >
              {current.desc}
            </p>
          )}

          {/* Questions */}
          {(current.questions || []).length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {current.questions.map((q) => {
                const key = `${current.id}_${q.id}`;
                const checked = !!checks[key];
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleCheck(current.id, q.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: checked ? `${current.color}12` : 'var(--bg3)',
                      border: `1px solid ${checked ? current.color + '40' : 'var(--border)'}`,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: `2px solid ${checked ? current.color : 'var(--border2)'}`,
                        background: checked ? current.color : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {checked && (
                        <span
                          style={{
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--text)',
                        fontFamily: 'var(--font-bengali)',
                        flex: 1,
                      }}
                    >
                      {q.qBn}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tips */}
          {(current.tips || []).length > 0 && (
            <div>
              <div className="card-title" style={{ marginBottom: 10 }}>
                💡 স্মার্ট টিপস
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {current.tips.map((tip) => (
                  <div
                    key={tip.id}
                    style={{
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <span style={{ fontSize: 16 }}>{tip.icon}</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text)',
                          fontFamily: 'var(--font-bengali)',
                        }}
                      >
                        {tip.title}
                      </span>
                    </div>
                    {tip.body && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12.5,
                          color: 'var(--text2)',
                          lineHeight: 1.6,
                          fontFamily: 'var(--font-bengali)',
                          paddingLeft: 26,
                        }}
                      >
                        {tip.body}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="modal"
            style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 className="modal-title">
              {editItem ? '✏️ ফর্মুলা সম্পাদনা' : '＋ নতুন ফর্মুলা'}
            </h2>
            <form onSubmit={handleSave}>
              {/* Icon & Color row */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div className="form-group" style={{ minWidth: 200 }}>
                  <label>Icon</label>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setForm({ ...form, icon: ic })}
                        style={{
                          fontSize: 18,
                          padding: '3px 6px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          border:
                            form.icon === ic
                              ? '2px solid var(--gold)'
                              : '1px solid var(--border)',
                          background:
                            form.icon === ic ? 'var(--bg3)' : 'transparent',
                        }}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: c,
                          cursor: 'pointer',
                          border:
                            form.color === c
                              ? '3px solid var(--text)'
                              : '2px solid transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Title fields */}
              <div className="grid-2">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Money Saving Formula"
                  />
                </div>
                <div className="form-group">
                  <label>শিরোনাম (বাংলা)</label>
                  <input
                    value={form.titleBn}
                    onChange={(e) =>
                      setForm({ ...form, titleBn: e.target.value })
                    }
                    placeholder="অর্থ সাশ্রয় ফর্মুলা"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Arabic</label>
                <input
                  value={form.arabic}
                  onChange={(e) => setForm({ ...form, arabic: e.target.value })}
                  style={{ direction: 'rtl', fontFamily: 'var(--font-arabic)' }}
                />
              </div>
              <div className="form-group">
                <label>বিবরণ</label>
                <input
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  placeholder="ফর্মুলার বিবরণ..."
                />
              </div>

              {/* ── Inline Questions ── */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <InlineList
                  label="❓ প্রশ্নসমূহ (Questions)"
                  items={form.questions || []}
                  onChange={(qs) => setForm({ ...form, questions: qs })}
                  renderRow={questionRow}
                />
              </div>

              {/* ── Inline Tips ── */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <InlineList
                  label="💡 টিপস (Tips)"
                  items={form.tips || []}
                  onChange={(ts) => setForm({ ...form, tips: ts })}
                  renderRow={tipRow}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: 8 }}>
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
            <h2 className="modal-title">⚠️ মুছবেন?</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 20 }}>
              এই ফর্মুলাটি মুছে যাবে।
            </p>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteId(null)}
              >
                বাতিল
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  remove(deleteId);
                  setDeleteId(null);
                  if (current?.id === deleteId) setActive(null);
                }}
              >
                মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
