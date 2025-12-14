import { describe, it, expect } from 'vitest';
import useStoreFilteredData from '@/hooks/useStoreFilteredData';

describe('hooks/useStoreFilteredData', () => {
  it('should be a function', () => {
    expect(typeof useStoreFilteredData).toBe('function');
  });
});
