import { useMemo } from 'react';
import { useUIStore } from '../stores/uiStore';

/**
 * useThemeColors Hook
 * Provides theme-aware colors for inline styles
 * Returns different color values based on current theme
 */
export const useThemeColors = () => {
  const { theme } = useUIStore();

  const colors = useMemo(
    () => ({
      // Background colors
      bgPrimary: theme === 'dark' ? '#111827' : '#ffffff',
      bgSecondary: theme === 'dark' ? '#1f2937' : '#f9fafb',
      bgTertiary: theme === 'dark' ? '#374151' : '#f3f4f6',

      // Text colors
      textPrimary: theme === 'dark' ? '#f9fafb' : '#1f2937',
      textSecondary: theme === 'dark' ? '#d1d5db' : '#6b7280',
      textTertiary: theme === 'dark' ? '#9ca3af' : '#9ca3af',

      // Border colors
      borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',

      // Component colors
      inputBg: theme === 'dark' ? '#111827' : '#ffffff',
      inputBorder: theme === 'dark' ? '#4b5563' : '#e5e7eb',
      hoverBg: theme === 'dark' ? '#374151' : '#f3f4f6',

      // Status colors (remain consistent across themes)
      success: '#22c55e',
      successBg: '#f0fdf4',
      error: '#ef4444',
      errorBg: '#fef2f2',
      warning: '#f59e0b',
      warningBg: '#fffbeb',

      // Primary colors
      primary: '#0284c7',
      primaryLight: '#0ea5e9',
      primaryDark: '#0369a1',
    }),
    [theme]
  );

  return colors;
};

export default useThemeColors;
