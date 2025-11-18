import { create } from 'zustand';
import api from '../services/api';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface SystemStats {
  totalUsers: number;
  totalSessions: number;
  totalInteractions: number;
  activeUsers: number;
  averageSessionDuration: number;
  newUsersThisWeek: number;
}

export interface AdminDashboard {
  totalUsers: number;
  totalSessions: number;
  totalInteractions: number;
  patternDistribution: Record<string, number>;
  recentUsers: AdminUser[];
}

export interface AdminState {
  // State
  dashboard: AdminDashboard | null;
  stats: SystemStats | null;
  users: AdminUser[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboard: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchUsers: (limit?: number, offset?: number) => Promise<void>;
  updateUserRole: (userId: string, role: 'user' | 'admin') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Admin store for managing system administration
 */
export const useAdminStore = create<AdminState>((set) => ({
  dashboard: null,
  stats: null,
  users: [],
  loading: false,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/admin/dashboard');
      set({ dashboard: response.data.data });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch admin dashboard';
      set({ error: errorMsg });
      console.error('Admin dashboard fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/admin/stats');
      set({ stats: response.data.data });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch system stats';
      set({ error: errorMsg });
      console.error('System stats fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchUsers: async (limit = 50, offset = 0) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/admin/users', { params: { limit, offset } });
      set({ users: response.data.data.users });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch users';
      set({ error: errorMsg });
      console.error('Users fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },

  updateUserRole: async (userId: string, role: 'user' | 'admin') => {
    set({ error: null });
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      // Update local state
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId ? { ...user, role } : user
        ),
      }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update user role';
      set({ error: errorMsg });
      throw err;
    }
  },

  deleteUser: async (userId: string) => {
    set({ error: null });
    try {
      await api.delete(`/admin/users/${userId}`);
      // Remove from local state
      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
      }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete user';
      set({ error: errorMsg });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
