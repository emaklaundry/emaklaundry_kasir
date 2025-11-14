import { describe, it, expect } from 'vitest';
import * as types from './index';

describe('types/index exports', () => {
  it('should export an object', () => {
    expect(typeof types).toBe('object');
  });
});
