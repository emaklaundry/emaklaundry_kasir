import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScheduledMaintenances } from '@/contexts/ScheduledMaintenanceContext';

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
vi.mock('./AssetContext', () => ({ useAssets: () => ({ assets: [] }) }));
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

describe('useScheduledMaintenances', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns scheduledMaintenances and mutation functions', () => {
    const { result } = renderHook(() => useScheduledMaintenances());
    expect(Array.isArray(result.current.scheduledMaintenances)).toBe(true);
    expect(typeof result.current.addScheduledMaintenance).toBe('function');
    expect(typeof result.current.updateScheduledMaintenance).toBe('function');
    expect(typeof result.current.deleteScheduledMaintenance).toBe('function');
  });
});
