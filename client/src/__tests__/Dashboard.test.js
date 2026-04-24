import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard user={{ id: 1, name: 'Test User', email: 'test@test.com' }} />
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  it('renders training module header', () => {
    renderDashboard();
    expect(screen.getByText(/choose your training module/i)).toBeInTheDocument();
  });

  it('renders all 5 feature cards', () => {
    renderDashboard();
    expect(screen.getByText(/ai workout generator/i)).toBeInTheDocument();
    expect(screen.getByText(/ai golf swing analyzer/i)).toBeInTheDocument();
    expect(screen.getByText(/ai running coach/i)).toBeInTheDocument();
    expect(screen.getByText(/ai team formation optimizer/i)).toBeInTheDocument();
    expect(screen.getByText(/ai recovery advisor/i)).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    renderDashboard();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/ai features/i)).toBeInTheDocument();
  });
});
