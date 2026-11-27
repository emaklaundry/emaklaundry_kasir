import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/supabaseClient', () => ({ supabase: {} }));
vi.mock('../../utils/supabaseClient', () => ({ supabase: {} }));

import { estimateInventoryUsage } from '../../contexts/InventoryRecipeContext';
import { formatQty, formatQtyDelta, getStockLevel } from '../../utils/inventoryFormat';
import { InventoryRecipe } from '../../types';

const rule = (over: Partial<InventoryRecipe>): InventoryRecipe => ({
  id: 'r',
  inventoryItemId: 'sabun',
  serviceId: null,
  basis: 'per_unit',
  amount: 1,
  isActive: true,
  storeId: 's1',
  ...over,
});

describe('estimateInventoryUsage (cermin fungsi database deduct_inventory_for_transaction)', () => {
  const lines = [
    { serviceId: 'kiloan', quantity: 3 },
    { serviceId: 'bedcover', quantity: 2 },
  ];

  it('per_unit untuk semua layanan dikali total jumlah', () => {
    const usage = estimateInventoryUsage([rule({ amount: 0.5 })], lines);
    expect(usage.get('sabun')).toBe(2.5);
  });

  it('per_unit untuk layanan tertentu hanya menghitung baris yang cocok', () => {
    const usage = estimateInventoryUsage([rule({ amount: 0.5, serviceId: 'kiloan' })], lines);
    expect(usage.get('sabun')).toBe(1.5);
  });

  it('per_transaksi dipotong sekali per nota', () => {
    const usage = estimateInventoryUsage(
      [rule({ inventoryItemId: 'plastik', basis: 'per_transaksi', amount: 1 })],
      lines,
    );
    expect(usage.get('plastik')).toBe(1);
  });

  it('tidak memotong bila layanan tidak ada di nota atau aturan nonaktif', () => {
    const usage = estimateInventoryUsage(
      [
        rule({ basis: 'per_transaksi', serviceId: 'karpet' }),
        rule({ inventoryItemId: 'pewangi', isActive: false }),
      ],
      lines,
    );
    expect(usage.size).toBe(0);
  });

  it('menjumlahkan beberapa aturan untuk item yang sama', () => {
    const usage = estimateInventoryUsage(
      [
        rule({ amount: 1, serviceId: 'kiloan' }),
        rule({ id: 'r2', amount: 2, basis: 'per_transaksi', serviceId: 'bedcover' }),
      ],
      lines,
    );
    expect(usage.get('sabun')).toBe(5);
  });
});

describe('inventoryFormat', () => {
  it('memformat angka desimal gaya Indonesia', () => {
    expect(formatQty(12)).toBe('12');
    expect(formatQty(12.5)).toBe('12,5');
    expect(formatQtyDelta(3)).toBe('+3');
    expect(formatQtyDelta(-1.5)).toBe('−1,5');
  });

  it('menentukan status stok; ambang 0 mematikan peringatan', () => {
    expect(getStockLevel({ stock: 0, lowStockThreshold: 5 })).toBe('out');
    expect(getStockLevel({ stock: -2, lowStockThreshold: 0 })).toBe('out');
    expect(getStockLevel({ stock: 4, lowStockThreshold: 5 })).toBe('low');
    expect(getStockLevel({ stock: 4, lowStockThreshold: 0 })).toBe('ok');
  });
});
