import { describe, expect, it } from 'vitest';
import {
  isEmployeeLoginProfilesResponse,
  isEmployeeLoginResponse,
  isValidEmployeePin,
} from '@/utils/employeeAuth';

describe('isValidEmployeePin', () => {
  it('accepts exactly six numeric digits, including leading zeroes', () => {
    expect(isValidEmployeePin('001234')).toBe(true);
  });

  it.each(['12345', '1234567', '12a456', ' 12345', '123456 '])('rejects invalid PIN %s', (pin) => {
    expect(isValidEmployeePin(pin)).toBe(false);
  });
});

describe('employee login response validation', () => {
  it('accepts a safe list of profile cards', () => {
    expect(
      isEmployeeLoginProfilesResponse({
        profiles: [{ id: 'employee-1', name: 'Sari', storeName: null }],
      }),
    ).toBe(true);
  });

  it('rejects malformed profile lists and incomplete sessions', () => {
    expect(isEmployeeLoginProfilesResponse({ profiles: [{ id: 1, name: 'Sari' }] })).toBe(false);
    expect(isEmployeeLoginResponse({ session: { access_token: 'token' } })).toBe(false);
  });
});
