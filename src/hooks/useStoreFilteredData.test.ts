import { describe, it, expect } from 'vitest';
import useStoreFilteredData from './useStoreFilteredData';

describe('hooks/useStoreFilteredData', () => {
  it('should be a function', () => {
    expect(typeof useStoreFilteredData).toBe('function');
  });
});
