import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatternsPage from './pages/PatternsPage';
import PredictionsPage from './pages/PredictionsPage';
import EvolutionTrackingPage from './pages/EvolutionTrackingPage';
import ABTestPage from './pages/ABTestPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';

/**
 * Protected Route wrapper component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use selector to only subscribe to isAuthenticated, not entire store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Main App component with routing configuration
 */
const App: React.FC = () => {
  const { checkAuth, loading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    console.log('[App.useEffect] Triggered, initRef.current =', initRef.current);

    // Prevent running checkAuth multiple times (React.StrictMode double-invoke in dev)
    if (initRef.current) {
      console.log('[App.useEffect] Already initialized, skipping');
      return;
    }
    initRef.current = true;
    console.log('[App.useEffect] Starting initialization...');

    let isMounted = true;

    const initialize = async () => {
      console.log('[App.initialize] Starting auth check');
      try {
        await checkAuth();
        console.log('[App.initialize] Auth check completed');
      } catch (error) {
        console.error('[App.initialize] Auth check failed:', error);
      } finally {
        // Only set initialized if component is still mounted
        if (isMounted) {
          console.log('[App.initialize] Setting isInitialized = true');
          setIsInitialized(true);
        }
      }
    };

    initialize();

    // Cleanup function to prevent state update on unmount
    return () => {
      console.log('[App.cleanup] Component unmounting');
      isMounted = false;
    };
  }, []);

  if (!isInitialized || loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes - Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes - Main Layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Core Features */}
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/predictions" element={<PredictionsPage />} />
          <Route path="/evolution" element={<EvolutionTrackingPage />} />
          <Route path="/ab-test" element={<ABTestPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all - Redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
