import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useServices } from './ServiceContext';

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
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
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

describe('useServices', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns services and mutation functions', () => {
    const { result } = renderHook(() => useServices());
    expect(Array.isArray(result.current.services)).toBe(true);
    expect(typeof result.current.addService).toBe('function');
    expect(typeof result.current.updateService).toBe('function');
    expect(typeof result.current.deleteService).toBe('function');
  });
});
