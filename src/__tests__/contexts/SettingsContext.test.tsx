import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { useSettings } from '@/contexts/SettingsContext';
import { supabase } from '@/utils/supabaseClient';

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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
    useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false }),
    useMutation: vi.fn().mockImplementation(({ mutationFn, onSuccess }) => ({
      mutateAsync: async (...args: unknown[]) => {
        const result = await mutationFn(...args);
        if (onSuccess) onSuccess();
        return result;
      },
    })),
  };
});

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);
  });

  it('does not fetch settings before login, then fetches per user', async () => {
    renderHook(() => useSettings());
    expect(vi.mocked(useQuery).mock.calls.at(-1)?.[0]).toMatchObject({
      queryKey: ['settings', null],
      enabled: false,
    });

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    } as never);
    renderHook(() => useSettings());
    await waitFor(() =>
      expect(vi.mocked(useQuery).mock.calls.at(-1)?.[0]).toMatchObject({
        queryKey: ['settings', 'user-1'],
        enabled: true,
      }),
    );
  });
  it('returns settings and update function', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toBe(null);
    expect(typeof result.current.updateSettings).toBe('function');
  });
});
