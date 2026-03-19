import React, { useState, useEffect } from 'react';
import API, { downloadFile } from '../utils/api';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_BN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const fmt = d => new Date(d).toLocaleDateString('en-GB');

function calcPoints(r) {
  let pts = 0;
  if (r.salat) {
    pts += Math.min(10, r.salat.fajr||0) + Math.min(10, r.salat.dhuhr||0) +
           Math.min(10, r.salat.asr||0)  + Math.min(10, r.salat.maghrib||0) +
           Math.min(10, r.salat.isha||0) + Math.min(5,  r.salat.tahajjud||0);
  }
  pts += (r.quran?.pages||0) > 0 ? 5 : 0; // flat 5 pts
  pts += r.siyam?.foroj ? 10 : 0;
  pts += r.siyam?.nofol ? 5  : 0;
  pts += (r.generalRule||0);
  return Math.round(pts * 10) / 10;
}

export default function History() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [filter, setFilter] = useState({ month: now.getMonth()+1, year: now.getFullYear(), startDate:'', endDate:'' });
  const [editRec, setEditRec] = useState(null);
  const years = []; for (let y=2020;y<=now.getFullYear()+1;y++) years.push(y);

  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => { fetchRecords(); }, [page, filter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const p = { page, limit: 20 };
      if (filter.startDate && filter.endDate) { p.startDate = filter.startDate; p.endDate = filter.endDate; }
      else if (filter.month && filter.year) { p.month = filter.month; p.year = filter.year; }
      const { data } = await API.get('/amal', { params: p });
      setRecords(data.records); setTotal(data.total); setPages(data.pages);
    } catch {}
    setLoading(false);
  };

  const handleExport = async type => {
    const ext = type === 'excel' ? 'xlsx' : 'pdf';
    const params = [];
    if (filter.startDate && filter.endDate) { params.push(`startDate=${filter.startDate}`,`endDate=${filter.endDate}`); }
    else if (filter.month && filter.year) { params.push(`month=${filter.month}`,`year=${filter.year}`); }
    const qs = params.length ? '?'+params.join('&') : '';
    toast.loading('তৈরি হচ্ছে...');
    try {
      await downloadFile(`/reports/${type}${qs}`, `amal_history.${ext}`);
      toast.dismiss(); toast.success('ডাউনলোড হয়েছে!');
    } catch { toast.dismiss(); toast.error('এক্সপোর্ট ব্যর্থ হয়েছে'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('এই রেকর্ড মুছবেন?')) return;
    try { await API.delete(`/amal/${id}`); toast.success('মুছে ফেলা হয়েছে'); fetchRecords(); }
    catch { toast.error('মুছতে ব্যর্থ'); }
  };

  const sum = records.reduce((s,r) => ({
    points: s.points + (r.totalPoints || calcPoints(r)),
    pages: s.pages + (r.quran?.pages||0),
    fast: s.fast + (r.siyam?.foroj ? 1 : 0),
    exercise: s.exercise + (r.exercise?.minutes||0),
    sokal: s.sokal + (r.extra?.sokalDua ? 1 : 0),
    tawba: s.tawba + (r.extra?.dinerTowba ? 1 : 0),
    sondhar: s.sondhar + (r.extra?.sondharDua ? 1 : 0),
  }), { points:0, pages:0, fast:0, exercise:0, sokal:0, tawba:0, sondhar:0 });

  return (
    <div>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1>📋 History / ইতিহাস</h1>
          <p>আমলের রেকর্ড দেখুন ও এক্সপোর্ট করুন</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => handleExport('excel')}>📊 Excel</button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleExport('pdf')}>📄 PDF</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="form-group">
          <label>মাস / Month</label>
          <select value={filter.month} onChange={e => setFilter(p => ({ ...p, month: e.target.value, startDate:'', endDate:'' }))}>
            <option value="">সব</option>
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m} – {MONTHS_BN[i]}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>বছর / Year</label>
          <select value={filter.year} onChange={e => setFilter(p => ({ ...p, year: e.target.value }))}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>থেকে / From</label>
          <input type="date" value={filter.startDate} onChange={e => setFilter(p => ({ ...p, startDate: e.target.value, month:'', year:'' }))} />
        </div>
        <div className="form-group">
          <label>পর্যন্ত / To</label>
          <input type="date" value={filter.endDate} onChange={e => setFilter(p => ({ ...p, endDate: e.target.value, month:'', year:'' }))} />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ month: now.getMonth()+1, year: now.getFullYear(), startDate:'', endDate:'' })}>
          ↺ রিসেট
        </button>
      </div>

      {/* Summary */}
      <div className="summary-bar">
        <span>📦 <strong>{total}</strong> রেকর্ড</span>
        <span>|</span>
        <span>✨ পয়েন্ট: <strong>{sum.points.toFixed(1)}</strong></span>
        <span>|</span>
        <span>📖 পাতা: <strong style={{ color:'var(--green2)' }}>{sum.pages}</strong></span>
        <span>|</span>
        <span>🌙 রোযা: <strong>{sum.fast}</strong> দিন</span>
        <span>|</span>
        <span>🏃 ব্যায়াম: <strong>{sum.exercise}</strong> মিনিট</span>
        <span>|</span>
        <span>🌅 সকাল: <strong>{sum.sokal}</strong></span>
        <span>|</span>
        <span>🤲 তওবা: <strong>{sum.tawba}</strong></span>
        <span>|</span>
        <span>🌇 সন্ধ্যা: <strong>{sum.sondhar}</strong></span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /> লোড হচ্ছে...</div>
        ) : records.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><p>কোনো রেকর্ড পাওয়া যায়নি</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>তারিখ</th>
                  <th>ফজর</th><th>যোহর</th><th>আসর</th><th>মাগ</th><th>ইশা</th><th>তাহা</th>
                  <th>পাতা</th>
                  <th>ফরজ</th><th>নফল</th>
                  <th title="সকালের দোয়া">সকাল🌅</th><th title="দিনের তওবা">তওবা🤲</th><th title="সন্ধ্যার দোয়া">সন্ধ্যা🌇</th>
                  <th>Gen</th><th>ব্যায়াম</th><th>ঘুম</th>
                  <th>পয়েন্ট</th>
                  <th>মন্তব্য</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const pts = r.totalPoints || calcPoints(r);
                  const ptsCls = pts >= 60 ? 'score-high' : pts >= 35 ? 'score-mid' : 'score-low';
                  return (
                    <tr key={r._id}>
                      <td style={{ color:'var(--text3)', fontSize:10 }}>{(page-1)*20+i+1}</td>
                      <td style={{ color:'var(--text2)', whiteSpace:'nowrap', fontSize:11 }}>{fmt(r.date)}</td>
                      <td>{r.salat?.fajr||0}</td>
                      <td>{r.salat?.dhuhr||0}</td>
                      <td>{r.salat?.asr||0}</td>
                      <td>{r.salat?.maghrib||0}</td>
                      <td>{r.salat?.isha||0}</td>
                      <td>{r.salat?.tahajjud||0}</td>
                      <td style={{ color:'var(--green2)', fontWeight:600 }}>{r.quran?.pages||0}</td>
                      <td>{r.siyam?.foroj ? '✅':''}</td>
                      <td>{r.siyam?.nofol ? '🟡':''}</td>
                      <td style={{ color: r.extra?.sokalDua ? 'var(--green2)' : 'var(--text3)' }}>{r.extra?.sokalDua ? '✓' : '–'}</td>
                      <td style={{ color: r.extra?.dinerTowba ? 'var(--green2)' : 'var(--text3)' }}>{r.extra?.dinerTowba ? '✓' : '–'}</td>
                      <td style={{ color: r.extra?.sondharDua ? 'var(--green2)' : 'var(--text3)' }}>{r.extra?.sondharDua ? '✓' : '–'}</td>
                      <td>{r.generalRule||0}</td>
                      <td>{r.exercise?.minutes||0}m</td>
                      <td>{r.sleep?.hours||0}h</td>
                      <td className={`pts-cell ${ptsCls}`} style={{ fontWeight:800 }}>{pts}</td>
                      <td style={{ color:'var(--text3)', fontSize:10, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.remarks}</td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="edit-amal-btn" onClick={() => setEditRec(r)}>✏️</button>
                          <button className="edit-amal-btn" style={{ color:'var(--red2)' }} onClick={() => handleDelete(r._id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(1)} disabled={page===1}>«</button>
          <button className="page-btn" onClick={() => setPage(p=>p-1)} disabled={page===1}>‹</button>
          {Array.from({ length: Math.min(pages,7) }, (_,i) => {
            let p; if(pages<=7)p=i+1; else if(page<=4)p=i+1; else if(page>=pages-3)p=pages-6+i; else p=page-3+i;
            return <button key={p} className={`page-btn${p===page?' active':''}`} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button className="page-btn" onClick={() => setPage(p=>p+1)} disabled={page===pages}>›</button>
          <button className="page-btn" onClick={() => setPage(pages)} disabled={page===pages}>»</button>
        </div>
      )}

      {/* Edit Modal */}
      {editRec && (
        <EditModal rec={editRec} onClose={() => setEditRec(null)} onSaved={() => { setEditRec(null); fetchRecords(); }} />
      )}
    </div>
  );
}

function EditModal({ rec, onClose, onSaved }) {
  const [form, setForm] = useState(JSON.parse(JSON.stringify(rec)));
  const [saving, setSaving] = useState(false);
  const set = (path, val) => {
    setForm(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i=0;i<keys.length-1;i++) obj=obj[keys[i]];
      obj[keys[keys.length-1]] = val;
      return next;
    });
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put(`/amal/${form._id}`, form);   // PUT by ID — not POST
      toast.success('✅ আমল আপডেট হয়েছে');
      onSaved();
    } catch { toast.error('আপডেট ব্যর্থ'); }
    setSaving(false);
  };
  return (
    <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">✏️ Edit Amal — {new Date(rec.date).toLocaleDateString('en-GB')}</div>
        <div className="grid-3">
          {['fajr','dhuhr','asr','maghrib','isha','tahajjud'].map(k => (
            <div className="form-group" key={k}>
              <label>{k.charAt(0).toUpperCase()+k.slice(1)}</label>
              <input type="number" min={0} max={k==='tahajjud'?5:10} value={form.salat?.[k]||0}
                onChange={e => set(`salat.${k}`, parseInt(e.target.value)||0)} />
            </div>
          ))}
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>📖 কুরআন পাতা (max 10)</label>
            <input type="number" min={0} max={10} value={form.quran?.pages||0} onChange={e => set('quran.pages', parseInt(e.target.value)||0)} />
          </div>
          <div className="form-group">
            <label>⭐ General Rule</label>
            <input type="number" min={0} value={form.generalRule||0} onChange={e => set('generalRule', parseInt(e.target.value)||0)} />
          </div>
        </div>
        <div style={{ display:'flex', gap:16, margin:'8px 0' }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <input type="checkbox" checked={form.siyam?.foroj||false} onChange={e => set('siyam.foroj', e.target.checked)} />
            <span style={{ fontSize:12 }}>ফরজ রোযা</span>
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <input type="checkbox" checked={form.siyam?.nofol||false} onChange={e => set('siyam.nofol', e.target.checked)} style={{ width:'auto' }} />
            <span style={{ fontSize:12 }}>নফল রোযা</span>
          </label>
        </div>
        <div className="form-group">
          <label>📝 মন্তব্য</label>
          <textarea value={form.remarks||''} onChange={e => setForm(p=>({...p,remarks:e.target.value}))} rows={2} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>বাতিল</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? '⏳...' : '💾 সংরক্ষণ'}
          </button>
        </div>
      </div>
    </div>
  );
}
