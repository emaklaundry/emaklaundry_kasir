import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStores } from './StoreContext';

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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
  beforeEach(() => vi.clearAllMocks());
  it('returns stores and mutation functions', () => {
    const { result } = renderHook(() => useStores());
    expect(Array.isArray(result.current.stores)).toBe(true);
    expect(typeof result.current.addStore).toBe('function');
    expect(typeof result.current.updateStore).toBe('function');
    expect(typeof result.current.deleteStore).toBe('function');
  });
});
