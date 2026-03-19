import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthProvider, { useAuth } from './context/AuthContext';
import ThemeProvider from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/Tracker';
import History from './pages/History';
import Admin from './pages/Admin';
import GeneralRules from './pages/GeneralRules';
import FoodControl from './pages/FoodControl';
import Principles from './pages/Principles';
import WorkPlans from './pages/WorkPlans';
import Formulas from './pages/Formulas';
import Settings from './pages/Settings';
import './index.css';

// ── Dynamic page titles ───────────────────────────────────
const PAGE_TITLES = {
  '/': 'Dashboard | myAmal',
  '/tracker': 'দৈনিক আমল | myAmal',
  '/history': 'ইতিহাস | myAmal',
  '/general-rules': 'সাধারণ নিয়ম | myAmal',
  '/food-control': 'খাদ্য নিয়ন্ত্রণ | myAmal',
  '/principles': 'নীতিমালা | myAmal',
  '/work-plans': 'কাজের পরিকল্পনা | myAmal',
  '/formulas': 'ফর্মুলা | myAmal',
  '/settings': 'সেটিংস | myAmal',
  '/admin': 'Admin Panel | myAmal',
  '/login': 'Login | myAmal',
};

function TitleUpdater() {
  const loc = useLocation();
  useEffect(() => {
    document.title = PAGE_TITLES[loc.pathname] || 'myAmal | আমল ট্র্যাকার';
  }, [loc.pathname]);
  return null;
}

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="splash">
        <div className="splash-spinner" />
      </div>
    );
  return user ? children : <Navigate to="/login" />;
};

const AdminProtected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="splash">
        <div className="splash-spinner" />
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  if (!user.isAdmin) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tracker" element={<Tracker />} />
        <Route path="history" element={<History />} />
        <Route path="general-rules" element={<GeneralRules />} />
        <Route path="food-control" element={<FoodControl />} />
        <Route path="principles" element={<Principles />} />
        <Route path="work-plans" element={<WorkPlans />} />
        <Route path="formulas" element={<Formulas />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="admin"
          element={
            <AdminProtected>
              <Admin />
            </AdminProtected>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TitleUpdater />
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg2)',
                color: 'var(--text)',
                border: '1px solid var(--gold-dim)',
                fontFamily: "'Noto Sans Bengali', sans-serif",
              },
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
