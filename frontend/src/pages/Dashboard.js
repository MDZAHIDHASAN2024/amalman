import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Link } from 'react-router-dom';
import API, { downloadFile } from '../utils/api';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const HADITHS = [
  {
    text: 'الصَّلَاةُ عِمَادُ الدِّينِ',
    translation: 'নামাজ হলো দ্বীনের স্তম্ভ।',
    source: 'আল-বায়হাক্বী',
  },
  {
    text: 'مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ حَسَنَةٌ',
    translation:
      'যে আল্লাহর কিতাব থেকে একটি হরফ পড়ে, তার জন্য একটি সওয়াব আছে।',
    source: 'তিরমিযী',
  },
  {
    text: 'الصِّيَامُ جُنَّةٌ',
    translation: 'রোযা হলো ঢাল।',
    source: 'বুখারী ও মুসলিম',
  },
  {
    text: 'أَفْضَلُ الذِّكْرِ لَا إِلَهَ إِلَّا اللَّهُ',
    translation: 'সর্বোত্তম যিকর হলো: লা ইলাহা ইল্লাল্লাহ।',
    source: 'তিরমিযী',
  },
  {
    text: 'مَنْ صَلَّى الصُّبْحَ فَهُوَ فِي ذِمَّةِ اللَّهِ',
    translation: 'যে ফজর নামাজ পড়ে, সে আল্লাহর আশ্রয়ে থাকে।',
    source: 'মুসলিম',
  },
  {
    text: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    translation: 'তোমাদের মধ্যে সর্বোত্তম যে কুরআন শেখে ও শেখায়।',
    source: 'বুখারী',
  },
  {
    text: 'تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً',
    translation: 'সেহরি খাও, কারণ সেহরিতে বরকত আছে।',
    source: 'বুখারী ও মুসলিম',
  },
];

function getHijri() {
  try {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  } catch {
    return '';
  }
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const hadith = HADITHS[new Date().getDay() % HADITHS.length];
  const hijri = getHijri();
  const years = [];
  for (let y = 2020; y <= new Date().getFullYear() + 1; y++) years.push(y);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: d } = await API.get(`/stats/dashboard?year=${year}`);
      setData(d);
    } catch {
      toast.error('স্ট্যাটস লোড ব্যর্থ');
    }
    setLoading(false);
  };

  const handleExport = async (type) => {
    const ext = type === 'excel' ? 'xlsx' : 'pdf';
    toast.loading(`তৈরি হচ্ছে...`);
    try {
      await downloadFile(
        `/reports/${type}?year=${year}`,
        `amal_${year}.${ext}`,
      );
      toast.dismiss();
      toast.success('ডাউনলোড হয়েছে!');
    } catch {
      toast.dismiss();
      toast.error('ব্যর্থ হয়েছে');
    }
  };

  const monthlyChart = MONTH_NAMES.map((name, i) => {
    const m = data?.monthly?.find((x) => x.month === i + 1);
    return {
      name,
      points: m?.totalPoints || 0,
      days: m?.days || 0,
      pages: m?.quranPages || 0,
      // ✅ Salat total per month (sum of all 5 prayers + tahajjud)
      salat: m?.salatTotal || 0,
    };
  });
  const totals = data?.totals || {};

  // Custom tooltip for Salat chart
  const SalatTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 11,
          }}
        >
          <div
            style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}
          >
            {label}
          </div>
          <div style={{ color: '#52b788' }}>
            🕌 নামাজ: <strong>{payload[0].value}</strong> pts
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
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
          <h1>🕌 Dashboard / ড্যাশবোর্ড</h1>
          <p>{year} সালের আধ্যাত্মিক পর্যালোচনা</p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={{ width: 'auto', padding: '7px 11px' }}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleExport('excel')}
          >
            📊 Excel
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleExport('pdf')}
          >
            📄 PDF
          </button>
        </div>
      </div>

      {hijri && (
        <div className="hijri-display" style={{ marginBottom: 8 }}>
          🌙 {hijri}
        </div>
      )}

      <div className="hadith-card">
        <p className="hadith-text">{hadith.text}</p>
        <p className="hadith-translation">"{hadith.translation}"</p>
        <p className="hadith-source">— {hadith.source}</p>
      </div>

      {loading ? (
        <div className="loading-overlay">
          <div className="spinner" /> লোড হচ্ছে...
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card gold">
              <div className="stat-label">মোট পয়েন্ট / Total Points</div>
              <div className="stat-value">{totals.totalPoints || 0}</div>
              <div className="stat-sub">
                গড়/দিন:{' '}
                {totals.days ? Math.round(totals.totalPoints / totals.days) : 0}
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">🔥 ধারাবাহিক দিন / Streak</div>
              <div className="stat-value">{totals.streak || 0}</div>
              <div className="stat-sub">consecutive days</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">📖 কুরআন পাতা / Pages</div>
              <div className="stat-value">{totals.quranPages || 0}</div>
              <div className="stat-sub">
                ~{Math.round((totals.quranPages || 0) / 20)} জুয
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">🌙 রোযার দিন / Fast Days</div>
              <div className="stat-value">{totals.fastDays || 0}</div>
              <div className="stat-sub">এই বছর</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-label">🏃 ব্যায়াম / Exercise</div>
              <div className="stat-value">
                {Math.round((totals.exerciseMinutes || 0) / 60)}h
              </div>
              <div className="stat-sub">
                {totals.exerciseMinutes || 0} মিনিট মোট
              </div>
            </div>
            <div className="stat-card gold">
              <div className="stat-label">😴 গড় ঘুম / Avg Sleep</div>
              <div className="stat-value">{totals.avgSleep || 0}h</div>
              <div className="stat-sub">প্রতি রাতে গড়</div>
            </div>
          </div>

          <div className="chart-grid">
            {/* ✅ Salat chart — replaces Monthly Points */}
            <div className="card">
              <div className="card-title">🕌 Salat / নামাজ</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={monthlyChart}
                  margin={{ top: 0, right: 0, left: -22, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: 'var(--text2)' }}
                  />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text2)' }} />
                  <Tooltip content={<SalatTooltip />} />
                  <Bar
                    dataKey="salat"
                    fill="#52b788"
                    radius={[4, 4, 0, 0]}
                    name="নামাজ"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quran chart — unchanged */}
            <div className="card">
              <div className="card-title">📖 কুরআন পাতা / Quran Pages</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={monthlyChart}
                  margin={{ top: 0, right: 0, left: -22, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: 'var(--text2)' }}
                  />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text2)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pages"
                    stroke="#52b788"
                    strokeWidth={2}
                    dot={{ fill: '#52b788', r: 3 }}
                    name="Pages"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {data?.recent?.length > 0 && (
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <div className="card-title" style={{ margin: 0 }}>
                  🕐 সাম্প্রতিক ৭ দিন / Recent 7 Days
                </div>
                <Link to="/tracker" className="btn btn-ghost btn-sm">
                  + আজকের আমল
                </Link>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>তারিখ</th>
                      <th>নামাজ</th>
                      <th>কুরআন</th>
                      <th>রোযা</th>
                      <th>ব্যায়াম</th>
                      <th>ঘুম</th>
                      <th>পয়েন্ট</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((r) => {
                      const pts = r.totalPoints || 0;
                      const ptsCls =
                        pts >= 60
                          ? 'score-high'
                          : pts >= 35
                            ? 'score-mid'
                            : 'score-low';
                      const salatTotal = Object.values(r.salat || {}).reduce(
                        (s, v) => s + (v || 0),
                        0,
                      );
                      return (
                        <tr key={r._id}>
                          <td style={{ color: 'var(--text2)', fontSize: 11 }}>
                            {new Date(r.date).toLocaleDateString('en-GB')}
                          </td>
                          <td style={{ fontWeight: 600 }}>{salatTotal}</td>
                          <td>{r.quran?.pages || 0} pg</td>
                          <td>
                            {r.siyam?.foroj
                              ? '✅'
                              : r.siyam?.nofol
                                ? '🟡'
                                : '—'}
                          </td>
                          <td>{r.exercise?.minutes || 0}m</td>
                          <td>{r.sleep?.hours || 0}h</td>
                          <td className={`pts-cell ${ptsCls}`}>{pts}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
