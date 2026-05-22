import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import './Sidebar.css';

function Sidebar({ user, onLogout, onThemeToggle, theme }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/api/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (err) {
      // ignore — interceptor handles 401
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/workouts', label: 'Workouts', icon: '🏋️' },
    { path: '/golf', label: 'Golf', icon: '⛳' },
    { path: '/running', label: 'Running', icon: '🏃' },
    { path: '/team', label: 'Team', icon: '⚽' },
    { path: '/recovery', label: 'Recovery', icon: '💤' },
    { path: '/training-load-balance', label: 'Load Balance', icon: '⚖️' },
    { path: '/ai-insights', label: 'AI Insights', icon: '🧠' },
    { path: '/ai-coach-advisor', label: 'AI Advisor', icon: '🤖' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/progress', label: 'Progress', icon: '📈' },
    { path: '/export', label: 'Export', icon: '📥' },
    { path: '/notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile hamburger */}
      <button className="hamburger-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)}></div>}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand" onClick={() => setMobileOpen(false)}>
            <span className="sidebar-brand-icon">🏋️</span>
            {!collapsed && <span className="sidebar-brand-text">AI Fitness Coach</span>}
          </Link>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Collapse sidebar">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || 'User'}</span>
              <span className="sidebar-user-email">{user?.email}</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              aria-label={item.label}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
              {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={onThemeToggle} aria-label="Toggle theme">
            <span className="sidebar-link-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {!collapsed && <span className="sidebar-link-label">Toggle Theme</span>}
          </button>
          <button className="sidebar-link sidebar-logout" onClick={onLogout} aria-label="Logout">
            <span className="sidebar-link-icon">🚪</span>
            {!collapsed && <span className="sidebar-link-label">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
