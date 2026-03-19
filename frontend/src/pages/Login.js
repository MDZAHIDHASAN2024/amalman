import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      toast.success(
        tab === 'login'
          ? '🌙 স্বাগতম! Welcome back!'
          : '✨ অ্যাকাউন্ট তৈরি হয়েছে!',
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'কিছু একটা ভুল হয়েছে');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <span className="ar">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</span>
          <span className="en">Islamic Amal Tracker • আমল ট্র্যাকার</span>
        </div>
        <div className="ornament">✦ ✦ ✦</div>
        <div style={{ margin: '14px 0' }} />
        <div className="login-tabs">
          <div
            className={`login-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => setTab('login')}
          >
            Login / লগইন
          </div>
          <div
            className={`login-tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => setTab('register')}
          >
            Register / রেজিস্টার
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label>নাম / Name</label>
              <input
                type="text"
                placeholder="Your Name"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>ইমেইল / Email</label>
            <input
              type="email"
              placeholder="Your Email"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>
          <div className="form-group">
            <label>পাসওয়ার্ড / Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading
              ? '⏳ ...'
              : tab === 'login'
                ? '🌙 প্রবেশ করুন / Enter'
                : '✨ অ্যাকাউন্ট তৈরি করুন'}
          </button>
        </form>
        <div className="ornament" style={{ marginTop: 18 }}>
          الحمد لله
        </div>
      </div>
    </div>
  );
}
