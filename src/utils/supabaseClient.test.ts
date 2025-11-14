import { describe, it, expect } from 'vitest';
import * as supabaseClient from './supabaseClient';

describe('utils/supabaseClient exports', () => {
  it('should export an object', () => {
    expect(typeof supabaseClient).toBe('object');
  });
});
