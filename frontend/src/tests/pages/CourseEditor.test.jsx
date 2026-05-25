import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import CourseEditor from '../../pages/InstructorCourse/CourseEditor';

describe('CourseEditor - Revenue Share', () => {
  it('does not show revenue share slider when price is 0', () => {
    renderWithProviders(<CourseEditor />, {
      preloadedState: {
        auth: { user: { id: 'teacher1', role: 'teacher' } }
      }
    });
    
    expect(screen.queryByText(/Your Revenue Share/i)).not.toBeInTheDocument();
  });

  it('shows revenue share slider when price is greater than 0', async () => {
    renderWithProviders(<CourseEditor />, {
      preloadedState: {
        auth: { user: { id: 'teacher1', role: 'teacher' } }
      }
    });

    const priceInput = screen.getByLabelText(/Course Price/i);
    fireEvent.change(priceInput, { target: { value: '100' } });

    expect(screen.getByText(/Your Revenue Share/i)).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument(); // Default value
  });

  it('calculates earnings correctly based on price and share percentage', async () => {
    renderWithProviders(<CourseEditor />, {
      preloadedState: {
        auth: { user: { id: 'teacher1', role: 'teacher' } }
      }
    });

    const priceInput = screen.getByLabelText(/Course Price/i);
    fireEvent.change(priceInput, { target: { value: '200' } });

    // Default 30% of 200 = 60
    expect(screen.getByText(/\$60\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$140\.00/)).toBeInTheDocument(); // Platform share

    // Change share to 50%
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50' } });

    expect(screen.getByText('50%')).toBeInTheDocument();
    
    // Both You earn and Platform will show $100.00, so we check for both
    const earningsDisplays = screen.getAllByText(/\$100\.00/);
    expect(earningsDisplays.length).toBe(2);
  });

  it('updates platform share in real-time when share percentage changes', async () => {
    renderWithProviders(<CourseEditor />, {
      preloadedState: {
        auth: { user: { id: 'teacher1', role: 'teacher' } }
      }
    });

    const priceInput = screen.getByLabelText(/Course Price/i);
    fireEvent.change(priceInput, { target: { value: '1000' } });

    const slider = screen.getByRole('slider');
    
    // Move slider to 10%
    fireEvent.change(slider, { target: { value: '10' } });
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument(); // Instructor
    expect(screen.getByText(/\$900\.00/)).toBeInTheDocument(); // Platform

    // Move slider to 90%
    fireEvent.change(slider, { target: { value: '90' } });
    expect(screen.getByText(/\$900\.00/)).toBeInTheDocument(); // Instructor
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument(); // Platform
  });
});
