import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAssets } from '@/contexts/AssetContext';

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
    useMutation: vi.fn().mockImplementation(({ mutationFn, onSuccess }) => ({
      mutateAsync: async (...args: unknown[]) => {
        const result = await mutationFn(...args);
        if (onSuccess) onSuccess();
        return result;
      },
    })),
  };
});

describe('useAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns assets and mutation functions', async () => {
    const { result } = renderHook(() => useAssets());
    expect(Array.isArray(result.current.assets)).toBe(true);
    expect(typeof result.current.addAsset).toBe('function');
    expect(typeof result.current.updateAsset).toBe('function');
    expect(typeof result.current.deleteAsset).toBe('function');
  });

  it('can add, update, and delete asset', async () => {
    const { result } = renderHook(() => useAssets());
    await expect(
      result.current.addAsset({
        name: 'Aset Baru',
        serialNumber: 'SN-001',
        purchaseDate: new Date(),
        purchaseCost: 1000000,
        status: 'Active',
        storeId: '1',
        maintenanceHistory: [],
      }),
    ).resolves.toBeNull();
    await expect(result.current.updateAsset('id', { name: 'Baru' })).resolves.toBeNull();
    await expect(result.current.deleteAsset('id')).resolves.toBe('id');
  });
});
