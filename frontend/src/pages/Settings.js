import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { user: me, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  // Import/Export
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const fileRef = useRef();

  // Delete my data confirm
  const [deleteMyData, setDeleteMyData] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Admin
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [sessionInfo, setSessionInfo] = useState({ lastActive: null });
  const isAdmin = me?.isAdmin;

  useEffect(() => {
    if (isAdmin) fetchUsers();
    const la = sessionStorage.getItem('amal_last_active');
    if (la) setSessionInfo({ lastActive: new Date(parseInt(la)) });
  }, [isAdmin]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch {
      toast.error('Users লোড ব্যর্থ');
    }
    setUsersLoading(false);
  };

  const handleBan = async (id, ban) => {
    try {
      await API.patch(`/admin/users/${id}`, { banned: ban });
      toast.success(
        ban ? '🚫 ব্যান করা হয়েছে' : '✅ ব্যান তুলে নেওয়া হয়েছে',
      );
      fetchUsers();
    } catch {
      toast.error('ব্যর্থ হয়েছে');
    }
  };

  const handleAdminDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await API.delete(`/admin/users/${deleteConfirm.id}`);
      toast.success(`"${deleteConfirm.name}" এবং সব ডেটা মুছে গেছে।`);
      setDeleteConfirm(null);
      fetchUsers();
    } catch {
      toast.error('Delete ব্যর্থ');
    }
  };

  // ── Export ────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await API.get('/settings/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `myamal_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export সম্পন্ন!');
    } catch {
      toast.error('Export ব্যর্থ হয়েছে।');
    }
  };

  // ── File Select — শুধু parse করবে, upload করবে না ────
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);
    setParsedData(null);
    setSelectedFile(null);

    // ✅ Step 1: read text
    let text;
    try {
      text = await file.text();
    } catch {
      toast.error('ফাইল পড়তে ব্যর্থ।');
      e.target.value = '';
      return;
    }

    // parse JSON
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      toast.error('Invalid JSON file');
      e.target.value = '';
      return;
    }

    // normalize — array or object both accepted
    let normalized = json;
    if (Array.isArray(json)) {
      normalized = { amals: json, rules: [] };
    } else if (!json || typeof json !== 'object') {
      normalized = { amals: [], rules: [] };
    }
    if (!normalized.amals) normalized.amals = [];
    if (!normalized.rules) normalized.rules = [];

    const amalCount = normalized.amals.length;
    const ruleCount = normalized.rules.length;
    setSelectedFile(file);
    setParsedData(normalized);
    toast.success(
      'File selected — Amal: ' + amalCount + ', Rules: ' + ruleCount,
    );
  };

  // ── Upload Data — actual API call ─────────────────────
  const handleUpload = async () => {
    if (!parsedData) {
      toast.error('আগে ফাইল নির্বাচন করুন।');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      // ✅ Strip MongoDB fields before sending
      const cleanAmals = (parsedData.amals || []).map(
        ({ _id, __v, user, id, ...rest }) => rest,
      );
      const cleanRules = (parsedData.rules || []).map(
        ({ _id, __v, user, id, ...rest }) => rest,
      );

      const { data } = await API.post('/settings/import', {
        ...parsedData,
        amals: cleanAmals,
        rules: cleanRules,
      });

      setImportResult(data.imported);
      toast.success(
        `✅ Import সম্পন্ন! আমল: ${data.imported.amals}টি, নিয়ম: ${data.imported.rules}টি`,
      );
      setSelectedFile(null);
      setParsedData(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Import ব্যর্থ — আবার চেষ্টা করুন।',
      );
    }
    setImporting(false);
  };

  // ── Delete my own data ────────────────────────────────
  const handleDeleteMyData = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'delete') {
      toast.error('"delete" লিখুন নিশ্চিত করতে।');
      return;
    }
    try {
      await API.delete('/settings/my-data');
      toast.success('সব ডেটা মুছে গেছে। Account চালু আছে।');
      setDeleteMyData(false);
      setDeleteConfirmText('');
    } catch {
      toast.error('Delete ব্যর্থ হয়েছে।');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ Settings / সেটিংস</h1>
        <p>App পরিচালনা ও নিরাপত্তা</p>
      </div>

      {/* ── Profile ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">👤 Profile / প্রোফাইল</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--gold-bg)',
              border: '2px solid var(--gold-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--gold)',
              flexShrink: 0,
            }}
          >
            {me?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div
              style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}
            >
              {me?.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {me?.email}
            </div>
            {isAdmin && (
              <span
                style={{
                  fontSize: 10,
                  background: 'var(--gold)',
                  color: 'var(--bg)',
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontWeight: 700,
                  marginTop: 4,
                  display: 'inline-block',
                }}
              >
                ADMIN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Theme ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">🎨 Appearance / থিম</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}
            >
              {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text3)',
                marginTop: 2,
                fontFamily: 'var(--font-bengali)',
              }}
            >
              {theme === 'dark' ? 'ডার্ক মোড চালু' : 'লাইট মোড চালু'}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={toggle}>
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>

      {/* ── Export ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">📤 Export Data / ডেটা রপ্তানি</div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text2)',
            marginBottom: 14,
            lineHeight: 1.6,
            fontFamily: 'var(--font-bengali)',
          }}
        >
          আপনার সমস্ত আমল রেকর্ড ও নিয়মসমূহ JSON ফরম্যাটে ডাউনলোড করুন। ব্যাকআপ
          বা অন্য ডিভাইসে ব্যবহারের জন্য।
        </p>
        <button className="btn btn-primary" onClick={handleExport}>
          📥 JSON Export করুন
        </button>
      </div>

      {/* ── Import ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">📥 Import Data / ডেটা আমদানি</div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text2)',
            marginBottom: 14,
            lineHeight: 1.6,
            fontFamily: 'var(--font-bengali)',
          }}
        >
          আগে export করা JSON ফাইল থেকে ডেটা আমদানি করুন। একই তারিখের আমল
          দ্বিতীয়বার import হবে না।
        </p>

        {/* Step 1: File select button */}
        <div style={{ marginBottom: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            📂 JSON ফাইল বেছে নিন
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>

        {/* Step 2: File selected — show info + Upload button */}
        {selectedFile && parsedData && (
          <div
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--gold)',
                    fontWeight: 600,
                    marginBottom: 3,
                  }}
                >
                  📄 {selectedFile.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text3)',
                    fontFamily: 'var(--font-bengali)',
                  }}
                >
                  আমল:{' '}
                  <strong style={{ color: 'var(--text2)' }}>
                    {Array.isArray(parsedData.amals)
                      ? parsedData.amals.length
                      : 0}
                    টি
                  </strong>
                  &nbsp;|&nbsp; নিয়ম:{' '}
                  <strong style={{ color: 'var(--text2)' }}>
                    {Array.isArray(parsedData.rules)
                      ? parsedData.rules.length
                      : 0}
                    টি
                  </strong>
                  {parsedData.exportedAt && (
                    <>
                      &nbsp;|&nbsp; Export:{' '}
                      <strong style={{ color: 'var(--text2)' }}>
                        {new Date(parsedData.exportedAt).toLocaleDateString(
                          'bn-BD',
                        )}
                      </strong>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* ✅ Upload Data button */}
                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={importing}
                  style={{ padding: '8px 20px' }}
                >
                  {importing ? '⏳ Upload হচ্ছে...' : '⬆️ Upload Data'}
                </button>
                {/* Cancel */}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setParsedData(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  disabled={importing}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import result */}
        {importResult && (
          <div
            style={{
              marginTop: 4,
              padding: '10px 14px',
              background: 'rgba(82,183,136,0.1)',
              border: '1px solid rgba(82,183,136,0.3)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--green2)',
              fontFamily: 'var(--font-bengali)',
            }}
          >
            ✅ Import সম্পন্ন — আমল: {importResult.amals}টি, নিয়ম:{' '}
            {importResult.rules}টি যোগ হয়েছে।
          </div>
        )}
      </div>

      {/* ── Delete My Data ── */}
      <div
        className="card"
        style={{ marginBottom: 16, borderColor: 'rgba(248,113,113,0.3)' }}
      >
        <div className="card-title" style={{ color: '#f87171' }}>
          🗑️ Delete My Data / আমার ডেটা মুছুন
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text2)',
            marginBottom: 14,
            lineHeight: 1.6,
            fontFamily: 'var(--font-bengali)',
          }}
        >
          আপনার সকল ডেটা স্থায়ীভাবে মুছে যাবে। তবে{' '}
          <strong style={{ color: 'var(--text)' }}>Account চালু থাকবে</strong> —
          আবার নতুনভাবে শুরু করতে পারবেন।
        </p>
        <div
          style={{
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
          }}
        >
          {['সকল আমল রেকর্ড', 'সকল General Rules', 'Rule Statuses'].map(
            (item) => (
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
            ),
          )}
          <div
            style={{
              fontSize: 12,
              color: 'var(--green2)',
              display: 'flex',
              gap: 6,
              marginTop: 6,
            }}
          >
            <span>✅</span> Account ও Login তথ্য অক্ষত থাকবে
          </div>
        </div>
        {!deleteMyData ? (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setDeleteMyData(true)}
          >
            ⚠️ সব ডেটা মুছুন
          </button>
        ) : (
          <div>
            <p
              style={{
                fontSize: 12,
                color: '#f87171',
                marginBottom: 8,
                fontFamily: 'var(--font-bengali)',
              }}
            >
              নিশ্চিত করতে নিচে <strong>"delete"</strong> লিখুন:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete লিখুন..."
                style={{ flex: 1, borderColor: 'rgba(248,113,113,0.5)' }}
              />
              <button className="btn btn-danger" onClick={handleDeleteMyData}>
                🗑️ নিশ্চিত
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setDeleteMyData(false);
                  setDeleteConfirmText('');
                }}
              >
                বাতিল
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── App Info ── */}
      <div className="card">
        <div className="card-title">ℹ️ App Info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            {
              label: 'App Name',
              value: 'MyAmal-Tracker | Developed by Zahid Hasan | 01745940065',
            },
            { label: 'Version', value: '0.1.0' },
            { label: 'Session', value: 'Browser বন্ধে auto logout' },
            { label: 'Inactivity', value: '২০ মিনিট' },
            { label: 'Data Format', value: 'JSON (import/export)' },
            { label: 'Max Rules', value: '১০০ টি নিয়ম' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '9px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text3)' }}>{item.label}</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Admin Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2 className="modal-title">⚠️ User Delete করবেন?</h2>
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  color: 'var(--text2)',
                  marginBottom: 10,
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: 'var(--text)' }}>
                  "{deleteConfirm.name}"
                </strong>{' '}
                এবং তার সমস্ত ডেটা স্থায়ীভাবে মুছে যাবে:
              </p>
              <div
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  borderRadius: 8,
                  padding: '10px 14px',
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
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
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
                  marginTop: 10,
                  fontFamily: 'var(--font-bengali)',
                }}
              >
                ⚠️ এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না!
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                বাতিল
              </button>
              <button className="btn btn-danger" onClick={handleAdminDelete}>
                🗑️ সব মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
