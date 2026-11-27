import { describe, expect, it } from 'vitest';
import { getInitials, translateAuthError } from '../loginHelpers';

describe('getInitials', () => {
  it('uses the first and last word', () => {
    expect(getInitials('Siti Aminah')).toBe('SA');
    expect(getInitials('  muhammad  rizki   pratama ')).toBe('MP');
  });

  it('uses one letter for single-word names and ? for empty names', () => {
    expect(getInitials('Sari')).toBe('S');
    expect(getInitials('   ')).toBe('?');
  });
});

describe('translateAuthError', () => {
  it('translates known Supabase errors', () => {
    expect(translateAuthError({ message: 'Invalid login credentials' })).toBe(
      'Email atau password salah.',
    );
    expect(translateAuthError({ message: 'x', code: 'email_not_confirmed' })).toMatch(
      /belum dikonfirmasi/,
    );
    expect(translateAuthError({ message: 'x', status: 429 })).toMatch(/Terlalu banyak/);
  });

  it('passes unknown messages through unchanged', () => {
    expect(translateAuthError({ message: 'Pesan lain' })).toBe('Pesan lain');
  });
});
