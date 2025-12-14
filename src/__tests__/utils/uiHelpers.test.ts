import { describe, it, expect } from 'vitest';
import { getStatusBadge, getPaymentStatusBadge } from '@/utils/uiHelpers';

describe('getStatusBadge', () => {
  it('returns correct badge for Diproses', () => {
    expect(getStatusBadge('Diproses')).toMatch(/blue/);
  });
  it('returns correct badge for Siap Diambil', () => {
    expect(getStatusBadge('Siap Diambil')).toMatch(/yellow/);
  });
  it('returns correct badge for Selesai', () => {
    expect(getStatusBadge('Selesai')).toMatch(/green/);
  });
  it('returns correct badge for Active', () => {
    expect(getStatusBadge('Active')).toMatch(/green/);
  });
  it('returns correct badge for Under Maintenance', () => {
    expect(getStatusBadge('Under Maintenance')).toMatch(/yellow/);
  });
  it('returns correct badge for Decommissioned', () => {
    expect(getStatusBadge('Decommissioned')).toMatch(/red/);
  });
  it('returns default badge for unknown status', () => {
    expect(getStatusBadge('UNKNOWN')).toMatch(/slate/);
  });
});

describe('getPaymentStatusBadge', () => {
  it('returns correct badge for Lunas', () => {
    expect(getPaymentStatusBadge('Lunas')).toMatch(/green/);
  });
  it('returns correct badge for Belum Lunas', () => {
    expect(getPaymentStatusBadge('Belum Lunas')).toMatch(/red/);
  });
  it('returns default badge for unknown status', () => {
    expect(getPaymentStatusBadge('UNKNOWN')).toMatch(/slate/);
  });
});
