import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kosthub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kosthub_token');
      localStorage.removeItem('kosthub_user');
      if (!window.location.pathname.includes('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
export const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

// Host API tanpa suffix /api — untuk prefix path /storage/...
export const API_HOST = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');

// Ubah foto_url backend (/storage/...) jadi URL penuh. Kembalikan fallback bila kosong.
export const imgSrc = (fotoUrl, fallback = '/images/kost/kost-1.jpg') => {
  if (!fotoUrl) return fallback;
  if (fotoUrl.startsWith('http') || fotoUrl.startsWith('data:') || fotoUrl.startsWith('blob:')) return fotoUrl;
  return API_HOST + fotoUrl;
};

// Harga ringkas: Rp 3.5jt / Rp 800rb
export const priceShort = (n) => {
  n = Number(n) || 0;
  if (n >= 1000000) {
    const jt = n / 1000000;
    return `Rp ${Number.isInteger(jt) ? String(jt) : jt.toFixed(1).replace('.', ',')}jt`;
  }
  if (n >= 1000) return `Rp ${Math.round(n / 1000)}rb`;
  return formatRupiah(n);
};
