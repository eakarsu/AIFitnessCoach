import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ user }) {
  const navigate = useNavigate();

  const features = [
    { id: 'workouts', title: 'AI Workout Generator', description: 'Get personalized exercise plans tailored to your fitness level, goals, and available equipment.', icon: '🏋️', color: '#667eea', path: '/workouts' },
    { id: 'golf', title: 'AI Golf Swing Analyzer', description: 'Analyze your swing metrics and receive professional-level form corrections and tips.', icon: '⛳', color: '#11998e', path: '/golf' },
    { id: 'running', title: 'AI Running Coach', description: 'Optimize your pace, track your progress, and get training recommendations.', icon: '🏃', color: '#f093fb', path: '/running' },
    { id: 'team', title: 'AI Team Formation Optimizer', description: 'Get optimal lineup suggestions and strategic formations for your sports team.', icon: '⚽', color: '#ff6b6b', path: '/team' },
    { id: 'recovery', title: 'AI Recovery Advisor', description: 'Personalized rest and nutrition timing recommendations for optimal recovery.', icon: '💤', color: '#00b894', path: '/recovery' }
  ];

  return (
    <div className="page-container">
      <div className="content">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Choose Your Training Module</h2>
          <p className="dashboard-subtitle">Select a feature below to start your AI-powered fitness journey</p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.id} className="feature-card" onClick={() => navigate(feature.path)} style={{ '--feature-color': feature.color }} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate(feature.path)} aria-label={`Go to ${feature.title}`}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-action">
                <span>Get Started</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info"><span className="stat-number">5</span><span className="stat-text">AI Features</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-info"><span className="stat-number">Claude</span><span className="stat-text">Powered by AI</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-info"><span className="stat-number">Real-time</span><span className="stat-text">Analysis</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
