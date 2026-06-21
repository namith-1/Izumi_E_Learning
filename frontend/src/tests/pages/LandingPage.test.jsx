import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import LandingPage from '../../pages/LandingPage';

describe('LandingPage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<LandingPage />);
    // The landing page should have some visible content
    expect(document.body).toBeTruthy();
  });

  it('contains a link or button to login', () => {
    renderWithProviders(<LandingPage />);
    // Check for login-related elements
    const loginElements = screen.queryAllByText(/login|sign in|get started/i);
    expect(loginElements.length).toBeGreaterThan(0);
  });

  it('contains a link or button to signup', () => {
    renderWithProviders(<LandingPage />);
    const signupElements = screen.queryAllByText(/sign up|register|join/i);
    expect(signupElements.length).toBeGreaterThan(0);
  });
});
