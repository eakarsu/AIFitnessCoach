import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
      setStep('reset');
    } catch (err) { setError('Error sending reset request'); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setMessage('Password reset successfully! You can now log in.');
      setStep('done');
    } catch (err) { setError(err.response?.data?.error || 'Error resetting password'); }
  };

  return (
    <div className="login-container">
      <div className="login-background"><div className="login-shape shape-1"></div><div className="login-shape shape-2"></div></div>
      <div className="login-card">
        <div className="login-header"><h2 style={{color:'white',fontSize:'1.5rem',marginBottom:'0.5rem'}}>Reset Password</h2></div>
        {message && <div style={{background:'rgba(56,239,125,0.2)',border:'1px solid rgba(56,239,125,0.5)',color:'#38ef7d',padding:'0.75rem',borderRadius:'8px',marginBottom:'1rem'}}>{message}</div>}
        {error && <div className="error-message">{error}</div>}
        {step === 'request' && (
          <form onSubmit={handleRequest} className="login-form">
            <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="Enter your email" /></div>
            <button type="submit" className="btn btn-primary login-btn">Send Reset Link</button>
          </form>
        )}
        {step === 'reset' && (
          <form onSubmit={handleReset} className="login-form">
            <div className="form-group"><label className="form-label">Reset Token</label><input className="form-input" value={token} onChange={e=>setToken(e.target.value)} required placeholder="Paste token from email/console" /></div>
            <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-input" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Min 6 characters" /></div>
            <button type="submit" className="btn btn-primary login-btn">Reset Password</button>
          </form>
        )}
        {step === 'done' && <Link to="/login" className="btn btn-primary login-btn" style={{textDecoration:'none',textAlign:'center',display:'block'}}>Go to Login</Link>}
        <div style={{textAlign:'center',marginTop:'1.5rem'}}><Link to="/login" style={{color:'rgba(255,255,255,0.5)',textDecoration:'none'}}>Back to Login</Link></div>
      </div>
    </div>
  );
}
export default ForgotPassword;
