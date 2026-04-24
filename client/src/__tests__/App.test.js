import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock all the route components
jest.mock('../components/Login', () => () => <div data-testid="login">Login</div>);
jest.mock('../components/Dashboard', () => () => <div data-testid="dashboard">Dashboard</div>);
jest.mock('../components/WorkoutList', () => () => <div>WorkoutList</div>);
jest.mock('../components/GolfList', () => () => <div>GolfList</div>);
jest.mock('../components/RunningList', () => () => <div>RunningList</div>);
jest.mock('../components/TeamList', () => () => <div>TeamList</div>);
jest.mock('../components/RecoveryList', () => () => <div>RecoveryList</div>);
jest.mock('../components/Sidebar', () => () => <div>Sidebar</div>);
jest.mock('../components/Profile', () => () => <div>Profile</div>);
jest.mock('../components/Settings', () => () => <div>Settings</div>);
jest.mock('../components/ProgressCharts', () => () => <div>ProgressCharts</div>);
jest.mock('../components/CalendarView', () => () => <div>CalendarView</div>);
jest.mock('../components/Timer', () => () => <div>Timer</div>);
jest.mock('../components/ExportData', () => () => <div>ExportData</div>);
jest.mock('../components/NotificationList', () => () => <div>NotificationList</div>);
jest.mock('../components/Feedback', () => () => <div>Feedback</div>);
jest.mock('../components/PrivacyPolicy', () => () => <div>PrivacyPolicy</div>);
jest.mock('../components/TermsOfService', () => () => <div>TermsOfService</div>);
jest.mock('../components/Contact', () => () => <div>Contact</div>);
jest.mock('../components/AdminPanel', () => () => <div>AdminPanel</div>);
jest.mock('../components/Onboarding', () => () => <div>Onboarding</div>);
jest.mock('../components/ForgotPassword', () => () => <div>ForgotPassword</div>);
jest.mock('../i18n', () => {});

import App from '../App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(<App />);
  });

  it('shows login page when not authenticated', () => {
    render(<App />);
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('redirects to dashboard when authenticated', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test', email: 'test@test.com' }));
    render(<App />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });
});
