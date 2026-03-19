import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import API from '../utils/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// ── Storage keys ─────────────────────────────────────────
const TOKEN_KEY = 'amal_token'; // localStorage — shared across tabs
const LOGIN_FLAG_KEY = 'amal_logged_in'; // localStorage — set on login, cleared on logout
const ACTIVITY_KEY = 'amal_last_active'; // localStorage — tracks last activity time
const INACTIVITY_MS = 20 * 60 * 1000; // 20 minutes

// ── Helpers ──────────────────────────────────────────────
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => {
  localStorage.setItem(TOKEN_KEY, t);
  localStorage.setItem(LOGIN_FLAG_KEY, '1');
};
const clearAll = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LOGIN_FLAG_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
  localStorage.removeItem('amal_hidden_at');
};
const touchActivity = () =>
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
const isLoggedIn = () => !!localStorage.getItem(LOGIN_FLAG_KEY);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const logoutRef = useRef(null);

  // ── Logout ───────────────────────────────────────────
  const logout = useCallback(() => {
    clearAll();
    setUser(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  logoutRef.current = logout;

  // ── Reset inactivity timer ────────────────────────────
  const resetTimer = useCallback(() => {
    touchActivity();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => logoutRef.current?.(), INACTIVITY_MS);
  }, []);

  // ── On mount: restore session ─────────────────────────
  useEffect(() => {
    const token = getToken();

    if (token) {
      // Token আছে — verify করো
      API.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          resetTimer();
        })
        .catch(() => {
          clearAll();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Browser close vs refresh detection:
    // Refresh করলে sessionStorage টিকে থাকে কিন্তু browser বন্ধ করলে যায়।
    // তাই sessionStorage এ একটা flag রাখি।
    // - Refresh: sessionStorage flag আছে → token রাখো
    // - Browser close করে নতুন খোলা: sessionStorage flag নেই → token clear

    const SESSION_ALIVE = 'amal_sess';
    sessionStorage.setItem(SESSION_ALIVE, '1');

    return () => {};
  }, [resetTimer]);

  // ── Activity tracking ─────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];
    const handler = () => resetTimer();
    events.forEach((e) =>
      window.addEventListener(e, handler, { passive: true }),
    );
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);

  // ── Mobile background (visibilitychange) ─────────────
  useEffect(() => {
    if (!user) return;
    const handleVis = () => {
      if (document.hidden) {
        localStorage.setItem('amal_hidden_at', Date.now().toString());
      } else {
        const hiddenAt = parseInt(
          localStorage.getItem('amal_hidden_at') || '0',
        );
        const hiddenFor = Date.now() - hiddenAt;
        localStorage.removeItem('amal_hidden_at');
        if (hiddenAt > 0 && hiddenFor >= INACTIVITY_MS) {
          logoutRef.current?.();
        } else {
          resetTimer();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [user, resetTimer]);

  // ── Storage/cache clear detection ────────────────────
  useEffect(() => {
    const pollId = setInterval(() => {
      if (user && !getToken()) logoutRef.current?.();
    }, 2000);
    const handleStorage = (e) => {
      // অন্য tab logout করলে এই tab ও logout হবে
      if (e.key === TOKEN_KEY && !e.newValue && user) {
        setUser(null);
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(pollId);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user]);

  // ── Login ─────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    setToken(data.token);
    touchActivity();
    sessionStorage.setItem('amal_sess', '1');
    setUser(data);
    return data;
  };

  // ── Register ──────────────────────────────────────────
  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', {
      name,
      email,
      password,
    });
    setToken(data.token);
    touchActivity();
    sessionStorage.setItem('amal_sess', '1');
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
