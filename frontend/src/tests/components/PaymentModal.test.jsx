import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import PaymentModal from '../../components/PaymentModal';

const mockCourse = {
  _id: 'course123',
  title: 'React Masterclass',
  instructorName: 'Dr. Smith',
  price: 49.99,
};

describe('PaymentModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithProviders(
      <PaymentModal
        course={mockCourse}
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders modal content when isOpen is true', () => {
    renderWithProviders(
      <PaymentModal
        course={mockCourse}
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByText('Complete Enrollment')).toBeInTheDocument();
    expect(screen.getByText('React Masterclass')).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Smith/)).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });

  it('shows payment method options', () => {
    renderWithProviders(
      <PaymentModal
        course={mockCourse}
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByText('Credit / Debit Card')).toBeInTheDocument();
    expect(screen.getByText('Digital Wallet')).toBeInTheDocument();
  });

  it('disables confirm button when terms are not accepted', () => {
    renderWithProviders(
      <PaymentModal
        course={mockCourse}
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    const confirmBtn = screen.getByText('Complete Payment').closest('button');
    expect(confirmBtn).toBeDisabled();
  });

  it('shows terms and conditions checkbox', () => {
    renderWithProviders(
      <PaymentModal
        course={mockCourse}
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByText(/Terms & Conditions/)).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('shows processing state when isProcessing is true', () => {
    renderWithProviders(
      <PaymentModal
        course={mockCourse}
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        isProcessing={true}
      />
    );
    expect(screen.getByText(/Processing/)).toBeInTheDocument();
  });

  it('displays correct price for free course', () => {
    const freeCourse = { ...mockCourse, price: 0 };
    renderWithProviders(
      <PaymentModal
        course={freeCourse}
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});
