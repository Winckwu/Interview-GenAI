import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import './RegisterPage.css';
import '../styles/components.css';

/**
 * Register Page
 * User registration page
 */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    userType: 'efficient',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await register(formData.email, formData.username, formData.password, formData.userType);
      addNotification('✓ Registration successful! Redirecting to dashboard...', 'success');
      navigate('/');
    } catch (err) {
      addNotification('✕ Registration failed. Please try again.', 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    <div className="auth-page register-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join AI Pattern Recognition System to track your AI usage patterns</p>
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
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              className={`form-input ${formErrors.username ? 'error' : ''}`}
              disabled={loading}
            />
            {formErrors.username && <span className="error-message">{formErrors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="userType">User Type</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              disabled={loading}
              className="form-input"
            >
              <option value="efficient">Efficient User (High verification, low AI reliance)</option>
              <option value="struggling">Struggling User (Variable behavior, higher risk)</option>
              <option value="hybrid">Hybrid User (Context-dependent patterns)</option>
            </select>
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`form-input ${formErrors.confirmPassword ? 'error' : ''}`}
              disabled={loading}
            />
            {formErrors.confirmPassword && <span className="error-message">{formErrors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-large ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span>⏳</span>
                {' Creating Account...'}
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
