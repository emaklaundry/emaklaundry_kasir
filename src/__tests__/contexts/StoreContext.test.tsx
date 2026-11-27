import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { useStores } from '@/contexts/StoreContext';
import { supabase } from '@/utils/supabaseClient';

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
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

describe('useStores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);
  });

  it('waits for a session and keys the store list per user', async () => {
    const { rerender } = renderHook(() => useStores());
    // Belum ada sesi: query tidak boleh jalan (RLS akan mengembalikan [] yang ter-cache).
    expect(vi.mocked(useQuery).mock.calls.at(-1)?.[0]).toMatchObject({
      queryKey: ['stores', null],
      enabled: false,
    });

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    } as never);
    const { result } = renderHook(() => useStores());
    await waitFor(() =>
      expect(vi.mocked(useQuery).mock.calls.at(-1)?.[0]).toMatchObject({
        queryKey: ['stores', 'user-1'],
        enabled: true,
      }),
    );
    rerender();
    expect(result.current.stores).toEqual([]);
  });
  it('returns stores and mutation functions', () => {
    const { result } = renderHook(() => useStores());
    expect(Array.isArray(result.current.stores)).toBe(true);
    expect(typeof result.current.addStore).toBe('function');
    expect(typeof result.current.updateStore).toBe('function');
    expect(typeof result.current.deleteStore).toBe('function');
  });
});
