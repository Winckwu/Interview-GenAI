/**
 * useUserSettings Hook
 * Manages user settings and preferences persistence
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface UserPreferences {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  dataPrivacy: 'public' | 'private';
  emailUpdates: boolean;
  autoSave: boolean;
  showAnalytics: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  avatar?: string;
  preferences: UserPreferences;
}

interface UseUserSettingsReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useUserSettings = (userId: string): UseUserSettingsReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch user profile';
      setError(errorMsg);
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const response = await api.patch('/users/profile', updates);
      setProfile(response.data.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update profile';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    try {
      const response = await api.patch('/users/profile', { preferences });
      setProfile(response.data.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update preferences';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    try {
      await api.patch('/users/password', {
        oldPassword,
        newPassword,
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to change password';
      setError(errorMsg);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updatePreferences,
    changePassword,
    refetch: fetchProfile,
  };
};
