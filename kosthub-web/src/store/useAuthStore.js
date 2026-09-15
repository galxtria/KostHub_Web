import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('kosthub_user') || 'null'),
  token: localStorage.getItem('kosthub_token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/login', { email, password });
      localStorage.setItem('kosthub_token', data.token);
      localStorage.setItem('kosthub_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data.user;
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/register', payload);
      localStorage.setItem('kosthub_token', data.token);
      localStorage.setItem('kosthub_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data.user;
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: async () => {
    try { await api.post('/logout'); } catch {}
    localStorage.removeItem('kosthub_token');
    localStorage.removeItem('kosthub_user');
    set({ user: null, token: null });
  },

  // Sinkronkan user setelah edit profil
  setUser: (user) => {
    localStorage.setItem('kosthub_user', JSON.stringify(user));
    set({ user });
  },
}));
