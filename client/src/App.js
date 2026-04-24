import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import WorkoutList from './components/WorkoutList';
import GolfList from './components/GolfList';
import RunningList from './components/RunningList';
import TeamList from './components/TeamList';
import RecoveryList from './components/RecoveryList';
import Sidebar from './components/Sidebar';
import Profile from './components/Profile';
import Settings from './components/Settings';
import ProgressCharts from './components/ProgressCharts';
import CalendarView from './components/CalendarView';
import Timer from './components/Timer';
import ExportData from './components/ExportData';
import NotificationList from './components/NotificationList';
import Feedback from './components/Feedback';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Contact from './components/Contact';
import AdminPanel from './components/AdminPanel';
import Onboarding from './components/Onboarding';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading AI Fitness Coach...</p>
      </div>
    );
  }

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return (
      <div className="app-layout">
        <Sidebar user={user} onLogout={handleLogout} onThemeToggle={toggleTheme} theme={theme} />
        <div className="main-content">
          {children}
        </div>
        {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      </div>
    );
  };

  return (
    <Router>
      <div className="App" data-theme={theme}>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact-public" element={<Contact />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute><WorkoutList user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/golf" element={<ProtectedRoute><GolfList user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/running" element={<ProtectedRoute><RunningList user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamList user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/recovery" element={<ProtectedRoute><RecoveryList user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile user={user} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings onThemeToggle={toggleTheme} theme={theme} /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressCharts /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
          <Route path="/timer" element={<ProtectedRoute><Timer /></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><ExportData /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationList /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
