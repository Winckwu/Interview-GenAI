import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

/**
 * Settings Page
 * User profile and account settings
 */
const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme, addNotification } = useUIStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    userType: user?.userType || 'efficient',
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: theme === 'dark',
    autoSave: true,
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification('Profile updated successfully', 'success');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }
    addNotification('Password changed successfully', 'success');
    setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handlePreferencesUpdate = () => {
    if (preferences.darkMode !== (theme === 'dark')) {
      toggleTheme();
    }
    addNotification('Preferences updated successfully', 'success');
  };

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="tab-content">
          <div className="settings-card">
            <h3>Profile Information</h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  placeholder="Your username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="userType">User Type</label>
                <select
                  id="userType"
                  value={profileData.userType}
                  onChange={(e) => setProfileData({ ...profileData, userType: e.target.value })}
                >
                  <option value="efficient">Efficient User</option>
                  <option value="struggling">Struggling User</option>
                  <option value="hybrid">Hybrid User</option>
                </select>
              </div>

              <div className="form-group">
                <label>Member Since</label>
                <input
                  type="text"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  disabled
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Update Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="tab-content">
          <div className="settings-card">
            <h3>Change Password</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={securityData.currentPassword}
                  onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={securityData.newPassword}
                  onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={securityData.confirmPassword}
                  onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Change Password
              </button>
            </form>
          </div>

          <div className="settings-card">
            <h3>Active Sessions</h3>
            <div className="sessions-list">
              <div className="session-item">
                <div className="session-info">
                  <p className="session-browser">Chrome on macOS</p>
                  <p className="session-date">Last active: 2 hours ago</p>
                </div>
                <button className="btn btn-small">Revoke</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="tab-content">
          <div className="settings-card">
            <h3>Display Preferences</h3>
            <div className="preference-group">
              <div className="preference-item">
                <div className="preference-label">
                  <label>Dark Mode</label>
                  <p className="preference-description">Use dark theme for the interface</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.darkMode}
                    onChange={(e) => setPreferences({ ...preferences, darkMode: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h3>Notification Preferences</h3>
            <div className="preference-group">
              <div className="preference-item">
                <div className="preference-label">
                  <label>Email Notifications</label>
                  <p className="preference-description">Receive email updates about your account</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="preference-item">
                <div className="preference-label">
                  <label>Auto-Save</label>
                  <p className="preference-description">Automatically save form changes</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.autoSave}
                    onChange={(e) => setPreferences({ ...preferences, autoSave: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          <button onClick={handlePreferencesUpdate} className="btn btn-primary">
            Save Preferences
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
