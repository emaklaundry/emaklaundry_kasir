/**
 * Unit Tests for Rate Limiter
 * Testing rate limiting functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter, withRateLimit } from '@/utils/rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    rateLimiter.clearAll();
  });

  describe('canExecute', () => {
    it('should allow execution within limit', () => {
      expect(rateLimiter.canExecute('test', 5, 1000)).toBe(true);
      expect(rateLimiter.canExecute('test', 5, 1000)).toBe(true);
      expect(rateLimiter.canExecute('test', 5, 1000)).toBe(true);
    });

    it('should block execution when limit exceeded', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.canExecute('test', 5, 1000);
      }
      expect(rateLimiter.canExecute('test', 5, 1000)).toBe(false);
    });

    it('should allow execution after window expires', async () => {
      vi.useFakeTimers();
      
      for (let i = 0; i < 5; i++) {
        rateLimiter.canExecute('test', 5, 1000);
      }
      expect(rateLimiter.canExecute('test', 5, 1000)).toBe(false);
      
      // Advance time beyond window
      vi.advanceTimersByTime(1100);
      
      expect(rateLimiter.canExecute('test', 5, 1000)).toBe(true);
      
      vi.useRealTimers();
    });

    it('should handle different keys independently', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.canExecute('key1', 5, 1000);
      }
      expect(rateLimiter.canExecute('key1', 5, 1000)).toBe(false);
      expect(rateLimiter.canExecute('key2', 5, 1000)).toBe(true);
    });
  });

  describe('getRemainingCalls', () => {
    it('should return correct remaining calls', () => {
      expect(rateLimiter.getRemainingCalls('test', 5, 1000)).toBe(5);
      
      rateLimiter.canExecute('test', 5, 1000);
      expect(rateLimiter.getRemainingCalls('test', 5, 1000)).toBe(4);
      
      rateLimiter.canExecute('test', 5, 1000);
      expect(rateLimiter.getRemainingCalls('test', 5, 1000)).toBe(3);
    });

    it('should return 0 when limit exceeded', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.canExecute('test', 5, 1000);
      }
      expect(rateLimiter.getRemainingCalls('test', 5, 1000)).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset limit for specific key', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.canExecute('test', 5, 1000);
      }
      expect(rateLimiter.canExecute('test', 5, 1000)).toBe(false);
      
      rateLimiter.reset('test');
      expect(rateLimiter.canExecute('test', 5, 1000)).toBe(true);
    });
  });

  describe('withRateLimit', () => {
    it('should execute function when within limit', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const result = await withRateLimit('test', mockFn, 5, 1000);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should throw error when limit exceeded', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        await withRateLimit('test', mockFn, 5, 1000);
      }
      
      // Should throw on next call
      await expect(
        withRateLimit('test', mockFn, 5, 1000)
      ).rejects.toThrow(/Rate limit exceeded/);
    });
  });
});
