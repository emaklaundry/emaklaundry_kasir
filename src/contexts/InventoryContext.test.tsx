import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInventoryMutations } from './InventoryContext';

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  },
}));
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<any>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    useMutation: vi.fn().mockImplementation(({ mutationFn, onSuccess }) => ({
      mutateAsync: async (...args: any[]) => {
        const result = await mutationFn(...args);
        if (onSuccess) onSuccess();
        return result;
      },
    })),
  };
});

describe('useInventoryMutations', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns mutation functions', () => {
    const { result } = renderHook(() => useInventoryMutations());
    expect(typeof result.current.addInventoryItem).toBe('function');
    expect(typeof result.current.updateInventoryItem).toBe('function');
    expect(typeof result.current.deleteInventoryItem).toBe('function');
  });
});
