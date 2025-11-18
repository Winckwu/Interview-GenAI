import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  username: string;
  userType: 'efficient' | 'struggling' | 'hybrid' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, userType: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

/**
 * Authentication store using Zustand
 * Persists auth token in localStorage
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: user !== null }),

      setToken: (token) => {
        set({ token });
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          delete api.defaults.headers.common['Authorization'];
        }
      },

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data;

          get().setToken(token);
          set({ user, isAuthenticated: true });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Login failed';
          set({ error: errorMsg, isAuthenticated: false });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      register: async (email: string, username: string, password: string, userType: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/auth/register', {
            email,
            username,
            password,
            userType,
          });
          const { user, token } = response.data.data;

          get().setToken(token);
          set({ user, isAuthenticated: true });
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Registration failed';
          set({ error: errorMsg, isAuthenticated: false });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      logout: () => {
        get().setToken(null);
        set({ user: null, isAuthenticated: false, token: null });
      },

      checkAuth: async () => {
        set({ loading: true });
        try {
          // Try to verify current token/session
          const response = await api.get('/auth/verify');
          const { user } = response.data.data;
          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false, token: null });
          delete api.defaults.headers.common['Authorization'];
        } finally {
          set({ loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
