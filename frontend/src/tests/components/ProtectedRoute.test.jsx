import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ProtectedRoute from '../../components/ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects to /login when user is not authenticated', () => {
    renderWithProviders(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { preloadedState: { auth: { user: null, loading: false, error: null } } }
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading indicator while auth is loading', () => {
    renderWithProviders(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { preloadedState: { auth: { user: null, loading: true, error: null } } }
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated with correct role', () => {
    renderWithProviders(
      <ProtectedRoute allowedRole="student">
        <div>Student Dashboard Content</div>
      </ProtectedRoute>,
      {
        preloadedState: {
          auth: { user: { id: '1', role: 'student', name: 'Test' }, loading: false, error: null },
        },
      }
    );
    expect(screen.getByText('Student Dashboard Content')).toBeInTheDocument();
  });

  it('redirects admin to /admin-dashboard when accessing non-admin route', () => {
    renderWithProviders(
      <ProtectedRoute allowedRole="student">
        <div>Student Only</div>
      </ProtectedRoute>,
      {
        preloadedState: {
          auth: { user: { id: '1', role: 'admin', name: 'Admin' }, loading: false, error: null },
        },
      }
    );
    expect(screen.queryByText('Student Only')).not.toBeInTheDocument();
  });

  it('renders children for admin on admin-specific routes', () => {
    renderWithProviders(
      <ProtectedRoute allowedRole="admin">
        <div>Admin Panel</div>
      </ProtectedRoute>,
      {
        preloadedState: {
          auth: { user: { id: '1', role: 'admin', name: 'Admin' }, loading: false, error: null },
        },
      }
    );
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('redirects teacher away from student-only routes', () => {
    renderWithProviders(
      <ProtectedRoute allowedRole="student">
        <div>Student Only</div>
      </ProtectedRoute>,
      {
        preloadedState: {
          auth: { user: { id: '1', role: 'teacher', name: 'Prof' }, loading: false, error: null },
        },
      }
    );
    expect(screen.queryByText('Student Only')).not.toBeInTheDocument();
  });

  it('renders children when no specific role is required and user is logged in', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>General Protected</div>
      </ProtectedRoute>,
      {
        preloadedState: {
          auth: { user: { id: '1', role: 'student', name: 'User' }, loading: false, error: null },
        },
      }
    );
    expect(screen.getByText('General Protected')).toBeInTheDocument();
  });
});
