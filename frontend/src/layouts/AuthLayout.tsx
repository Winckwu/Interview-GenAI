import React from 'react';
import { Outlet } from 'react-router-dom';
import NotificationCenter from '../components/layout/NotificationCenter';

/**
 * Auth Layout Component
 * Used for authentication pages (login, register)
 * Simple layout without sidebar
 */
const AuthLayout: React.FC = () => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-content">
          <Outlet />
        </div>
      </div>
      <NotificationCenter />
    </div>
  );
};

export default AuthLayout;
