import { describe, it, expect } from 'vitest';
import { calculateNextDueDate, formatRupiah, parseRupiah } from '../formatting';

describe('formatRupiah', () => {
  it('should format number correctly', () => {
    expect(formatRupiah(10000)).toBe('10.000');
    expect(formatRupiah(1000000)).toBe('1.000.000');
    expect(formatRupiah(0)).toBe('0');
  });

  it('should format string input', () => {
    expect(formatRupiah('10000')).toBe('10.000');
    expect(formatRupiah('1.000.000')).toBe('1.000.000');
  });

  it('should handle invalid input gracefully', () => {
    expect(formatRupiah('invalid')).toBe('0');
    expect(formatRupiah(NaN)).toBe('0');
    expect(formatRupiah(null as any)).toBe('0');
    expect(formatRupiah(undefined as any)).toBe('0');
    expect(formatRupiah('')).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(formatRupiah(-10000)).toBe('-10.000');
  });

  it('should handle decimal numbers', () => {
    expect(formatRupiah(10000.5)).toBe('10.000,5');
  });
});

describe('parseRupiah', () => {
  it('should parse formatted string correctly', () => {
    expect(parseRupiah('10.000')).toBe(10000);
    expect(parseRupiah('1.000.000')).toBe(1000000);
  });

  it('should handle Rp prefix', () => {
    expect(parseRupiah('Rp 10.000')).toBe(10000);
    expect(parseRupiah('Rp10.000')).toBe(10000);
  });

  it('should handle plain numbers', () => {
    expect(parseRupiah('10000')).toBe(10000);
  });

  it('should handle invalid input gracefully', () => {
    expect(parseRupiah('')).toBe(0);
    expect(parseRupiah('invalid')).toBe(0);
    expect(parseRupiah(null as any)).toBe(0);
    expect(parseRupiah(undefined as any)).toBe(0);
  });

  it('should extract numbers from mixed string', () => {
    expect(parseRupiah('Total: Rp 15.000,-')).toBe(15000);
  });
});

describe('calculateNextDueDate', () => {
  it('should add days correctly', () => {
    const date = new Date('2023-01-01');
    const result = calculateNextDueDate(date, 5, 'days');
    expect(result.getDate()).toBe(6);
    expect(result.getMonth()).toBe(0); // January
  });

  it('should add weeks correctly', () => {
    const date = new Date('2023-01-01');
    const result = calculateNextDueDate(date, 2, 'weeks');
    expect(result.getDate()).toBe(15);
  });

  it('should add months correctly', () => {
    const date = new Date('2023-01-01');
    const result = calculateNextDueDate(date, 1, 'months');
    expect(result.getMonth()).toBe(1); // February
    expect(result.getFullYear()).toBe(2023);
  });

  it('should add years correctly', () => {
    const date = new Date('2023-01-01');
    const result = calculateNextDueDate(date, 1, 'years');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0); // Still January
  });

  it('should handle invalid date input with fallback', () => {
    const invalidDate = new Date('invalid');
    const result = calculateNextDueDate(invalidDate, 1, 'days');

    // Should return a valid date (fallback to 30 days from now)
    expect(result instanceof Date).toBe(true);
    expect(!isNaN(result.getTime())).toBe(true);

    // Should be in the future
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });

  it('should handle edge cases for month-end dates', () => {
    const date = new Date('2023-01-31');
    const result = calculateNextDueDate(date, 1, 'months');

    // JavaScript Date handles this automatically
    // Jan 31 + 1 month = Feb 28/29 or Mar 3 depending on implementation
    expect(result.getMonth()).toBeGreaterThanOrEqual(1);
  });

  it('should handle leap year correctly', () => {
    const date = new Date('2024-02-29'); // Leap year
    const result = calculateNextDueDate(date, 1, 'years');
    expect(result.getFullYear()).toBe(2025);
    // Feb 29 + 1 year in non-leap year becomes Feb 28 or Mar 1
    expect([1, 2]).toContain(result.getMonth());
  });

  it('should handle zero value', () => {
    const date = new Date('2023-01-15');
    const result = calculateNextDueDate(date, 0, 'days');
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(0);
  });

  it('should handle large values', () => {
    const date = new Date('2023-01-01');
    const result = calculateNextDueDate(date, 365, 'days');
    expect(result.getFullYear()).toBe(2024);
  });

  it('should handle multiple month additions spanning years', () => {
    const date = new Date('2023-11-01');
    const result = calculateNextDueDate(date, 3, 'months');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1); // February
  });
});
