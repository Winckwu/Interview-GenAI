import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import Logo from '../components/common/Logo';
import './LoginPage.css';
import '../styles/components.css';

/**
 * Login Page
 * Authentication page for user login with side-by-side layout
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
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="auth-page login-page">
      <div className="login-container">
        {/* Left Side - Login Form */}
        <div className="login-form-section">
          <div className="auth-card">
            <div className="auth-header">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Logo size={48} showText={false} />
              </div>
              <h2>Welcome Back</h2>
              <p>Sign in to continue to AI Pattern Recognition System</p>
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
                  placeholder="you@example.com"
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  disabled={loading}
                  autoComplete="email"
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
                  placeholder="••••••••"
                  className={`form-input ${formErrors.password ? 'error' : ''}`}
                  disabled={loading}
                  autoComplete="current-password"
                />
                {formErrors.password && <span className="error-message">{formErrors.password}</span>}
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-large ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span>⏳</span>
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

        {/* Right Side - System Introduction */}
        <div className="login-intro-section">
          <div className="intro-header">
            <h1>AI Pattern Recognition System</h1>
            <p className="intro-tagline">Enhance your AI collaboration effectiveness</p>
          </div>

          <div className="intro-features">
            <div className="feature-item">
              <div className="feature-icon">🧠</div>
              <div className="feature-content">
                <h3>Smart Pattern Analysis</h3>
                <p>Identifies 6 distinct AI usage patterns and provides personalized insights</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-content">
                <h3>Metacognitive Assessment</h3>
                <p>Evaluates 12 dimensions of cognitive abilities with intelligent interventions</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <div className="feature-content">
                <h3>Skill Preservation</h3>
                <p>19 MR strategies to prevent skill degradation and maintain cognitive health</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <div className="feature-content">
                <h3>Real-time Monitoring</h3>
                <p>Continuous tracking of verification and engagement behaviors</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
