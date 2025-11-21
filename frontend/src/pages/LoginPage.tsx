import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import Logo from '../components/common/Logo';
import './LoginPage.css';
import '../styles/components.css';

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
      <div className="login-content-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Logo size={48} showText={false} />
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to your AI Pattern Recognition System account</p>
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

        {/* System Introduction Section */}
        <div className="system-intro-card">
          <div className="system-intro-header">
            <h3>AI Pattern Recognition System</h3>
            <p className="system-intro-subtitle">Enhance your AI collaboration effectiveness</p>
          </div>

          <div className="system-intro-content">
            <div className="intro-section">
              <div className="intro-icon">🧠</div>
              <div className="intro-text">
                <h4>What is this system?</h4>
                <p>
                  An intelligent platform that monitors your AI interaction patterns,
                  identifies potential skill degradation risks, and provides personalized
                  interventions to maintain your cognitive abilities.
                </p>
              </div>
            </div>

            <div className="intro-section">
              <div className="intro-icon">⚙️</div>
              <div className="intro-text">
                <h4>Core Features</h4>
                <ul>
                  <li><strong>Pattern Recognition:</strong> Identifies 6 distinct AI usage patterns (A-F)</li>
                  <li><strong>Metacognitive Assessment:</strong> Evaluates 12 dimensions of cognitive abilities</li>
                  <li><strong>Intelligent Interventions:</strong> 19 MR strategies to prevent skill decay</li>
                  <li><strong>Real-time Monitoring:</strong> Continuous tracking of verification and engagement behaviors</li>
                </ul>
              </div>
            </div>

            <div className="intro-section">
              <div className="intro-icon">🎯</div>
              <div className="intro-text">
                <h4>What you'll gain</h4>
                <p>
                  <strong>Improved AI efficiency</strong> through pattern awareness,
                  <strong>prevention of skill degradation</strong> via timely interventions, and
                  <strong>enhanced problem-solving abilities</strong> with metacognitive insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
