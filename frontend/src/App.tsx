import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages - Eagerly loaded (critical path)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// OPTIMIZATION: Route-level code splitting
// Lazy-load non-critical pages to reduce initial bundle by 60-70%
// Each lazy import reduces initial payload size significantly
const PatternsPage = lazy(() => import('./pages/PatternsPage'));
const PredictionsPage = lazy(() => import('./pages/PredictionsPage'));
const EvolutionTrackingPage = lazy(() => import('./pages/EvolutionTrackingPage'));
const ABTestPage = lazy(() => import('./pages/ABTestPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ChatSessionPage = lazy(() => import('./pages/ChatSessionPage')); // 51 KB - Biggest impact
const MetacognitiveAssessmentPage = lazy(() => import('./pages/MetacognitiveAssessmentPage'));
const DataBrowserPage = lazy(() => import('./pages/DataBrowserPage'));

/**
 * OPTIMIZATION: Loading fallback component for lazy-loaded routes
 * Displayed while chunks are being downloaded and parsed
 */
const PageLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '1rem',
    }}
  >
    <div
      style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading page...</p>
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

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
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent running checkAuth multiple times (React.StrictMode double-invoke in dev)
    if (initRef.current) {
      return;
    }
    initRef.current = true;

    // If no token stored, skip auth check
    if (!token) {
      return;
    }

    // Try to verify the token - fire and forget
    // ProtectedRoute will handle redirects if auth fails
    useAuthStore.getState().checkAuth();
  }, []); // Empty deps - only run once on mount

  // Show loading state while checking auth
  if (loading && token) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f3f4f6',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Verifying session...</p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // If no token or auth check failed, show auth routes
  if (!token || !isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
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
          {/* Dashboard - Eagerly loaded (critical path) */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Core Features - OPTIMIZATION: Lazy-loaded routes with Suspense */}
          <Route
            path="/patterns"
            element={
              <Suspense fallback={<PageLoader />}>
                <PatternsPage />
              </Suspense>
            }
          />
          <Route
            path="/predictions"
            element={
              <Suspense fallback={<PageLoader />}>
                <PredictionsPage />
              </Suspense>
            }
          />
          <Route
            path="/evolution"
            element={
              <Suspense fallback={<PageLoader />}>
                <EvolutionTrackingPage />
              </Suspense>
            }
          />
          <Route
            path="/ab-test"
            element={
              <Suspense fallback={<PageLoader />}>
                <ABTestPage />
              </Suspense>
            }
          />
          <Route
            path="/chat"
            element={
              <Suspense fallback={<PageLoader />}>
                <ChatSessionPage />
              </Suspense>
            }
          />
          <Route
            path="/session/:sessionId"
            element={
              <Suspense fallback={<PageLoader />}>
                <ChatSessionPage />
              </Suspense>
            }
          />
          <Route
            path="/assessment"
            element={
              <Suspense fallback={<PageLoader />}>
                <MetacognitiveAssessmentPage />
              </Suspense>
            }
          />

          {/* Admin - OPTIMIZATION: Lazy-loaded routes with Suspense */}
          <Route
            path="/admin"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminPage />
              </Suspense>
            }
          />
          <Route
            path="/data"
            element={
              <Suspense fallback={<PageLoader />}>
                <DataBrowserPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>

        {/* Catch-all - Redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
