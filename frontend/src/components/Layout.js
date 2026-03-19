import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_MAIN = [
  { to: '/', icon: '🕌', en: 'Dashboard', bn: 'ড্যাশবোর্ড', end: true },
  { to: '/tracker', icon: '📖', en: 'Daily Tracker', bn: 'দৈনিক আমল' },
  { to: '/history', icon: '📋', en: 'History', bn: 'ইতিহাস' },
];
const NAV_MYLOS = [
  { to: '/general-rules', icon: '📜', en: 'General Rules', bn: 'সাধারণ নিয়ম' },
  {
    to: '/food-control',
    icon: '🥗',
    en: 'Food Controls',
    bn: 'খাদ্য নিয়ন্ত্রণ',
  },
  { to: '/principles', icon: '⚖️', en: 'Principles', bn: 'নীতিমালা' },
  { to: '/work-plans', icon: '🗓️', en: 'Work Plans', bn: 'কাজের পরিকল্পনা' },
  { to: '/formulas', icon: '✦', en: 'Formulas', bn: 'ফর্মুলা' },
  { to: '/settings', icon: '⚙️', en: 'Settings', bn: 'সেটিংস' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon, en, bn, end }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <span className="nav-icon">{icon}</span>
      <span>
        {en}{' '}
        <span
          style={{
            fontSize: 10,
            color: 'var(--text3)',
            fontFamily: 'var(--font-bengali)',
          }}
        >
          {bn}
        </span>
      </span>
    </NavLink>
  );

  const MobileNavItem = ({ to, icon, en, end }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `mobile-nav-item${isActive ? ' active' : ''}`
      }
    >
      <span className="mnav-icon">{icon}</span>
      {en}
    </NavLink>
  );

  return (
    <div className="layout">
      {/* Mobile header */}
      <header className="mobile-header" style={{ position: 'relative' }}>
        <span
          className="mobile-header-title"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          بِسْمِ اللَّهِ
        </span>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 7,
            alignItems: 'center',
          }}
        >
          <button
            className="theme-toggle-btn"
            style={{ width: 'auto', padding: '4px 9px', marginBottom: 0 }}
            onClick={toggle}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="mobile-header-user">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            ⟵
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="arabic-title">بِسْمِ اللَّهِ</span>
          <span className="en-title">My Amal Tracker</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main আমল</div>
          {NAV_MAIN.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}

          <div className="nav-section-label" style={{ marginTop: 6 }}>
            Life System জীবন ব্যবস্থা
          </div>
          {NAV_MYLOS.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}

          {user?.isAdmin && (
            <>
              <div className="nav-section-label" style={{ marginTop: 6 }}>
                Admin
              </div>
              <NavItem to="/admin" icon="🛡️" en="Admin Panel" bn="অ্যাডমিন" />
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggle}>
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            <span
              style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 3 }}
            >
              {theme === 'dark' ? 'লাইট' : 'ডার্ক'}
            </span>
          </button>
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div
                className="user-email"
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {user?.isAdmin && <span className="admin-badge">Admin</span>}
                {!user?.isAdmin && (
                  <span style={{ fontSize: 10 }}>{user?.email}</span>
                )}
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%' }}
            onClick={handleLogout}
          >
            ⟵ Logout / লগআউট
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV_MAIN.map((n) => (
            <MobileNavItem key={n.to} {...n} />
          ))}
          {NAV_MYLOS.map((n) => (
            <MobileNavItem key={n.to} {...n} />
          ))}
          {user?.isAdmin && <MobileNavItem to="/admin" icon="🛡️" en="Admin" />}
        </div>
      </nav>
    </div>
  );
}
