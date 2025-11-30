import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AppProvider } from './AppContext';
import { ToastProvider } from './ToastContext';
import { useAuditLogs } from './AuditLogContext';

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
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

describe('useAuditLogs', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns logs and addAuditLog function', () => {
    const { result } = renderHook(() => useAuditLogs(), {
      wrapper: ({ children }) => (
        <ToastProvider>
          <AppProvider>{children}</AppProvider>
        </ToastProvider>
      ),
    });
    expect(Array.isArray(result.current.logs)).toBe(true);
    expect(typeof result.current.addAuditLog).toBe('function');
  });
});
