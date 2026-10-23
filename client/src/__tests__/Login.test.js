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

  it('offers no demo-credential shortcut', () => {
    renderLogin();
    expect(screen.queryByText(/fill demo credentials/i)).toBeNull();
    expect(screen.queryByText(/log in as demo/i)).toBeNull();
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/password/i)).toHaveValue('');
  });

  it('shows features list', () => {
    renderLogin();
    expect(screen.getByText(/features include/i)).toBeInTheDocument();
  });
});
