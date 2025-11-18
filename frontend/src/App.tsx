import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatSessionPage from './pages/ChatSessionPage';
import PatternsPage from './pages/PatternsPage';
import PredictionsPage from './pages/PredictionsPage';
import EvolutionTrackingPage from './pages/EvolutionTrackingPage';
// import ABTestPage from './pages/ABTestPage'; // Hidden - not yet implemented
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';

/**
 * Protected Route wrapper component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Main App component with routing configuration
 */
const App: React.FC = () => {
  const { checkAuth, loading, isAuthenticated, token } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const initializerRef = React.useRef(false);

  // Only initialize once on app mount (not on every state change)
  useEffect(() => {
    const initialize = async () => {
      // Prevent double initialization
      if (initializerRef.current) {
        return;
      }
      initializerRef.current = true;

      // Wait for Zustand persist middleware to hydrate from localStorage
      // This is important so that token and isAuthenticated are restored
      // before we check them
      await new Promise(resolve => setTimeout(resolve, 50));

      // After hydration, we trust the persisted state
      // If user had a valid token, it's already restored from localStorage
      // If user didn't have a token, isAuthenticated will be false
      // No need to call checkAuth - just mark as initialized

      setIsInitialized(true);
    };

    initialize();
  }, []); // Empty dependency array - only run once on mount

  if (!isInitialized) {
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

          {/* Chat Session */}
          <Route path="/session/:sessionId" element={<ChatSessionPage />} />

          {/* Core Features */}
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/predictions" element={<PredictionsPage />} />
          <Route path="/evolution" element={<EvolutionTrackingPage />} />
          {/* <Route path="/ab-test" element={<ABTestPage />} /> */} {/* Hidden - not yet implemented */}

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
