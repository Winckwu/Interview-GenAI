import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

/**
 * Header Component
 * Top navigation with user menu and controls
 */
const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, toggleTheme, theme } = useUIStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link to="/" className="header-logo">
          <h1>AI Pattern Recognition System</h1>
        </Link>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div className="user-menu">
          <button
            className="user-menu-toggle"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={user?.username}
          >
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
            <span className="user-name">{user?.username || 'User'}</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <Link to="/settings" className="dropdown-item">
                Settings
              </Link>
              {user?.userType === 'admin' && (
                <Link to="/admin" className="dropdown-item">
                  Admin Dashboard
                </Link>
              )}
              <hr className="dropdown-divider" />
              <button
                className="dropdown-item logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
