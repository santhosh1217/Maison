import axios from 'axios';

const api = axios.create({ baseURL: 'https://maison-gtgy.onrender.com/api' });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('maison_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('maison_token');
      localStorage.removeItem('maison_user');
    }
    return Promise.reject(err);
  }
);

export const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

export default api;
