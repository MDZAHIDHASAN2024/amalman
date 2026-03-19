import React, { useState, useEffect } from 'react';
import { useEditableList } from '../utils/useEditableList';

const DEFAULT_SCHEDULE = [
  { id: 1, start: '4:00 AM', end: '5:00 AM', taskBn: 'নামাজ, কুরআন, পানি', task: 'Salat, Quran, Water', hours: 1, cat: 'spiritual' },
  { id: 2, start: '5:00 AM', end: '6:00 AM', taskBn: 'ব্যায়াম, ইংরেজি', task: 'Exercise, English', hours: 1, cat: 'health' },
  { id: 3, start: '6:00 AM', end: '7:00 AM', taskBn: 'ওয়েব ডেভেলপমেন্ট', task: 'Web Development Practice', hours: 1, cat: 'work' },
  { id: 4, start: '7:00 AM', end: '8:00 AM', taskBn: 'সকালের খাবার ও প্রস্তুতি', task: 'Breakfast & Office Preparation', hours: 1, cat: 'personal' },
  { id: 5, start: '8:00 AM', end: '8:00 PM', taskBn: 'অফিস · নামাজ · বিশ্রাম', task: 'Office Work · Salat · Power Nap', hours: 12, cat: 'work' },
  { id: 6, start: '8:00 PM', end: '9:00 PM', taskBn: 'নামাজ ও রাতের খাবার', task: 'Salat & Dinner', hours: 1, cat: 'spiritual' },
  { id: 7, start: '9:00 PM', end: '10:00 PM', taskBn: 'পারিবারিক সময় ও পর্যালোচনা', task: 'Family Time & Review', hours: 1, cat: 'personal' },
  { id: 8, start: '10:00 PM', end: '4:00 AM', taskBn: 'ঘুম', task: 'Sleep', hours: 6, cat: 'rest' },
];

const CAT_CFG = {
  spiritual: { color: '#c9a84c', label: 'আধ্যাত্মিক', icon: '🕌' },
  health:    { color: '#52b788', label: 'স্বাস্থ্য', icon: '🏃' },
  work:      { color: '#60a5fa', label: 'কাজ', icon: '💻' },
  personal:  { color: '#f472b6', label: 'ব্যক্তিগত', icon: '👨‍👩‍👧' },
  rest:      { color: '#818cf8', label: 'বিশ্রাম', icon: '😴' },
};

const CAT_KEYS = Object.keys(CAT_CFG);
const EMPTY_FORM = { start: '', end: '', taskBn: '', task: '', hours: 1, cat: 'work' };

export default function WorkPlans() {
  const { items, add, edit, remove, reset } = useEditableList('workplans_data', DEFAULT_SCHEDULE);
  const [time, setTime]           = useState('');
  const [progress, setProgress]   = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`);
      setProgress(Math.round(((n.getHours() * 60 + n.getMinutes()) / 1440) * 100));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ ...s }); setShowModal(true); };
  const handleSave = (e) => {
    e.preventDefault();
    if (!form.taskBn.trim()) return;
    if (editItem) edit(editItem.id, form);
    else add(form);
    setShowModal(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1>🗓️ Work Plans / কাজের পরিকল্পনা</h1>
          <p>দৈনিক সময়সূচি</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--gold)' }}>{time}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('ডিফল্টে ফিরে যাবেন?')) reset(DEFAULT_SCHEDULE); }}>🌱 Reset</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>＋ যোগ করুন</button>
        </div>
      </div>

      <div className="progress-bar" style={{ height: 6, marginBottom: 20 }}>
        <div className="progress-fill gold" style={{ width: `${progress}%` }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>সময় / Time</th>
                <th>কাজ / Task</th>
                <th>ক্যাটেগরি</th>
                <th>সময়কাল</th>
                <th style={{ width: 80 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const cfg = CAT_CFG[item.cat] || CAT_CFG.work;
                return (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>
                      {item.start} → {item.end}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13, fontFamily: 'var(--font-bengali)' }}>{item.taskBn}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{item.task}</div>
                    </td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                        background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, color: cfg.color,
                        fontFamily: 'var(--font-bengali)', whiteSpace: 'nowrap' }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>{item.hours}h</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-xs" onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn btn-danger btn-xs" onClick={() => setDeleteId(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <h2 className="modal-title">{editItem ? '✏️ সম্পাদনা' : '＋ নতুন সময়সূচি'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>কাজ (বাংলা) *</label>
                <input required value={form.taskBn} onChange={e => setForm({ ...form, taskBn: e.target.value })} placeholder="যেমন: নামাজ, কুরআন" />
              </div>
              <div className="form-group">
                <label>Task (English)</label>
                <input value={form.task} onChange={e => setForm({ ...form, task: e.target.value })} placeholder="Salat, Quran" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>শুরু</label>
                  <input value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} placeholder="4:00 AM" />
                </div>
                <div className="form-group">
                  <label>শেষ</label>
                  <input value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} placeholder="5:00 AM" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>সময় (ঘণ্টা)</label>
                  <input type="number" min="0.5" step="0.5" value={form.hours} onChange={e => setForm({ ...form, hours: parseFloat(e.target.value) || 1 })} />
                </div>
                <div className="form-group">
                  <label>ক্যাটেগরি</label>
                  <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
                    {CAT_KEYS.map(k => <option key={k} value={k}>{CAT_CFG[k].icon} {CAT_CFG[k].label}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>বাতিল</button>
                <button type="submit" className="btn btn-primary">💾 সংরক্ষণ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360 }}>
            <h2 className="modal-title">⚠️ মুছবেন?</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 20 }}>এই সময়সূচিটি মুছে যাবে।</p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>বাতিল</button>
              <button className="btn btn-danger" onClick={() => { remove(deleteId); setDeleteId(null); }}>মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
