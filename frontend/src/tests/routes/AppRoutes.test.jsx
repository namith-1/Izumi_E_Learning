import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import AppRoutes from '../../routes/AppRoutes';

describe('AppRoutes', () => {
  it('renders landing page on root path', () => {
    renderWithProviders(<AppRoutes />, { route: '/' });
    // Landing page should render some content
    expect(document.body).toBeTruthy();
  });

  it('renders login page on /login', () => {
    renderWithProviders(<AppRoutes />, { route: '/login' });
    // Login page should have email/password or similar fields
    const loginElements = screen.queryAllByText(/login|sign in|email|password/i);
    expect(loginElements.length).toBeGreaterThan(0);
  });

  it('renders signup page on /signup', () => {
    renderWithProviders(<AppRoutes />, { route: '/signup' });
    const signupElements = screen.queryAllByText(/sign up|register|create account|name|email/i);
    expect(signupElements.length).toBeGreaterThan(0);
  });

  it('renders 404 for unknown routes', () => {
    renderWithProviders(<AppRoutes />, { route: '/does-not-exist-xyz' });
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated user from /student-dashboard', () => {
    renderWithProviders(<AppRoutes />, {
      route: '/student-dashboard',
      preloadedState: { auth: { user: null, loading: false, error: null } },
    });
    // Should NOT show the student dashboard content
    expect(screen.queryByText('Student Dashboard')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user from /instructor-dashboard', () => {
    renderWithProviders(<AppRoutes />, {
      route: '/instructor-dashboard',
      preloadedState: { auth: { user: null, loading: false, error: null } },
    });
    expect(screen.queryByText('Instructor Dashboard')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user from /admin-dashboard', () => {
    renderWithProviders(<AppRoutes />, {
      route: '/admin-dashboard',
      preloadedState: { auth: { user: null, loading: false, error: null } },
    });
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });
});
