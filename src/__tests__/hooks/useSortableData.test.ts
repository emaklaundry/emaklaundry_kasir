import { describe, it, expect } from 'vitest';
import useSortableData from '@/hooks/useSortableData';

describe('hooks/useSortableData', () => {
  it('should be a function', () => {
    expect(typeof useSortableData).toBe('function');
  });
});
