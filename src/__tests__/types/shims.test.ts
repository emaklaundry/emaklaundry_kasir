import { describe, it, expect } from 'vitest';
import * as shims from '@/types/shims';

describe('types/shims exports', () => {
  it('should export an object', () => {
    expect(typeof shims).toBe('object');
  });
});
