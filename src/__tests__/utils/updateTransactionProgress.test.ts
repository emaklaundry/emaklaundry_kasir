import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ rpc, auth: { onAuthStateChange: vi.fn() } }),
}));

describe('updateTransactionProgress', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: [{ id: 'trx-1' }], error: null });
  });

  it('forwards the supervisor approval id to the RPC', async () => {
    const { updateTransactionProgress } = await import('@/utils/supabaseClient');
    await updateTransactionProgress('trx-1', {
      paymentMethod: 'QRIS',
      change: 0,
      supervisorApprovalId: 'appr-1',
    });
    expect(rpc).toHaveBeenCalledWith(
      'update_transaction_progress',
      expect.objectContaining({
        transaction_id_input: 'trx-1',
        p_payment_method: 'QRIS',
        p_change: 0,
        p_supervisor_approval_id: 'appr-1',
      }),
    );
  });

  it('omits the approval id when none is given', async () => {
    const { updateTransactionProgress } = await import('@/utils/supabaseClient');
    await updateTransactionProgress('trx-1', { orderStatus: 'Siap Diambil' });
    expect(rpc.mock.calls[0][1].p_supervisor_approval_id).toBeUndefined();
  });

  it('throws the RPC error', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('perlu PIN supervisor') });
    const { updateTransactionProgress } = await import('@/utils/supabaseClient');
    await expect(updateTransactionProgress('trx-1', { paymentMethod: 'Tunai' })).rejects.toThrow(
      /PIN supervisor/,
    );
  });
});
