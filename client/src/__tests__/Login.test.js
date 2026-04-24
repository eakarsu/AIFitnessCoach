import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/Login';

const renderLogin = (props = {}) => {
  return render(
    <BrowserRouter>
      <Login onLogin={jest.fn()} {...props} />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  it('renders login form', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('has forgot password link', () => {
    renderLogin();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it('fills demo credentials on button click', () => {
    renderLogin();
    fireEvent.click(screen.getByText(/fill demo credentials/i));
    expect(screen.getByLabelText(/email/i)).toHaveValue('demo@aifitness.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('password123');
  });

  it('shows features list', () => {
    renderLogin();
    expect(screen.getByText(/features include/i)).toBeInTheDocument();
  });
});
