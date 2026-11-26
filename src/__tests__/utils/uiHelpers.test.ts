import { describe, it, expect } from 'vitest';
import { getStatusBadge, getPaymentStatusBadge } from '@/utils/uiHelpers';

describe('getStatusBadge', () => {
  it('returns correct badge for Diproses', () => {
    expect(getStatusBadge('Diproses')).toBe('badge-info');
  });
  it('returns correct badge for Siap Diambil', () => {
    expect(getStatusBadge('Siap Diambil')).toBe('badge-warning');
  });
  it('returns correct badge for Selesai', () => {
    expect(getStatusBadge('Selesai')).toBe('badge-success');
  });
  it('returns correct badge for Active', () => {
    expect(getStatusBadge('Active')).toBe('badge-success');
  });
  it('returns correct badge for Under Maintenance', () => {
    expect(getStatusBadge('Under Maintenance')).toBe('badge-warning');
  });
  it('returns correct badge for Decommissioned', () => {
    expect(getStatusBadge('Decommissioned')).toBe('badge-danger');
  });
  it('returns default badge for unknown status', () => {
    expect(getStatusBadge('UNKNOWN')).toBe('badge-neutral');
  });
});

describe('getPaymentStatusBadge', () => {
  it('returns correct badge for Lunas', () => {
    expect(getPaymentStatusBadge('Lunas')).toBe('badge-success');
  });
  it('returns correct badge for Belum Lunas', () => {
    expect(getPaymentStatusBadge('Belum Lunas')).toBe('badge-danger');
  });
  it('returns warning badge for Bayar Sebagian', () => {
    expect(getPaymentStatusBadge('Bayar Sebagian')).toBe('badge-warning');
  });
  it('returns default badge for unknown status', () => {
    expect(getPaymentStatusBadge('UNKNOWN')).toBe('badge-neutral');
  });
});
