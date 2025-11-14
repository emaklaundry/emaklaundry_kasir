import { describe, it, expect } from 'vitest';
import * as utils from './index';

describe('utils/index exports', () => {
  it('should export an object', () => {
    expect(typeof utils).toBe('object');
  });
});
