import React, { useState } from 'react';
import { useEditableList } from '../utils/useEditableList';

const DEFAULT_PRINCIPLES = [
  { id: 1, icon: '🕌', title: 'তাওহীদ', titleEn: 'Tawhid', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', description: 'আল্লাহর একত্বে বিশ্বাস ইসলামের মূল ভিত্তি। সকল কাজ, চিন্তা ও ইবাদত একমাত্র আল্লাহর জন্য উৎসর্গ করা।', color: '#c9a84c' },
  { id: 2, icon: '📖', title: 'ইলম', titleEn: 'Knowledge', arabic: 'اقْرَأْ بِاسْمِ رَبِّكَ', description: 'জ্ঞান অর্জন করা প্রতিটি মুসলমানের উপর ফরজ। দ্বীনি ও দুনিয়াবি উভয় জ্ঞান অর্জনে সচেষ্ট থাকা।', color: '#52b788' },
  { id: 3, icon: '💪', title: 'আমল', titleEn: 'Action', arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', description: 'সৎ আমল ও ধৈর্যের মাধ্যমে আল্লাহর নৈকট্য লাভ। প্রতিটি কাজ ইখলাসের সাথে করা।', color: '#60a5fa' },
  { id: 4, icon: '🤝', title: 'আখলাক', titleEn: 'Character', arabic: 'إِنَّمَا بُعِثْتُ لِأُتَمِّمَ مَكَارِمَ الْأَخْلَاقِ', description: 'উত্তম চরিত্র গঠনই নবী (সা.)-এর আদর্শ। মানুষের সাথে সদাচারণ ও ন্যায়বিচার প্রতিষ্ঠা।', color: '#a78bfa' },
  { id: 5, icon: '🌍', title: 'দাওয়াহ', titleEn: 'Dawah', arabic: 'ادْعُ إِلَىٰ سَبِيلِ رَبِّكَ بِالْحِكْمَةِ', description: 'মানুষকে আল্লাহর পথে প্রজ্ঞা ও সুন্দর উপদেশের মাধ্যমে আহ্বান করা প্রতিটি মুসলমানের দায়িত্ব।', color: '#f87171' },
];

const COLORS = ['#c9a84c','#52b788','#60a5fa','#a78bfa','#f87171','#34d399','#f472b6','#38bdf8'];
const ICONS = ['🕌','📖','💪','🤝','🌍','⭐','🏃','🌙','✨','🎯','🔑','💡','🌿','🕊️','⚖️'];

const EMPTY_FORM = { icon: '🕌', title: '', titleEn: '', arabic: '', description: '', color: '#c9a84c' };

export default function Principles() {
  const { items, add, edit, remove, reset } = useEditableList('principles_data', DEFAULT_PRINCIPLES);
  const [expanded, setExpanded]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ ...p }); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editItem) edit(editItem.id, form);
    else add(form);
    setShowModal(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1>⚖️ Principles / নীতিমালা</h1>
          <p>ইসলামিক জীবনের মূল নীতিসমূহ</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('ডিফল্ট নীতিমালায় ফিরে যাবেন?')) reset(DEFAULT_PRINCIPLES); }}>🌱 Reset</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>＋ নতুন নীতি</button>
        </div>
      </div>

      <div className="hadith-card" style={{ textAlign: 'center', marginBottom: 24 }}>
        <p className="hadith-text" style={{ fontSize: 18 }}>مَنْ عَمِلَ صَالِحًا فَلِنَفْسِهِ</p>
        <p className="hadith-translation">\"যে সৎকাজ করে, সে নিজের কল্যাণের জন্যই করে।\"</p>
        <p className="hadith-source">— সূরা ফুসিলাত, আয়াত ৪৬</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚖️</div>
          <p>কোনো নীতি নেই।</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
            <button className="btn btn-primary" onClick={() => reset(DEFAULT_PRINCIPLES)}>🌱 ডিফল্ট যোগ</button>
            <button className="btn btn-ghost" onClick={openAdd}>＋ নতুন</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map(p => {
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className="card" style={{ borderColor: isOpen ? p.color : 'var(--border)', transition: 'border-color .2s', boxShadow: isOpen ? `0 0 20px ${p.color}20` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : p.id)}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}15`, border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {p.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: p.color, fontSize: 14 }}>
                        {p.title}
                        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8, fontWeight: 400 }}>{p.titleEn}</span>
                      </div>
                      {p.arabic && <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 14, color: 'var(--text2)', marginTop: 2 }}>{p.arabic}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                    <button className="btn btn-xs" onClick={() => openEdit(p)}>✏️</button>
                    <button className="btn btn-danger btn-xs" onClick={() => setDeleteId(p.id)}>🗑️</button>
                    <span style={{ color: p.color, fontSize: 16, cursor: 'pointer', transition: 'transform .2s', display: 'block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} onClick={() => setExpanded(isOpen ? null : p.id)}>▾</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${p.color}20` }}>
                    <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.75, fontFamily: 'var(--font-bengali)' }}>{p.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <h2 className="modal-title">{editItem ? '✏️ নীতি সম্পাদনা' : '＋ নতুন নীতি'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                  <label>Icon</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ICONS.map(ic => (
                      <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                        style={{ fontSize: 20, padding: '3px 7px', borderRadius: 8, cursor: 'pointer',
                          border: form.icon === ic ? '2px solid var(--gold)' : '1px solid var(--border)',
                          background: form.icon === ic ? 'var(--bg3)' : 'transparent' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                  <label>Color</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                          border: form.color === c ? '3px solid var(--text)' : '2px solid transparent' }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>শিরোনাম (বাংলা) *</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="যেমন: তাওহীদ" />
                </div>
                <div className="form-group">
                  <label>Title (English)</label>
                  <input value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} placeholder="Tawhid" />
                </div>
              </div>
              <div className="form-group">
                <label>Arabic</label>
                <input value={form.arabic} onChange={e => setForm({ ...form, arabic: e.target.value })} placeholder="আরবি টেক্সট..." style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }} />
              </div>
              <div className="form-group">
                <label>বিবরণ</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="নীতির বিস্তারিত বিবরণ..." />
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
            <p style={{ color: 'var(--text2)', marginBottom: 20 }}>এই নীতিটি মুছে যাবে।</p>
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
