import { describe, it, expect } from 'vitest';
import * as formatting from '@/utils/formatting';

describe('utils/formatting exports', () => {
  it('should export an object', () => {
    expect(typeof formatting).toBe('object');
  });
});
import { calculateNextDueDate, formatRupiah, parseRupiah } from '@/utils/formatting';

describe('calculateNextDueDate', () => {
  it('should add days correctly', () => {
    const date = new Date('2023-01-01');
    const result = calculateNextDueDate(date, 5, 'days');
    expect(result.getDate()).toBe(6);
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
  });
  it('should add years correctly', () => {
    const date = new Date('2023-01-01');
    const result = calculateNextDueDate(date, 1, 'years');
    expect(result.getFullYear()).toBe(2024);
  });
});

describe('formatRupiah', () => {
  it('should format number to rupiah string', () => {
    expect(formatRupiah(1000000)).toBe('1.000.000');
  });
  it('should format string number to rupiah string', () => {
    expect(formatRupiah('2000000')).toBe('2.000.000');
  });
  it('should return 0 for invalid input', () => {
    expect(formatRupiah('abc')).toBe('0');
  });
});

describe('parseRupiah', () => {
  it('should parse formatted rupiah string to number', () => {
    expect(parseRupiah('1.000.000')).toBe(1000000);
  });
  it('should parse string with non-digit chars', () => {
    expect(parseRupiah('Rp 2.500.000,-')).toBe(2500000);
  });
  it('should return 0 for invalid input', () => {
    expect(parseRupiah('abc')).toBe(0);
  });
});
