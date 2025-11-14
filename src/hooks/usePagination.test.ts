import { describe, it, expect } from 'vitest';
import usePagination from './usePagination';

describe('hooks/usePagination', () => {
  it('should be a function', () => {
    expect(typeof usePagination).toBe('function');
  });
});
