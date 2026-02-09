import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, TrendingUp } from 'lucide-react';
import './Auth.css';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin && !formData.username) {
      newErrors.username = 'Username is required';
    } else if (!isLogin && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && !formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login - check if user exists
        const response = await fetch(`${API_BASE}/users/by-email?email=${formData.email}`);
        const data = await response.json();

        if (data.success) {
          // User found - simulate successful login
          const user = data.data;
          localStorage.setItem('user', JSON.stringify(user));
          onLogin(user);
        } else {
          setErrors({ submit: 'User not found. Please sign up first.' });
        }
      } else {
        // Signup - create new user
        const response = await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email
          })
        });

        const data = await response.json();

        if (data.success) {
          // User created successfully
          const user = data.data;
          localStorage.setItem('user', JSON.stringify(user));
          onLogin(user);
        } else {
          setErrors({ submit: data.error || 'Failed to create account. Email or username may already exist.' });
        }
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check if the backend is running.' });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  return (
    <div className="auth-container">
      {/* Animated Background */}
      <div className="auth-background">
        <div className="auth-orb orb-1"></div>
        <div className="auth-orb orb-2"></div>
        <div className="auth-orb orb-3"></div>
      </div>

      {/* Left Side - Branding */}
      <div className="auth-branding">
        <div className="branding-content">
          <div className="brand-logo">
            <Sparkles size={48} />
          </div>
          <h1 className="brand-title">ExpenseFlow</h1>
          <p className="brand-tagline">Smart Budget Tracking with AI</p>
          
          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3>AI-Powered Predictions</h3>
                <p>Machine learning forecasts your spending</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Sparkles size={24} />
              </div>
              <div>
                <h3>Beautiful Analytics</h3>
                <p>Visualize your expenses with stunning charts</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <User size={24} />
              </div>
              <div>
                <h3>Personal Budget Goals</h3>
                <p>Set and track your spending limits</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="auth-form-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="auth-subtitle">
              {isLogin 
                ? 'Sign in to continue to your dashboard' 
                : 'Start tracking your expenses today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username (Signup only) */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className={`form-input ${errors.username ? 'error' : ''}`}
                />
                {errors.username && (
                  <span className="error-message">{errors.username}</span>
                )}
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                <Mail size={16} />
                <span>Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`form-input ${errors.email ? 'error' : ''}`}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                <Lock size={16} />
                <span>Password</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} />
                  <span>Confirm Password</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                />
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="error-banner">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>

            {/* Switch Mode */}
            <div className="auth-switch">
              <span>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </span>
              <button type="button" className="switch-btn" onClick={switchMode}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick Demo Login */}
          <div className="demo-login">
            <div className="divider">
              <span>Or try demo</span>
            </div>
            <button 
              type="button" 
              className="demo-btn"
              onClick={() => {
                setFormData({ ...formData, email: 'alex@example.com' });
                // Auto-login after a short delay
                setTimeout(() => {
                  handleSubmit({ preventDefault: () => {} });
                }, 500);
              }}
            >
              Use Demo Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
