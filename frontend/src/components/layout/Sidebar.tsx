import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  isOpen: boolean;
}

/**
 * Sidebar Navigation Component
 * Collapsible sidebar with navigation links
 */
const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: 'dashboard',
      visible: true,
    },
    {
      label: 'Patterns',
      path: '/patterns',
      icon: 'patterns',
      visible: true,
    },
    {
      label: 'Predictions',
      path: '/predictions',
      icon: 'predictions',
      visible: true,
    },
    {
      label: 'Evolution Tracking',
      path: '/evolution',
      icon: 'evolution',
      visible: true,
    },
    {
      label: 'A/B Testing',
      path: '/ab-test',
      icon: 'abtest',
      visible: true,
    },
    {
      label: 'Admin',
      path: '/admin',
      icon: 'admin',
      visible: user?.userType === 'admin',
    },
  ];

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      dashboard: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      patterns: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 17.5" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      predictions: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      evolution: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M12 3v18" />
          <circle cx="5" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="19" r="1" />
        </svg>
      ),
      abtest: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3h18v18H3z" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </svg>
      ),
      admin: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20c0-2 2.5-4 6-4s6 2 6 4" />
          <path d="M18 8h6M18 11h6" />
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <ul className="nav-list">
        {navItems
          .filter((item) => item.visible)
          .map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{getIcon(item.icon)}</span>
                {isOpen && <span className="nav-label">{item.label}</span>}
              </Link>
            </li>
          ))}
      </ul>

      {isOpen && (
        <div className="sidebar-footer">
          <div className="sidebar-section">
            <h3>User Type</h3>
            <p>{user?.userType || 'Unknown'}</p>
          </div>
          <div className="sidebar-section">
            <h3>Joined</h3>
            <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
