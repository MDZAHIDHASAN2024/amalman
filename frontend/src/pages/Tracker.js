import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { calcGeneralRulePoints } from './GeneralRules';

const STORAGE_KEY = 'amal_draft';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EMPTY = {
  date: todayStr(),
  salat: { fajr: '', dhuhr: '', asr: '', maghrib: '', isha: '', tahajjud: '' },
  quran: { pages: '' },
  siyam: { foroj: false, nofol: false },
  exercise: { minutes: '' },
  sleep: { hours: '' },
  extra: { sokalDua: false, dinerTowba: false, sondharDua: false },
  remarks: '',
};

const loadDraft = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (draft.date === todayStr()) return draft;
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
};

const saveDraft = (amal) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(amal));
  } catch {}
};
const clearDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

function calcAmalSubtotal(a) {
  let pts = 0;
  if (a.salat) {
    pts += Math.min(10, +a.salat.fajr || 0);
    pts += Math.min(10, +a.salat.dhuhr || 0);
    pts += Math.min(10, +a.salat.asr || 0);
    pts += Math.min(10, +a.salat.maghrib || 0);
    pts += Math.min(10, +a.salat.isha || 0);
    pts += Math.min(5, +a.salat.tahajjud || 0);
  }
  pts += (+a.quran?.pages || 0) > 0 ? 5 : 0;
  pts += a.siyam?.foroj ? 10 : 0;
  pts += a.siyam?.nofol ? 5 : 0;
  pts += a.extra?.sokalDua ? 2 : 0;
  pts += a.extra?.dinerTowba ? 2 : 0;
  pts += a.extra?.sondharDua ? 2 : 0;
  return Math.round(pts * 10) / 10;
}

function NumInput({
  label,
  labelBn,
  value,
  onChange,
  max,
  min = 0,
  step = 1,
  unit = '',
  disabled = false,
  placeholder = '0',
}) {
  return (
    <div className="form-group">
      <label>
        {label}
        {labelBn && (
          <span
            style={{
              fontWeight: 400,
              color: 'var(--text3)',
              fontFamily: 'var(--font-bengali)',
              marginLeft: 4,
            }}
          >
            / {labelBn}
          </span>
        )}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '' || raw === '-') {
              onChange('');
              return;
            }
            const n = parseFloat(raw);
            if (isNaN(n)) {
              onChange('');
              return;
            }
            onChange(Math.max(min, max !== undefined ? Math.min(max, n) : n));
          }}
          style={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 16,
            color: value === '' ? 'var(--text3)' : 'var(--gold)',
          }}
        />
        {unit && (
          <span style={{ color: 'var(--text3)', fontSize: 12, flexShrink: 0 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  labelBn,
  arabic,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div className="toggle-row">
      <span className="toggle-label">
        {label}
        {labelBn && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--text3)',
              fontFamily: 'var(--font-bengali)',
              marginLeft: 4,
            }}
          >
            {labelBn}
          </span>
        )}
        {arabic && <span className="toggle-arabic">{arabic}</span>}
      </span>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}

const SALAT_FIELDS = [
  { key: 'fajr', label: 'Fajr', bn: 'ফজর', ar: 'فجر', max: 10 },
  { key: 'dhuhr', label: 'Dhuhr', bn: 'যোহর', ar: 'ظهر', max: 10 },
  { key: 'asr', label: 'Asr', bn: 'আসর', ar: 'عصر', max: 10 },
  { key: 'maghrib', label: 'Maghrib', bn: 'মাগরিব', ar: 'مغرب', max: 10 },
  { key: 'isha', label: 'Isha', bn: 'ইশা', ar: 'عشاء', max: 10 },
  { key: 'tahajjud', label: 'Tahajjud', bn: 'তাহাজ্জুদ', ar: 'تهجد', max: 5 },
];

export default function Tracker() {
  const [amal, setAmalState] = useState(() => loadDraft() || EMPTY);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completedRules, setCompletedRules] = useState(0);
  const [uncompletedRules, setUncompletedRules] = useState(0);
  const [totalRules, setTotalRules] = useState(0);
  const [savedSummary, setSavedSummary] = useState(null);
  const [showBadge, setShowBadge] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false); // ✅ custom modal
  const lastScrollY = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  // ── Scroll badge ──
  useEffect(() => {
    const handle = () => {
      const cur = window.scrollY;
      if (cur < lastScrollY.current) setShowBadge(true);
      else if (cur > lastScrollY.current + 5) setShowBadge(false);
      lastScrollY.current = cur;
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const setAmal = (valOrFn) => {
    setAmalState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      saveDraft(next);
      return next;
    });
  };

  useEffect(() => {
    const draft = loadDraft();
    checkDate(draft?.date || todayStr());
    loadRuleCounts();
  }, []);

  useEffect(() => {
    loadRuleCounts();
  }, [location]);

  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === 'visible') {
        const flag = localStorage.getItem('gr_status_changed');
        if (flag) {
          localStorage.removeItem('gr_status_changed');
          loadRuleCounts();
        }
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  useEffect(() => {
    const handle = () => {
      const flag = localStorage.getItem('gr_status_changed');
      if (flag) {
        localStorage.removeItem('gr_status_changed');
        loadRuleCounts();
      }
    };
    window.addEventListener('focus', handle);
    return () => window.removeEventListener('focus', handle);
  }, []);

  const loadRuleCounts = async () => {
    try {
      const { data } = await API.get('/general-rules');
      const s = data.statusMap || {};
      const total = (data.rules || []).length;
      setTotalRules(total);
      setCompletedRules(
        Object.values(s).filter((v) => v === 'completed').length,
      );
      setUncompletedRules(
        Object.values(s).filter((v) => v === 'incompleted').length,
      );
    } catch {}
  };

  const checkDate = async (date) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/amal/date/${date}`);
      setAlreadySaved(!!data);
    } catch {}
    setLoading(false);
  };

  const setField = (path, val) => {
    setAmal((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  };

  const setSiyam = (field, val) => {
    setAmal((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (field === 'foroj' && val) {
        next.siyam.foroj = true;
        next.siyam.nofol = false;
      } else if (field === 'nofol' && val) {
        next.siyam.foroj = false;
        next.siyam.nofol = true;
      } else {
        next.siyam[field] = val;
      }
      return next;
    });
  };

  const handleDateChange = (date) => {
    setAmal({ ...EMPTY, date });
    setSavedSummary(null);
    checkDate(date);
    loadRuleCounts();
  };

  // ✅ Clear confirmed from modal
  const handleClearConfirmed = () => {
    clearDraft();
    setAmalState({ ...EMPTY, date: amal.date });
    setShowClearModal(false);
    toast.success('🗑️ Input clear হয়েছে!');
  };

  const amalSubtotal = calcAmalSubtotal(amal);
  const generalRulePts = calcGeneralRulePoints(
    amalSubtotal,
    completedRules,
    uncompletedRules,
    totalRules,
  );
  const totalScore = Math.round((amalSubtotal + generalRulePts) * 100) / 100;
  const remainingPts = Math.max(0, 100 - amalSubtotal);
  const perRulePts =
    totalRules > 0 ? Math.round((remainingPts / totalRules) * 1000) / 1000 : 0;

  const handleSave = async () => {
    if (alreadySaved) {
      toast.error('এই তারিখে আমল আগেই সংরক্ষিত আছে!');
      return;
    }
    const exMin = +amal.exercise.minutes || 0;
    if (exMin > 0 && exMin < 10) {
      toast.error('ব্যায়াম কমপক্ষে ১০ মিনিট হতে হবে!');
      return;
    }

    setSaving(true);
    try {
      let latestCompleted = completedRules,
        latestUncompleted = uncompletedRules,
        latestTotal = totalRules;
      try {
        const { data } = await API.get('/general-rules');
        const s = data.statusMap || {};
        latestTotal = (data.rules || []).length;
        latestCompleted = Object.values(s).filter(
          (v) => v === 'completed',
        ).length;
        latestUncompleted = Object.values(s).filter(
          (v) => v === 'incompleted',
        ).length;
        setTotalRules(latestTotal);
        setCompletedRules(latestCompleted);
        setUncompletedRules(latestUncompleted);
      } catch {}

      const latestSubtotal = calcAmalSubtotal(amal);
      const latestGrPts = calcGeneralRulePoints(
        latestSubtotal,
        latestCompleted,
        latestUncompleted,
        latestTotal || totalRules,
      );
      const finalTotal = Math.round((latestSubtotal + latestGrPts) * 100) / 100;

      const payload = {
        ...amal,
        salat: Object.fromEntries(
          Object.entries(amal.salat).map(([k, v]) => [k, +v || 0]),
        ),
        quran: { pages: +amal.quran.pages || 0 },
        generalRule: latestGrPts,
        exercise: { minutes: +amal.exercise.minutes || 0 },
        sleep: { hours: +amal.sleep.hours || 0 },
        extra: {
          sokalDua: !!amal.extra.sokalDua,
          dinerTowba: !!amal.extra.dinerTowba,
          sondharDua: !!amal.extra.sondharDua,
        },
      };

      await API.post('/amal', payload);
      try {
        await API.delete('/general-rules/status/reset');
        setCompletedRules(0);
        setUncompletedRules(0);
      } catch {}

      setSavedSummary({
        date: amal.date,
        salatTotal: Object.values(amal.salat).reduce(
          (s, v) => s + (+v || 0),
          0,
        ),
        quranPages: +amal.quran.pages || 0,
        siyam: amal.siyam.foroj ? 'ফরজ' : amal.siyam.nofol ? 'নফল' : 'না',
        amalPts: latestSubtotal,
        grPts: latestGrPts,
        totalPts: finalTotal,
        completedRules: latestCompleted,
        uncompletedRules: latestUncompleted,
        exercise: +amal.exercise.minutes || 0,
        sleep: +amal.sleep.hours || 0,
        extraDone: [
          amal.extra.sokalDua,
          amal.extra.dinerTowba,
          amal.extra.sondharDua,
        ].filter(Boolean).length,
      });

      toast.success('✅ আমল সংরক্ষিত! জাযাকাল্লাহু খাইরান');
      clearDraft();
      setAmalState({ ...EMPTY, date: todayStr() });
      setAlreadySaved(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
    }
    setSaving(false);
  };

  const salatTotal = Object.values(amal.salat).reduce(
    (s, v) => s + (+v || 0),
    0,
  );
  const quranPts = (+amal.quran?.pages || 0) > 0 ? 5 : 0;
  const ptsCls =
    totalScore >= 60
      ? 'score-high'
      : totalScore >= 35
        ? 'score-mid'
        : 'score-low';
  const exMin = +amal.exercise.minutes || 0;
  const extraDone = [
    amal.extra.sokalDua,
    amal.extra.dinerTowba,
    amal.extra.sondharDua,
  ].filter(Boolean).length;

  return (
    <div>
      <style>{`
        .tracker-pts-badge { position: fixed; top: 14px; right: 18px; z-index: 999; box-shadow: 0 2px 12px rgba(0,0,0,0.2); font-size: 13px; transition: opacity 0.25s ease, transform 0.25s ease; }
        .tracker-pts-badge.hidden { opacity: 0; pointer-events: none; transform: translateY(-8px); }
        @media (max-width: 720px) {
          .tracker-pts-badge { top: 10px; left: 12px; right: auto; transform: none; }
          .tracker-pts-badge.hidden { transform: translateY(-8px); }
        }
      `}</style>

      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1>📖 Daily Amal / দৈনিক আমল</h1>
          <p>আজকের ইবাদত রেকর্ড করুন • Record your daily worship</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className={`points-badge ${ptsCls} tracker-pts-badge${showBadge ? '' : ' hidden'}`}
          >
            ✨ {totalScore} / 100 pts
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => {
            loadRuleCounts();
            checkDate(amal.date);
            toast.success('🔄 রিফ্রেশ হয়েছে!');
          }}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ↺ Refresh
        </button>

        {/* ✅ Opens custom modal instead of window.confirm */}
        <button
          className="btn btn-ghost"
          onClick={() => setShowClearModal(true)}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--red2)',
            borderColor: 'var(--red2)',
          }}
        >
          ✕ Input Clear
        </button>

        <div style={{ flex: 1, minWidth: 140 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--text3)',
              marginBottom: 3,
            }}
          >
            <span>Total Progress</span>
            <span>{Math.round(Math.min(100, totalScore))}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill gold"
              style={{ width: `${Math.min(100, totalScore)}%` }}
            />
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/general-rules')}
        >
          📜 General Rules
        </button>
      </div>

      {/* Save Summary Card */}
      {savedSummary && (
        <div
          style={{
            background:
              'linear-gradient(135deg,rgba(45,106,79,.15),rgba(201,168,76,.08))',
            border: '1px solid rgba(201,168,76,.3)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                color: 'var(--gold)',
              }}
            >
              ✅ আমল সংরক্ষিত — {savedSummary.date}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSavedSummary(null)}
            >
              ✕ বন্ধ
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))',
              gap: 10,
            }}
          >
            {[
              { label: '🕌 নামাজ', value: `${savedSummary.salatTotal}/55` },
              { label: '📖 কুরআন', value: `${savedSummary.quranPages} পাতা` },
              { label: '🌙 রোযা', value: savedSummary.siyam },
              { label: '⭐ General', value: `${savedSummary.grPts} pts` },
              { label: '🏃 ব্যায়াম', value: `${savedSummary.exercise} min` },
              { label: '😴 ঘুম', value: `${savedSummary.sleep} hrs` },
              { label: '✨ Extra', value: `${savedSummary.extraDone}/৩` },
              {
                label: '📊 মোট স্কোর',
                value: `${savedSummary.totalPts}/100`,
                highlight: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: 'var(--bg2)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  border: `1px solid ${item.highlight ? 'var(--gold-dim)' : 'var(--border)'}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text3)',
                    fontFamily: 'var(--font-dm)',
                    marginBottom: 3,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: item.highlight ? 'var(--gold)' : 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: 'var(--text3)',
              fontFamily: 'var(--font-bengali)',
            }}
          >
            General Rules reset হয়েছে ✅ — কাল নতুন করে শুরু করুন
          </div>
        </div>
      )}

      {/* Date picker */}
      <div className="card" style={{ padding: '11px 16px', marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label>তারিখ / Date</label>
            <input
              type="date"
              value={amal.date}
              style={{ width: 'auto' }}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: 'flex-end' }}
            onClick={() => handleDateChange(todayStr())}
          >
            আজকে / Today
          </button>
          {alreadySaved && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--gold)',
                background: 'rgba(201,168,76,0.1)',
                border: '1px solid var(--gold-dim)',
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              ⚠️ এই তারিখে আমল আগেই আছে
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay">
          <div className="spinner" /> লোড হচ্ছে...
        </div>
      ) : (
        <>
          {alreadySaved && (
            <div
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid var(--gold-dim)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: 13,
                color: 'var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>📋 এই তারিখের আমল সংরক্ষিত আছে।</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/history')}
              >
                History →
              </button>
            </div>
          )}

          <div className="tracker-grid">
            {/* SALAT */}
            <div className="tracker-section" style={{ gridColumn: 'span 2' }}>
              <div className="tracker-section-title">
                🕌 Salat / নামাজ الصلاة
              </div>
              <div
                className="salat-grid"
                style={{ gridTemplateColumns: 'repeat(6,1fr)' }}
              >
                {SALAT_FIELDS.map((f) => (
                  <div className="salat-item" key={f.key}>
                    <label>
                      {f.label}
                      <br />
                      <span
                        style={{
                          fontFamily: 'var(--font-bengali)',
                          fontSize: 9,
                          color: 'var(--text3)',
                        }}
                      >
                        {f.bn}
                      </span>
                      <br />
                      <span
                        style={{
                          fontFamily: 'var(--font-arabic)',
                          fontSize: 12,
                          color: 'var(--gold-dim)',
                        }}
                      >
                        {f.ar}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={f.max}
                      value={amal.salat[f.key]}
                      placeholder="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          setField(`salat.${f.key}`, '');
                          return;
                        }
                        setField(
                          `salat.${f.key}`,
                          Math.min(f.max, Math.max(0, parseInt(v) || 0)),
                        );
                      }}
                      style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: 15,
                        color:
                          amal.salat[f.key] === ''
                            ? 'var(--text3)'
                            : 'var(--gold)',
                      }}
                    />
                    <div className="progress-bar" style={{ marginTop: 3 }}>
                      <div
                        className="progress-fill gold"
                        style={{
                          width: `${((+amal.salat[f.key] || 0) / f.max) * 100}%`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: 'var(--text3)',
                        textAlign: 'center',
                        marginTop: 2,
                      }}
                    >
                      {+amal.salat[f.key] || 0}/{f.max}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{ marginTop: 8, fontSize: 11, color: 'var(--text2)' }}
              >
                সালাত মোট:{' '}
                <strong style={{ color: 'var(--gold)' }}>{salatTotal}</strong> /
                55 pts
              </div>
            </div>

            {/* QURAN */}
            <div className="tracker-section">
              <div className="tracker-section-title">
                📖 Quran / কুরআন القرآن
              </div>
              <NumInput
                label="Pages Read"
                labelBn="পাতা পড়া"
                value={amal.quran.pages}
                onChange={(v) => setField('quran.pages', v)}
                max={10}
                unit="pg"
                placeholder="0-10"
              />
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text3)',
                  marginTop: 4,
                  lineHeight: 1.6,
                }}
              >
                {(+amal.quran.pages || 0) > 0 ? (
                  <strong style={{ color: 'var(--gold)' }}>
                    ✅ +5 pts অর্জিত!
                  </strong>
                ) : (
                  <span>
                    যেকোনো পাতা ={' '}
                    <strong style={{ color: 'var(--gold)' }}>৫ pts</strong>
                  </span>
                )}
              </div>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div
                  className="progress-fill green"
                  style={{ width: `${((+amal.quran.pages || 0) / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* SIYAM */}
            <div className="tracker-section">
              <div className="tracker-section-title">
                🌙 Siyam / রোযা الصيام
              </div>
              <Toggle
                label="Fard Fast"
                labelBn="ফরজ রোযা"
                arabic="فرض"
                checked={amal.siyam.foroj}
                onChange={(v) => setSiyam('foroj', v)}
              />
              {amal.siyam.foroj && (
                <div
                  style={{
                    margin: '5px 0',
                    padding: '5px 10px',
                    background: 'rgba(82,183,136,0.1)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'var(--green2)',
                  }}
                >
                  +10 পয়েন্ট ✨
                </div>
              )}
              <Toggle
                label="Nafl Fast"
                labelBn="নফল রোযা"
                arabic="نفل"
                checked={amal.siyam.nofol}
                onChange={(v) => setSiyam('nofol', v)}
              />
              {amal.siyam.nofol && (
                <div
                  style={{
                    margin: '5px 0',
                    padding: '5px 10px',
                    background: 'rgba(201,168,76,0.1)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'var(--gold)',
                  }}
                >
                  +5 পয়েন্ট ✨
                </div>
              )}
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text3)',
                  marginTop: 6,
                  fontFamily: 'var(--font-bengali)',
                }}
              >
                ⚠️ ফরজ ও নফল একসাথে নয়
              </div>
            </div>

            {/* GENERAL RULE */}
            <div className="tracker-section">
              <div className="tracker-section-title">
                ⭐ General Rule / সাধারণ নিয়ম
              </div>
              <div
                style={{
                  background: 'var(--bg3)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 8,
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text2)',
                    marginBottom: 4,
                    fontFamily: 'var(--font-bengali)',
                  }}
                >
                  অর্জিত পয়েন্ট
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color:
                      generalRulePts > 0
                        ? 'var(--gold)'
                        : generalRulePts < 0
                          ? 'var(--red2)'
                          : 'var(--text3)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {generalRulePts >= 0 ? '+' : ''}
                  {generalRulePts}{' '}
                  <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                    pts
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text3)',
                    marginTop: 4,
                    lineHeight: 1.7,
                  }}
                >
                  বাকি পয়েন্ট: {remainingPts} ÷ {totalRules} = {perRulePts}
                  /নিয়ম
                  <br />✅ {completedRules} − ❌ {uncompletedRules} = net{' '}
                  {Math.max(0, completedRules - uncompletedRules)} নিয়ম
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                  মোট:{' '}
                  <strong style={{ color: 'var(--gold)', fontSize: 14 }}>
                    {totalScore}
                  </strong>
                  /100
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--gold-dim)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  onClick={() => navigate('/general-rules')}
                >
                  📜 Rules →
                </span>
              </div>
              <div className="progress-bar" style={{ marginTop: 6 }}>
                <div
                  className="progress-fill gold"
                  style={{
                    width: `${Math.min(100, remainingPts > 0 ? (generalRulePts / remainingPts) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* EXERCISE */}
            <div className="tracker-section">
              <div className="tracker-section-title">
                🏃 Exercise / ব্যায়াম
              </div>
              <div className="form-group">
                <label>
                  Minutes{' '}
                  <span
                    style={{
                      fontWeight: 400,
                      color: 'var(--text3)',
                      fontFamily: 'var(--font-bengali)',
                      marginLeft: 4,
                    }}
                  >
                    / মিনিট
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min={10}
                    value={amal.exercise.minutes}
                    placeholder="১০–৩০+"
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setField('exercise.minutes', '');
                        return;
                      }
                      const n = parseInt(raw);
                      if (isNaN(n)) return;
                      setField('exercise.minutes', n);
                    }}
                    onBlur={() => {
                      const n = +amal.exercise.minutes;
                      if (n > 0 && n < 10) {
                        toast.error('ব্যায়াম কমপক্ষে ১০ মিনিট!');
                        setField('exercise.minutes', '');
                      }
                    }}
                    style={{
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 16,
                      color:
                        amal.exercise.minutes === ''
                          ? 'var(--text3)'
                          : exMin >= 30
                            ? 'var(--green2)'
                            : 'var(--gold)',
                    }}
                  />
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}>
                    min
                  </span>
                </div>
              </div>
              <div className="progress-bar" style={{ marginTop: 6 }}>
                <div
                  className="progress-fill green"
                  style={{ width: `${Math.min(100, (exMin / 30) * 100)}%` }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text3)',
                  marginTop: 3,
                  fontFamily: 'var(--font-bengali)',
                }}
              >
                {exMin >= 30 ? (
                  <strong style={{ color: 'var(--green2)' }}>
                    ✅ লক্ষ্য অর্জিত!
                  </strong>
                ) : exMin >= 10 ? (
                  `${30 - exMin} মিনিট বাকি`
                ) : (
                  <span>
                    লক্ষ্য:{' '}
                    <strong style={{ color: 'var(--gold)' }}>৩০ মিনিট</strong>
                  </span>
                )}
              </div>
            </div>

            {/* SLEEP */}
            <div className="tracker-section">
              <div className="tracker-section-title">😴 Sleep / ঘুম</div>
              <NumInput
                label="Hours"
                labelBn="ঘণ্টা"
                value={amal.sleep.hours}
                onChange={(v) => setField('sleep.hours', v)}
                max={24}
                step={0.5}
                unit="hrs"
                placeholder="০"
              />
              <div className="progress-bar" style={{ marginTop: 6 }}>
                <div
                  className="progress-fill gold"
                  style={{
                    width: `${Math.min(100, ((+amal.sleep.hours || 0) / 8) * 100)}%`,
                  }}
                />
              </div>
              <div
                style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}
              >
                {(+amal.sleep.hours || 0) >= 7
                  ? '✅ ভালো ঘুম'
                  : (+amal.sleep.hours || 0) >= 5
                    ? '⚠️ মাঝামাঝি'
                    : '❗ অপর্যাপ্ত'}
              </div>
            </div>

            {/* EXTRA IBADAH */}
            <div className="tracker-section">
              <div className="tracker-section-title">
                ✨ Extra Ibadah / অতিরিক্ত ইবাদত
              </div>
              <Toggle
                label="সকালের দোয়া"
                arabic="أذكار الصباح"
                checked={!!amal.extra.sokalDua}
                onChange={(v) => setField('extra.sokalDua', v)}
              />
              {amal.extra.sokalDua && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--green2)',
                    marginBottom: 2,
                    paddingLeft: 2,
                  }}
                >
                  +2 pts ✨
                </div>
              )}
              <div style={{ height: 4 }} />
              <Toggle
                label="দিনের তওবা"
                arabic="التوبة"
                checked={!!amal.extra.dinerTowba}
                onChange={(v) => setField('extra.dinerTowba', v)}
              />
              {amal.extra.dinerTowba && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--green2)',
                    marginBottom: 2,
                    paddingLeft: 2,
                  }}
                >
                  +2 pts ✨
                </div>
              )}
              <div style={{ height: 4 }} />
              <Toggle
                label="সন্ধ্যার দোয়া"
                arabic="أذكار المساء"
                checked={!!amal.extra.sondharDua}
                onChange={(v) => setField('extra.sondharDua', v)}
              />
              {amal.extra.sondharDua && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--green2)',
                    marginBottom: 2,
                    paddingLeft: 2,
                  }}
                >
                  +2 pts ✨
                </div>
              )}
              <div
                style={{
                  marginTop: 10,
                  padding: '6px 10px',
                  background:
                    extraDone > 0 ? 'rgba(82,183,136,0.08)' : 'transparent',
                  borderRadius: 6,
                  border:
                    extraDone > 0 ? '1px solid rgba(82,183,136,0.2)' : 'none',
                  fontSize: 11,
                  color: 'var(--text3)',
                  fontFamily: 'var(--font-bengali)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  {extraDone} / ৩ সম্পন্ন{' '}
                  {extraDone === 3 && (
                    <strong style={{ color: 'var(--green2)' }}>✅</strong>
                  )}
                </span>
                {extraDone > 0 && (
                  <strong
                    style={{
                      color: 'var(--green2)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    +{extraDone * 2} pts
                  </strong>
                )}
              </div>
            </div>

            {/* REMARKS */}
            <div className="tracker-section" style={{ gridColumn: 'span 2' }}>
              <div className="tracker-section-title">📝 Remarks / মন্তব্য</div>
              <textarea
                rows={3}
                value={amal.remarks}
                onChange={(e) =>
                  setAmal((p) => ({ ...p, remarks: e.target.value }))
                }
                placeholder="আজকের প্রতিফলন, নোট..."
              />
            </div>
          </div>

          {/* Bottom score bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 12,
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--text2)',
                fontFamily: 'var(--font-dm)',
                lineHeight: 1.9,
              }}
            >
              🕌 <strong style={{ color: 'var(--gold)' }}>{salatTotal}</strong>
              /55 &nbsp;|&nbsp; 📖{' '}
              <strong style={{ color: 'var(--gold)' }}>{quranPts}</strong>/5
              &nbsp;|&nbsp; 🌙{' '}
              <strong style={{ color: 'var(--gold)' }}>
                {(amal.siyam.foroj ? 10 : 0) + (amal.siyam.nofol ? 5 : 0)}
              </strong>
              /15 &nbsp;|&nbsp; ✨{' '}
              <strong style={{ color: 'var(--green2)' }}>
                {extraDone * 2}
              </strong>
              /6 &nbsp;|&nbsp; ⭐{' '}
              <strong style={{ color: 'var(--gold)' }}>{generalRulePts}</strong>{' '}
              &nbsp;|&nbsp; ✅{' '}
              <strong style={{ color: 'var(--green2)' }}>{totalScore}</strong>
              /100
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div
                className={`points-badge ${ptsCls}`}
                style={{ fontSize: 16 }}
              >
                {totalScore} / 100
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '11px 28px', fontSize: 14 }}
              >
                {saving ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 Save Amal'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ✅ Input Clear Confirmation Modal */}
      {showClearModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowClearModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2 className="modal-title">🗑️ Input Clear করবেন?</h2>
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  color: 'var(--text2)',
                  marginBottom: 12,
                  lineHeight: 1.6,
                  fontFamily: 'var(--font-bengali)',
                }}
              >
                আজকের সব input মুছে যাবে। তারিখ অপরিবর্তিত থাকবে।
              </p>
              <div
                style={{
                  background: 'rgba(248,113,113,0.06)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: 8,
                  padding: '10px 14px',
                }}
              >
                {[
                  '🕌 নামাজের সব ঘর',
                  '📖 কুরআনের পাতা',
                  '🌙 রোযার তথ্য',
                  '✨ Extra Ibadah (সকাল / তওবা / সন্ধ্যা)',
                  '🏃 ব্যায়াম ও 😴 ঘুম',
                  '📝 মন্তব্য',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      fontSize: 12,
                      color: '#f87171',
                      display: 'flex',
                      gap: 6,
                      marginBottom: 4,
                      fontFamily: 'var(--font-bengali)',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>✕</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setShowClearModal(false)}
              >
                বাতিল
              </button>
              <button className="btn btn-danger" onClick={handleClearConfirmed}>
                🗑️ Clear করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
