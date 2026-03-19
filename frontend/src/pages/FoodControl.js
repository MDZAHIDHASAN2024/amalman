import React, { useState } from 'react';
import { useEditableList } from '../utils/useEditableList';

const DEFAULT_FOOD = [
  { id: 1, day: 'Saturday',   dayBn: 'শনিবার',       breakfast: 'Rice + Vorta Item || Sweet Potato', lunch: 'Rice + Fish Curry + Dal + Salad', snacks: '3 Date + ½ Cucumber', dinner: 'Rice + Vegetables' },
  { id: 2, day: 'Sunday',     dayBn: 'রবিবার',        breakfast: 'Rice + Any Vorta Items', lunch: 'Rice + Egg Curry + Salad', snacks: '3 Date + 3 Almond', dinner: 'Rice + 100ml Milk' },
  { id: 3, day: 'Monday',     dayBn: 'সোমবার',        breakfast: '2 Boil Egg + 7 Dates', lunch: 'Rice + Chicken + Salad', snacks: '3 Date + Tea', dinner: 'Rice + Kalojira Vorta / Any Curry' },
  { id: 4, day: 'Tuesday',    dayBn: 'মঙ্গলবার',      breakfast: 'Rice + Vegetables + Dal || Sweet Potato', lunch: 'Rice + Fish Curry + Salad', snacks: '3 Date + 3 Almond', dinner: 'Rice + Any Curry' },
  { id: 5, day: 'Wednesday',  dayBn: 'বুধবার',        breakfast: 'Roti + Vegetable', lunch: 'Rice + Chicken + Salad', snacks: '3 Date + Coffee', dinner: 'Rice + Vegetables' },
  { id: 6, day: 'Thursday',   dayBn: 'বৃহস্পতিবার',  breakfast: 'Rice + Dal + Vegetables', lunch: 'Rice + Egg Curry + Salad', snacks: '3 Date + 3 Almond', dinner: 'Roti + 100ml Milk' },
  { id: 7, day: 'Friday',     dayBn: 'শুক্রবার',     breakfast: 'Rice + Any Curry', lunch: 'Rice + Chicken / Beef Curry + Salad', snacks: '3 Date + 3 Almond + Any Fruits', dinner: 'Potato Fry / Half Boil Duck Egg || Sweet Potato' },
];

const DEFAULT_TIPS = [
  { id: 1, bn: '১ জনের খাবার ২ জন, ২ জনের খাবার ৩ জনের জন্য যথেষ্ট!', en: 'Eat less than you think you need.' },
  { id: 2, bn: 'দিনে ৩.৫ লিটার পানি পান করো!', en: 'Drink 3.5 litres of water daily.' },
  { id: 3, bn: 'রাতের খাবার ঘুমের ২–৩ ঘণ্টা আগে!', en: 'Eat dinner 2–3 hours before sleep.' },
  { id: 4, bn: 'চিনি ও সফট ড্রিংক খাবেন না!', en: 'Avoid sugar and soft drinks.' },
];

const MEALS = [
  { key: 'breakfast', icon: '🌅', label: 'Breakfast / সকাল', color: 'var(--gold)' },
  { key: 'lunch',     icon: '☀️', label: 'Lunch / দুপুর',    color: '#eab308' },
  { key: 'snacks',    icon: '🍃', label: 'Snacks / নাস্তা', color: 'var(--green2)' },
  { key: 'dinner',    icon: '🌙', label: 'Dinner / রাত',     color: '#818cf8' },
];

const TODAY_NAME = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
const EMPTY_FOOD = { day: '', dayBn: '', breakfast: '', lunch: '', snacks: '', dinner: '' };
const EMPTY_TIP  = { bn: '', en: '' };

export default function FoodControl() {
  const food = useEditableList('food_data', DEFAULT_FOOD);
  const tips = useEditableList('food_tips', DEFAULT_TIPS);

  const [selected, setSelected]   = useState('');
  const [viewMode, setViewMode]   = useState('card');
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showTipModal, setShowTipModal]   = useState(false);
  const [editFood, setEditFood]   = useState(null);
  const [editTip, setEditTip]     = useState(null);
  const [deleteFoodId, setDeleteFoodId] = useState(null);
  const [deleteTipId, setDeleteTipId]   = useState(null);
  const [foodForm, setFoodForm]   = useState(EMPTY_FOOD);
  const [tipForm, setTipForm]     = useState(EMPTY_TIP);

  const filtered = selected ? food.items.filter(f => f.day === selected) : food.items;

  const openAddFood  = () => { setEditFood(null); setFoodForm(EMPTY_FOOD); setShowFoodModal(true); };
  const openEditFood = (f) => { setEditFood(f); setFoodForm({ ...f }); setShowFoodModal(true); };
  const openAddTip   = () => { setEditTip(null); setTipForm(EMPTY_TIP); setShowTipModal(true); };
  const openEditTip  = (t) => { setEditTip(t); setTipForm({ ...t }); setShowTipModal(true); };

  const saveFoodForm = (e) => {
    e.preventDefault();
    if (editFood) food.edit(editFood.id, foodForm); else food.add(foodForm);
    setShowFoodModal(false);
  };

  const saveTipForm = (e) => {
    e.preventDefault();
    if (editTip) tips.edit(editTip.id, tipForm); else tips.add(tipForm);
    setShowTipModal(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1>🥗 Food Controls / খাদ্য নিয়ন্ত্রণ</h1>
          <p>সাপ্তাহিক খাদ্য পরিকল্পনা</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${viewMode==='card'?'btn-primary':'btn-ghost'}`} onClick={() => setViewMode('card')}>🃏 Card</button>
          <button className={`btn btn-sm ${viewMode==='table'?'btn-primary':'btn-ghost'}`} onClick={() => setViewMode('table')}>📋 Table</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('ডিফল্টে ফিরে যাবেন?')) food.reset(DEFAULT_FOOD); }}>🌱 Reset</button>
          <button className="btn btn-primary btn-sm" onClick={openAddFood}>＋ দিন যোগ</button>
        </div>
      </div>

      {/* Day filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={() => setSelected('')} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-bengali)', border: '1px solid', background: !selected ? 'var(--gold)' : 'transparent', borderColor: !selected ? 'var(--gold)' : 'var(--border)', color: !selected ? 'var(--bg)' : 'var(--text2)' }}>সব দিন</button>
        {food.items.map(f => {
          const isToday  = f.day === TODAY_NAME;
          const isActive = selected === f.day;
          return (
            <button key={f.id} onClick={() => setSelected(f.day === selected ? '' : f.day)}
              style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-bengali)', border: '1px solid', position: 'relative',
                background: isActive ? 'var(--gold)' : isToday ? 'rgba(201,168,76,0.12)' : 'transparent',
                borderColor: isActive ? 'var(--gold)' : isToday ? 'var(--gold-dim)' : 'var(--border)',
                color: isActive ? 'var(--bg)' : isToday ? 'var(--gold)' : 'var(--text2)' }}>
              {f.dayBn || f.day}
              {isToday && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: 'var(--green2)', borderRadius: '50%', border: '2px solid var(--bg)' }} />}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🥗</div>
          <p>কোনো খাদ্য পরিকল্পনা নেই।</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
            <button className="btn btn-primary" onClick={() => food.reset(DEFAULT_FOOD)}>🌱 ডিফল্ট যোগ</button>
            <button className="btn btn-ghost" onClick={openAddFood}>＋ নতুন</button>
          </div>
        </div>
      ) : viewMode === 'card' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14 }}>
          {filtered.map(f => {
            const isToday = f.day === TODAY_NAME;
            return (
              <div key={f.id} className="card" style={{ borderColor: isToday ? 'var(--gold-dim)' : 'var(--border)', background: isToday ? 'linear-gradient(135deg,rgba(201,168,76,0.06),var(--bg2))' : 'var(--bg2)', position: 'relative' }}>
                {isToday && <span style={{ position: 'absolute', top: 12, right: 48, fontSize: 9, fontWeight: 700, background: 'var(--gold)', color: 'var(--bg)', padding: '2px 8px', borderRadius: 20 }}>আজকে</span>}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                  <button className="btn btn-xs" onClick={() => openEditFood(f)}>✏️</button>
                  <button className="btn btn-danger btn-xs" onClick={() => setDeleteFoodId(f.id)}>🗑️</button>
                </div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  📅 {f.day} <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-bengali)', fontWeight: 400 }}>({f.dayBn})</span>
                </div>
                {MEALS.map(m => (
                  <div key={m.key} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(48,54,61,.4)' }}>
                    <div style={{ width: 22, textAlign: 'center', flexShrink: 0, marginTop: 2 }}>{m.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, color: m.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5 }}>{f[m.key]}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>দিন</th>
                  <th>🌅 সকাল</th>
                  <th>☀️ দুপুর</th>
                  <th>🍃 নাস্তা</th>
                  <th>🌙 রাত</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} style={{ background: f.day === TODAY_NAME ? 'rgba(201,168,76,0.05)' : undefined }}>
                    <td><div style={{ fontWeight: 700, color: f.day === TODAY_NAME ? 'var(--gold)' : 'var(--text)', fontFamily: 'var(--font-bengali)' }}>{f.dayBn || f.day}</div></td>
                    <td style={{ fontSize: 12 }}>{f.breakfast}</td>
                    <td style={{ fontSize: 12 }}>{f.lunch}</td>
                    <td style={{ fontSize: 12 }}>{f.snacks}</td>
                    <td style={{ fontSize: 12 }}>{f.dinner}</td>
                    <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-xs" onClick={() => openEditFood(f)}>✏️</button><button className="btn btn-danger btn-xs" onClick={() => setDeleteFoodId(f.id)}>🗑️</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>💡 স্বাস্থ্য টিপস</div>
          <button className="btn btn-ghost btn-sm" onClick={openAddTip}>＋ টিপস</button>
        </div>
        {tips.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <button className="btn btn-ghost" onClick={() => tips.reset(DEFAULT_TIPS)}>🌱 ডিফল্ট টিপস যোগ</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
            {tips.items.map(t => (
              <div key={t.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 13px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 3 }}>
                  <button className="btn btn-xs" onClick={() => openEditTip(t)}>✏️</button>
                  <button className="btn btn-danger btn-xs" onClick={() => setDeleteTipId(t.id)}>🗑️</button>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6, fontFamily: 'var(--font-bengali)', marginBottom: 4, paddingRight: 50 }}>{t.bn}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>{t.en}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food Modal */}
      {showFoodModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowFoodModal(false); }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <h2 className="modal-title">{editFood ? '✏️ দিন সম্পাদনা' : '＋ নতুন দিন'}</h2>
            <form onSubmit={saveFoodForm}>
              <div className="grid-2">
                <div className="form-group"><label>Day (English)</label><input value={foodForm.day} onChange={e => setFoodForm({ ...foodForm, day: e.target.value })} placeholder="Monday" /></div>
                <div className="form-group"><label>দিন (বাংলা)</label><input value={foodForm.dayBn} onChange={e => setFoodForm({ ...foodForm, dayBn: e.target.value })} placeholder="সোমবার" /></div>
              </div>
              {MEALS.map(m => (
                <div className="form-group" key={m.key}>
                  <label>{m.icon} {m.label}</label>
                  <input value={foodForm[m.key]} onChange={e => setFoodForm({ ...foodForm, [m.key]: e.target.value })} placeholder={`${m.label} খাবার...`} />
                </div>
              ))}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowFoodModal(false)}>বাতিল</button>
                <button type="submit" className="btn btn-primary">💾 সংরক্ষণ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowTipModal(false); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <h2 className="modal-title">{editTip ? '✏️ টিপস সম্পাদনা' : '＋ নতুন টিপস'}</h2>
            <form onSubmit={saveTipForm}>
              <div className="form-group"><label>টিপস (বাংলা) *</label><input required value={tipForm.bn} onChange={e => setTipForm({ ...tipForm, bn: e.target.value })} placeholder="বাংলায় টিপস লিখুন..." /></div>
              <div className="form-group"><label>Tip (English)</label><input value={tipForm.en} onChange={e => setTipForm({ ...tipForm, en: e.target.value })} placeholder="English tip..." /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowTipModal(false)}>বাতিল</button>
                <button type="submit" className="btn btn-primary">💾 সংরক্ষণ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Food */}
      {deleteFoodId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 340 }}>
            <h2 className="modal-title">⚠️ মুছবেন?</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 20 }}>এই দিনের খাদ্য পরিকল্পনা মুছে যাবে।</p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteFoodId(null)}>বাতিল</button>
              <button className="btn btn-danger" onClick={() => { food.remove(deleteFoodId); setDeleteFoodId(null); }}>মুছুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tip */}
      {deleteTipId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 340 }}>
            <h2 className="modal-title">⚠️ মুছবেন?</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 20 }}>এই টিপসটি মুছে যাবে।</p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteTipId(null)}>বাতিল</button>
              <button className="btn btn-danger" onClick={() => { tips.remove(deleteTipId); setDeleteTipId(null); }}>মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
