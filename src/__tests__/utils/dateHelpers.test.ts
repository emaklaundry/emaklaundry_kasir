/**
 * Unit Tests for Date Helpers
 * Testing utility functions untuk date handling
 */

import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  parseLocalDate,
  getStartOfDay,
  getEndOfDay,
  isValidDateString,
  formatDateDisplay,
} from '@/utils/dateHelpers';

describe('dateHelpers', () => {
  describe('getLocalDateString', () => {
    it('should return current date in YYYY-MM-DD format when no argument', () => {
      const result = getLocalDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle Date object', () => {
      const date = new Date(2025, 11, 13); // December 13, 2025
      const result = getLocalDateString(date);
      expect(result).toBe('2025-12-13');
    });

    it('should handle ISO string', () => {
      const result = getLocalDateString('2025-12-13T10:30:00Z');
      expect(result).toBe('2025-12-13');
    });

    it('should handle YYYY-MM-DD string directly', () => {
      const result = getLocalDateString('2025-12-13');
      expect(result).toBe('2025-12-13');
    });
  });

  describe('parseLocalDate', () => {
    it('should parse YYYY-MM-DD string to Date object', () => {
      const result = parseLocalDate('2025-12-13');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(13);
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of day (00:00:00)', () => {
      const result = getStartOfDay('2025-12-13');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should handle Date object', () => {
      const date = new Date(2025, 11, 13, 14, 30, 45);
      const result = getStartOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getDate()).toBe(13);
    });
  });

  describe('getEndOfDay', () => {
    it('should return end of day (23:59:59.999)', () => {
      const result = getEndOfDay('2025-12-13');
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('isValidDateString', () => {
    it('should validate correct YYYY-MM-DD format', () => {
      expect(isValidDateString('2025-12-13')).toBe(true);
    });

    it('should reject invalid format', () => {
      expect(isValidDateString('13-12-2025')).toBe(false);
      expect(isValidDateString('2025/12/13')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(isValidDateString('2025-13-01')).toBe(false); // Month 13
      expect(isValidDateString('2025-02-30')).toBe(false); // Feb 30
    });
  });

  describe('formatDateDisplay', () => {
    it('should format date as DD/MM/YYYY', () => {
      const date = new Date(2025, 11, 13);
      const result = formatDateDisplay(date);
      expect(result).toBe('13/12/2025');
    });

    it('should handle ISO string', () => {
      const result = formatDateDisplay('2025-12-13T00:00:00Z');
      // Note: Might vary based on timezone
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });
});
