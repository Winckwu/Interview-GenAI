import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

/**
 * Login Page
 * Authentication page for user login
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      addNotification('✓ Login successful!', 'success');
      // Navigate immediately - state is already updated atomically
      navigate('/');
    } catch (err) {
      addNotification('✕ Login failed. Please check your credentials.', 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="auth-page login-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your Interview-GenAI account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="you@example.com"
              className={formErrors.email ? 'error' : ''}
              disabled={loading}
              style={{
                borderColor: focusedField === 'email' ? '#667eea' : formErrors.email ? '#ef4444' : '#e5e7eb',
                backgroundColor: focusedField === 'email' ? '#f0f9ff' : '#f9fafb',
                transition: 'all 150ms ease',
              }}
            />
            {formErrors.email && <span className="error-message">{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              className={formErrors.password ? 'error' : ''}
              disabled={loading}
              style={{
                borderColor: focusedField === 'password' ? '#667eea' : formErrors.password ? '#ef4444' : '#e5e7eb',
                backgroundColor: focusedField === 'password' ? '#f0f9ff' : '#f9fafb',
                transition: 'all 150ms ease',
              }}
            />
            {formErrors.password && <span className="error-message">{formErrors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              transform: loading ? 'scale(0.98)' : 'scale(1)',
              transition: 'all 150ms ease',
            }}
          >
            {loading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                {' Signing in...'}
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Create one here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
