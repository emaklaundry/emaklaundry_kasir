import { describe, it, expect } from 'vitest';
import useTheme from './useTheme';

describe('hooks/useTheme', () => {
  it('should be a function', () => {
    expect(typeof useTheme).toBe('function');
  });
});
