import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

/**
 * useTheme Hook
 * Applies theme changes to the DOM and persists preference to localStorage
 */
export const useTheme = () => {
  const { theme, setTheme } = useUIStore();

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      // Use saved preference
      setTheme(savedTheme);
    } else if (prefersDark) {
      // Use system preference
      setTheme('dark');
    }
    // else keep default (light)
  }, [setTheme]);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    const htmlElement = document.documentElement;

    // Set data-theme attribute
    htmlElement.setAttribute('data-theme', theme);

    // Set class for CSS selectors
    htmlElement.classList.remove('light-theme', 'dark-theme');
    htmlElement.classList.add(`${theme}-theme`);

    // Persist to localStorage
    localStorage.setItem('theme', theme);

    // Update meta color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
    }
  }, [theme]);

  return { theme };
};

export default useTheme;
