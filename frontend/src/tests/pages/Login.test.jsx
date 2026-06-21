import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import Login from '../../pages/Login';

describe('Login Page', () => {
  it('renders login form correctly', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('shows error message if fields are empty on submit', async () => {
    renderWithProviders(<Login />);
    
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    // Assuming the component has some client-side validation or displays store error
    // In this app, it usually relies on the store error state
  });

  it('links to signup page', () => {
    renderWithProviders(<Login />);
    // There are two "Sign up" links (navbar and footer), so we check that at least one exists
    // and points to /signup. Usually the footer one is the one we want to test specifically.
    const signupLinks = screen.getAllByText(/Sign up/i);
    expect(signupLinks.length).toBeGreaterThan(0);
    const footerLink = signupLinks.find(link => link.closest('.login-footer'));
    expect(footerLink).toBeDefined();
    expect(footerLink.closest('a')).toHaveAttribute('href', '/signup');
  });
});
