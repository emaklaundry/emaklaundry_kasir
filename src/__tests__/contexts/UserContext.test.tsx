import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getFunctionErrorMessage, useUsers } from '@/contexts/UserContext';

const { profileFilterMock, useQueryMock } = vi.hoisted(() => ({
  profileFilterMock: vi.fn(),
  useQueryMock: vi.fn(),
}));

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    is: profileFilterMock,
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
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
    useQuery: useQueryMock,
    useMutation: vi.fn().mockImplementation(({ mutationFn, onSuccess }) => ({
      mutateAsync: async (...args: unknown[]) => {
        const result = await mutationFn(...args);
        if (onSuccess) onSuccess();
        return result;
      },
    })),
  };
});

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockReturnValue({ data: [], isLoading: false });
    profileFilterMock.mockResolvedValue({ data: [], error: null });
  });
  it('returns users and mutation functions', () => {
    const { result } = renderHook(() => useUsers());
    expect(Array.isArray(result.current.users)).toBe(true);
    expect(typeof result.current.updateUser).toBe('function');
    expect(typeof result.current.createUser).toBe('function');
    expect(typeof result.current.deleteUser).toBe('function');
  });

  it('excludes employee login profiles from user management', async () => {
    renderHook(() => useUsers());
    const queryOptions = useQueryMock.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    await queryOptions.queryFn();

    expect(profileFilterMock).toHaveBeenCalledWith('employee_id', null);
  });
});

describe('getFunctionErrorMessage', () => {
  it('mengambil pesan asli dari body respons Edge Function', async () => {
    const error = Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: new Response(JSON.stringify({ error: 'Email sudah terdaftar' }), { status: 409 }),
    });
    await expect(getFunctionErrorMessage(error)).resolves.toBe('Email sudah terdaftar');
  });

  it('memakai pesan umum kalau body bukan JSON', async () => {
    const error = Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: new Response('Not Found', { status: 404 }),
    });
    await expect(getFunctionErrorMessage(error)).resolves.toBe(
      'Edge Function returned a non-2xx status code',
    );
  });

  it('galat biasa', async () => {
    await expect(getFunctionErrorMessage(new Error('network'))).resolves.toBe('network');
  });
});
