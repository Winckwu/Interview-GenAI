import { useEffect } from 'react';

/**
 * Custom hook for automatic data refresh at regular intervals
 * Useful for pages that display real-time data from user interactions
 *
 * @param fetchFunctions - Array of async functions to call for data refresh
 * @param dependencies - React dependency array for the effect
 * @param interval - Refresh interval in milliseconds (default: 30000ms = 30 seconds)
 *
 * @example
 * const { fetchPatterns } = usePatternStore();
 * useAutoRefresh(
 *   [() => fetchPatterns(userId)],
 *   [userId, fetchPatterns]
 * );
 */
export const useAutoRefresh = (
  fetchFunctions: (() => Promise<void>)[],
  dependencies: any[] = [],
  interval: number = 30000
): void => {
  useEffect(() => {
    // Load data immediately on mount
    const loadData = async () => {
      try {
        await Promise.all(fetchFunctions.map((fn) => fn()));
      } catch (err) {
        console.error('Failed to refresh data:', err);
      }
    };

    // Initial load
    loadData();

    // Set up interval for periodic refresh
    const refreshInterval = setInterval(() => {
      loadData();
    }, interval);

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, dependencies);
};
