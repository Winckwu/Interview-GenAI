import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import NotificationCenter from '../components/layout/NotificationCenter';
import { useUIStore } from '../stores/uiStore';

/**
 * Main Layout Component
 * Used for authenticated pages with sidebar, header, and notification center
 */
const MainLayout: React.FC = () => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="layout-container">
      <Header />
      <div className="layout-body">
        <Sidebar isOpen={sidebarOpen} />
        <main className={`layout-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
      <NotificationCenter />
    </div>
  );
};

export default MainLayout;
