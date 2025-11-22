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
      label: 'AI Chat',
      path: '/chat',
      icon: 'chat',
      visible: true,
    },
    {
      label: 'Pattern Analysis',
      path: '/patterns',
      icon: 'patterns',
      visible: true,
    },
    {
      label: 'Predictions',
      path: '/predictions',
      icon: 'predictions',
      visible: false, // Hidden per user request
    },
    {
      label: 'Metacognitive Assessment',
      path: '/assessment',
      icon: 'assessment',
      visible: true,
    },
    {
      label: 'Help Guide',
      path: '/help',
      icon: 'help',
      visible: true,
    },
    {
      label: 'A/B Testing',
      path: '/ab-test',
      icon: 'abtest',
      visible: false, // Hidden - not yet implemented
    },
    {
      label: 'Data Browser',
      path: '/data',
      icon: 'database',
      visible: false, // Hidden per user request
    },
    {
      label: 'Admin',
      path: '/admin',
      icon: 'admin',
      visible: user?.userType === 'admin' || user?.role === 'admin',
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
      assessment: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      chat: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      abtest: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3h18v18H3z" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </svg>
      ),
      database: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14a9 3 0 0 0 18 0V5" />
          <path d="M3 12a9 3 0 0 0 18 0" />
        </svg>
      ),
      admin: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20c0-2 2.5-4 6-4s6 2 6 4" />
          <path d="M18 8h6M18 11h6" />
        </svg>
      ),
      help: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  const isActive = (path: string) => {
    // Special handling for AI Chat: /chat redirects to /session/:id
    if (path === '/chat') {
      return location.pathname === '/chat' || location.pathname.startsWith('/session');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <ul className="sidebar-menu">
        {navItems
          .filter((item) => item.visible)
          .map((item) => (
            <li key={item.path} className="sidebar-item">
              <Link
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                data-tour={
                  item.path === '/chat' ? 'sidebar-chat' :
                  item.path === '/patterns' ? 'sidebar-patterns' :
                  item.path === '/help' ? 'sidebar-help' :
                  undefined
                }
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
            <h3>Joined</h3>
            <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
