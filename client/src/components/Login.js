import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail(process.env.REACT_APP_DEMO_EMAIL || '');
    setPassword(process.env.REACT_APP_DEMO_PASSWORD || '');
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-shape shape-1"></div>
        <div className="login-shape shape-2"></div>
        <div className="login-shape shape-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon">🏋️</span>
            <h1>AI Fitness Coach</h1>
          </div>
          <p className="login-subtitle">Your Personal AI-Powered Training Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input type="email" id="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input type="password" id="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? (<><span className="btn-spinner"></span>Signing in...</>) : 'Sign In'}
          </button>

          <button type="button" className="btn btn-secondary demo-btn" onClick={fillDemoCredentials}>
            Auto Fill Demo Credentials
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/forgot-password" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>Forgot your password?</Link>
        </div>

        <div className="login-features">
          <h3>Features Include:</h3>
          <ul>
            <li>AI Workout Generator</li>
            <li>Golf Swing Analyzer</li>
            <li>Running Coach</li>
            <li>Team Formation Optimizer</li>
            <li>Recovery Advisor</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;
