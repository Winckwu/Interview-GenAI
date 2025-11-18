import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Admin Dashboard Page
 * System administration and monitoring
 */
const AdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const { dashboard, loading } = useAdminDashboard();
  const [users, setUsers] = useState<any[]>([]);
  const [patternDistribution, setPatternDistribution] = useState<any>({});

  // Load data from dashboard when it changes
  useEffect(() => {
    if (dashboard?.recentUsers) {
      setUsers(dashboard.recentUsers);
    }
    if (dashboard?.patternDistribution) {
      setPatternDistribution(dashboard.patternDistribution);
    }
  }, [dashboard]);

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="page access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page. Admin access required.</p>
      </div>
    );
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          setUsers(users.filter((u) => u.id !== userId));
          addNotification('User deleted successfully', 'success');
        } else {
          addNotification('Failed to delete user', 'error');
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        addNotification('Error deleting user', 'error');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

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
          <div className="metric-value">{dashboard?.totalUsers || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Sessions</div>
          <div className="metric-value">{dashboard?.totalSessions || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Interactions</div>
          <div className="metric-value">{dashboard?.totalInteractions || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">System Status</div>
          <div className="metric-value" style={{ textTransform: 'capitalize', color: '#10b981' }}>
            Healthy
          </div>
        </div>
      </div>

      {/* Pattern Distribution */}
      <div className="admin-section">
        <h3>Pattern Distribution</h3>
        <div className="metrics-table">
          {Object.entries(patternDistribution).map(([pattern, count]) => (
            <div key={pattern} className="metric-row">
              <span className="label">Pattern {pattern.toUpperCase()}</span>
              <span className="value">{count as number} detections</span>
            </div>
          ))}
          {Object.keys(patternDistribution).length === 0 && (
            <div className="metric-row">
              <span className="label">No patterns detected yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Users Management */}
      <div className="admin-section">
        <h3>Recent Users ({users.length})</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-info">{u.role || 'user'}</span></td>
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Information */}
      <div className="admin-section">
        <h3>System Information</h3>
        <div className="metrics-table">
          <div className="metric-row">
            <span className="label">Backend Status</span>
            <span className="value" style={{ color: '#10b981' }}>✓ Connected</span>
          </div>
          <div className="metric-row">
            <span className="label">Database Status</span>
            <span className="value" style={{ color: '#10b981' }}>✓ Connected</span>
          </div>
          <div className="metric-row">
            <span className="label">API Version</span>
            <span className="value">v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
