import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
vi.mock('@/utils/supabaseClient', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));
vi.mock('../../utils/supabaseClient', () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a) },
}));

import {
  checkTransactionStock,
  DEFAULT_INVENTORY_SETTINGS,
  mapInventorySettings,
} from '../../contexts/InventoryRecipeContext';

describe('mapInventorySettings', () => {
  it('memakai nilai bawaan bila cabang belum pernah diatur', () => {
    expect(mapInventorySettings('s1', null)).toEqual({
      storeId: 's1',
      ...DEFAULT_INVENTORY_SETTINGS,
    });
    expect(DEFAULT_INVENTORY_SETTINGS).toEqual({
      autoDeductEnabled: true,
      deductAt: 'dibuat',
      stockGuard: 'peringatan',
    });
  });

  it('memetakan baris database', () => {
    const s = mapInventorySettings('s1', {
      store_id: 's1',
      auto_deduct_enabled: false,
      deduct_at: 'selesai',
      stock_guard: 'tahan',
      updated_at: '2026-11-27T00:00:00Z',
    });
    expect(s).toMatchObject({
      storeId: 's1',
      autoDeductEnabled: false,
      deductAt: 'selesai',
      stockGuard: 'tahan',
    });
    expect(s.updatedAt).toBeInstanceOf(Date);
  });

  it('nilai tak dikenal jatuh ke bawaan', () => {
    const s = mapInventorySettings('s1', {
      store_id: 's1',
      auto_deduct_enabled: true,
      deduct_at: 'kapan-kapan',
      stock_guard: '???',
    });
    expect(s.deductAt).toBe('dibuat');
    expect(s.stockGuard).toBe('peringatan');
  });
});

describe('checkTransactionStock', () => {
  beforeEach(() => rpc.mockReset());

  it('mengirim baris nota ke RPC dan memetakan kekurangan stok', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          inventory_item_id: 'i1',
          item_name: 'Sabun',
          unit: 'sachet',
          needed: '2.5',
          available: '1',
        },
      ],
      error: null,
    });
    const result = await checkTransactionStock('s1', [{ serviceId: 'kiloan', quantity: 2.5 }]);
    expect(rpc).toHaveBeenCalledWith('check_transaction_stock', {
      p_store_id: 's1',
      p_items: [{ serviceId: 'kiloan', quantity: 2.5 }],
    });
    expect(result).toEqual([
      { inventoryItemId: 'i1', itemName: 'Sabun', unit: 'sachet', needed: 2.5, available: 1 },
    ]);
  });

  it('melempar error dari RPC', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('gagal') });
    await expect(checkTransactionStock('s1', [])).rejects.toThrow('gagal');
  });
});
