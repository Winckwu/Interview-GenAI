import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Admin Dashboard Page
 * System administration and monitoring
 */
const AdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPredictions: 0,
    systemHealth: 'healthy',
    uptime: '99.8%',
    avgResponseTime: '145ms',
  });

  const [users, setUsers] = useState([
    {
      id: '1',
      email: 'efficient@example.com',
      username: 'efficient_user',
      userType: 'efficient',
      createdAt: '2025-11-01',
    },
    {
      id: '2',
      email: 'struggling@example.com',
      username: 'struggling_user',
      userType: 'struggling',
      createdAt: '2025-11-05',
    },
  ]);

  // Mock system logs
  const recentLogs = [
    { timestamp: '2025-11-17 10:30:00', level: 'info', message: 'User login: efficient_user' },
    { timestamp: '2025-11-17 10:25:30', level: 'info', message: 'Prediction created for task_001' },
    { timestamp: '2025-11-17 10:20:15', level: 'warning', message: 'High memory usage detected' },
    { timestamp: '2025-11-17 10:15:00', level: 'info', message: 'System backup completed' },
  ];

  // Check if user is admin
  if (user?.userType !== 'admin') {
    return (
      <div className="page access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page. Admin access required.</p>
      </div>
    );
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter((u) => u.id !== userId));
      addNotification('User deleted successfully', 'success');
    }
  };

  return (
    <div className="page admin-page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="page-subtitle">System administration and monitoring</p>
      </div>

      {/* System Stats */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Users</div>
          <div className="metric-value">{stats.totalUsers}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Users</div>
          <div className="metric-value">{stats.activeUsers}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Predictions</div>
          <div className="metric-value">{stats.totalPredictions}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">System Status</div>
          <div className="metric-value" style={{ textTransform: 'capitalize', color: stats.systemHealth === 'healthy' ? '#10b981' : '#ef4444' }}>
            {stats.systemHealth}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="admin-section">
        <h3>Performance Metrics</h3>
        <div className="metrics-table">
          <div className="metric-row">
            <span className="label">System Uptime</span>
            <span className="value">{stats.uptime}</span>
          </div>
          <div className="metric-row">
            <span className="label">Average Response Time</span>
            <span className="value">{stats.avgResponseTime}</span>
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="admin-section">
        <h3>User Management</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>User Type</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-info">{u.userType}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Logs */}
      <div className="admin-section">
        <h3>Recent System Logs</h3>
        <div className="logs-container">
          {recentLogs.map((log, idx) => (
            <div key={idx} className={`log-entry log-${log.level}`}>
              <span className="log-timestamp">{log.timestamp}</span>
              <span className={`log-level log-level-${log.level}`}>{log.level.toUpperCase()}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Configuration */}
      <div className="admin-section">
        <h3>System Configuration</h3>
        <div className="config-form">
          <div className="form-group">
            <label>Max Prediction Confidence Threshold</label>
            <input type="number" defaultValue="0.75" min="0" max="1" step="0.05" />
          </div>
          <div className="form-group">
            <label>Evolution Tracking Window (days)</label>
            <input type="number" defaultValue="30" min="1" />
          </div>
          <div className="form-group">
            <label>A/B Test Duration (days)</label>
            <input type="number" defaultValue="28" min="1" />
          </div>
          <button className="btn btn-primary">Save Configuration</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
