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
      <div className="auth-container">
        {/* Authentication Card */}
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

        {/* System Introduction Panel */}
        <div className="system-intro-panel">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <Logo size={40} showText={false} />
            <h2 style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              AI Pattern Recognition System
            </h2>
          </div>

          {/* What the System Is */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#ffffff'
              }}>
                What We Do
              </h3>
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.95rem',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.95)'
            }}>
              An intelligent system that analyzes your AI usage patterns and metacognitive behaviors,
              helping you develop more effective interaction strategies with AI tools.
            </p>
          </div>

          {/* Core Features */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚡</span>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#ffffff'
              }}>
                Core Features
              </h3>
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              fontSize: '0.95rem',
              lineHeight: '1.8',
              color: 'rgba(255, 255, 255, 0.95)'
            }}>
              <li><strong>Pattern Recognition (A-F)</strong> - Identifies your behavioral patterns in AI interactions</li>
              <li><strong>Metacognitive Assessment (MR19)</strong> - Evaluates your cognitive regulation abilities across 12 dimensions</li>
              <li><strong>Intelligent Interventions</strong> - Provides real-time guidance to improve your AI usage efficiency</li>
            </ul>
          </div>

          {/* User Benefits */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🚀</span>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#ffffff'
              }}>
                What You'll Gain
              </h3>
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              fontSize: '0.95rem',
              lineHeight: '1.8',
              color: 'rgba(255, 255, 255, 0.95)'
            }}>
              <li>Improve your AI usage efficiency and decision-making quality</li>
              <li>Avoid AI-induced skill degradation and maintain critical thinking</li>
              <li>Develop stronger metacognitive awareness and self-regulation</li>
              <li>Track your behavioral evolution with data-driven insights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
