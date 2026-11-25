import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/utils/supabaseClient', () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

import {
  autoDiscountAmount,
  isValidPinFormat,
  needsManualDiscountApproval,
  requestSupervisorApproval,
} from '@/utils/supervisorApproval';

describe('supervisor approval rules', () => {
  it('matches the database: only discount above the automatic rate needs a PIN', () => {
    expect(autoDiscountAmount(50_000, 10)).toBe(5_000);
    expect(needsManualDiscountApproval(5_000, 50_000, 10)).toBe(false);
    expect(needsManualDiscountApproval(5_001, 50_000, 10)).toBe(false); // toleransi Rp1
    expect(needsManualDiscountApproval(5_002, 50_000, 10)).toBe(true);
    expect(needsManualDiscountApproval(1, 50_000, undefined)).toBe(false);
    expect(needsManualDiscountApproval(2, 50_000, undefined)).toBe(true);
  });

  it('accepts only 6-digit PINs', () => {
    expect(isValidPinFormat('482913')).toBe(true);
    expect(isValidPinFormat('48291')).toBe(false);
    expect(isValidPinFormat('48291a')).toBe(false);
  });
});

describe('requestSupervisorApproval', () => {
  beforeEach(() => rpc.mockReset());

  it('returns the approval when the PIN is correct', async () => {
    rpc.mockResolvedValue({
      data: { approval_id: 'ap-1', approver_name: 'Bu Admin' },
      error: null,
    });
    await expect(
      requestSupervisorApproval('manual_discount', '482913', { maxAmount: 15_000 }),
    ).resolves.toEqual({ ok: true, approvalId: 'ap-1', approverName: 'Bu Admin' });
    expect(rpc).toHaveBeenCalledWith('request_supervisor_approval', {
      p_action: 'manual_discount',
      p_pin: '482913',
      p_max_amount: 15_000,
      p_transaction_id: undefined,
    });
  });

  it('reports remaining attempts for a wrong PIN', async () => {
    rpc.mockResolvedValue({ data: { approval_id: null, remaining_attempts: 3 }, error: null });
    await expect(requestSupervisorApproval('edit_paid', '000001')).resolves.toEqual({
      ok: false,
      remainingAttempts: 3,
    });
  });

  it('throws the database message when locked out', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Terlalu banyak PIN salah. Coba lagi dalam 12 menit.' },
    });
    await expect(requestSupervisorApproval('manual_discount', '111222')).rejects.toThrow(
      'Terlalu banyak PIN salah',
    );
  });
});
