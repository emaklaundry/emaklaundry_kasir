import { describe, it, expect } from 'vitest';
import useDebounce from './useDebounce';

describe('hooks/useDebounce', () => {
  it('should be a function', () => {
    expect(typeof useDebounce).toBe('function');
  });
});
