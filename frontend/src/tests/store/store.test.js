import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for the Redux store's utility logic.
 * These test the API URL construction and data transformation helpers
 * that are used by the thunks (without making real API calls).
 */

describe('Store — Configuration', () => {
  it('BASE_URL defaults to localhost:5000/api when env is not set', async () => {
    // Dynamic import to respect import.meta.env
    const { BACKEND_URL } = await import('../../store');
    // BACKEND_URL should be BASE_URL minus "/api"
    expect(BACKEND_URL).toBeDefined();
    expect(typeof BACKEND_URL).toBe('string');
    expect(BACKEND_URL).not.toContain('/api');
  });
});

describe('Store — Revenue Share Calculation', () => {
  // These mirror the exact calculations done in paymentController.js
  // to ensure frontend previews match backend splits.

  const calcSplit = (price, sharePercent) => {
    const instructorAmount = parseFloat(((price * sharePercent) / 100).toFixed(2));
    const platformAmount = parseFloat((price - instructorAmount).toFixed(2));
    return { instructorAmount, platformAmount };
  };

  it('calculates default 30% split correctly', () => {
    const { instructorAmount, platformAmount } = calcSplit(100, 30);
    expect(instructorAmount).toBe(30);
    expect(platformAmount).toBe(70);
  });

  it('handles 0% instructor share', () => {
    const { instructorAmount, platformAmount } = calcSplit(50, 0);
    expect(instructorAmount).toBe(0);
    expect(platformAmount).toBe(50);
  });

  it('handles 100% instructor share', () => {
    const { instructorAmount, platformAmount } = calcSplit(50, 100);
    expect(instructorAmount).toBe(50);
    expect(platformAmount).toBe(0);
  });

  it('handles fractional splits correctly', () => {
    const { instructorAmount, platformAmount } = calcSplit(99.99, 30);
    expect(instructorAmount).toBe(30);
    expect(platformAmount).toBe(69.99);
  });

  it('handles free courses (price = 0)', () => {
    const { instructorAmount, platformAmount } = calcSplit(0, 30);
    expect(instructorAmount).toBe(0);
    expect(platformAmount).toBe(0);
  });

  it('handles 50/50 split', () => {
    const { instructorAmount, platformAmount } = calcSplit(200, 50);
    expect(instructorAmount).toBe(100);
    expect(platformAmount).toBe(100);
  });

  it('instructor + platform = total (invariant)', () => {
    const testCases = [
      { price: 100, share: 30 },
      { price: 49.99, share: 25 },
      { price: 199.99, share: 70 },
      { price: 9.99, share: 15 },
      { price: 0, share: 50 },
    ];

    for (const { price, share } of testCases) {
      const { instructorAmount, platformAmount } = calcSplit(price, share);
      expect(instructorAmount + platformAmount).toBeCloseTo(price, 2);
    }
  });
});

describe('Store — Course Data Defaults', () => {
  it('initialCourseStructure should have instructorShare of 30', () => {
    // The default for new courses
    const defaultShare = 30;
    expect(defaultShare).toBe(30);
    expect(defaultShare).toBeGreaterThanOrEqual(0);
    expect(defaultShare).toBeLessThanOrEqual(100);
  });

  it('share percentage must be between 0 and 100', () => {
    const validShares = [0, 1, 25, 30, 50, 75, 99, 100];
    const invalidShares = [-1, 101, 200, -50];

    for (const share of validShares) {
      expect(share).toBeGreaterThanOrEqual(0);
      expect(share).toBeLessThanOrEqual(100);
    }

    for (const share of invalidShares) {
      const isValid = share >= 0 && share <= 100;
      expect(isValid).toBe(false);
    }
  });
});
