import axios from 'axios';

const TOKEN_KEY = 'amal_token';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY); // ✅ sessionStorage → localStorage
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const downloadFile = async (url, filename) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(BASE_URL + url, {
    // ✅ '/api' → BASE_URL
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

export default API;
