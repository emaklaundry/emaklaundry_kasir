import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { AppProvider } from '@/contexts/AppContext';
import { ToastProvider } from '@/contexts/ToastContext';
import useAppContext from '@/contexts/useAppContext';

const db = vi.hoisted(() => ({
  profileResult: { data: null, error: null } as {
    data: Record<string, unknown> | null;
    error: { message: string } | null;
  },
  signOut: vi.fn(),
}));

vi.mock('@/utils/supabaseClient', () => {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: () => Promise.resolve(db.profileResult),
    insert: () => Promise.resolve({}),
  };
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'user-1' } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
        signOut: db.signOut,
      },
      from: () => query,
    },
  };
});
vi.mock('@/contexts/StoreContext', () => ({ useStores: () => ({ stores: [] }) }));
vi.mock('@/utils/attendanceTracker', () => ({
  ATTENDANCE_ACTIVITY_EVENTS: [],
  ATTENDANCE_PING_INTERVAL_MS: 60_000,
  recordAttendance: vi.fn().mockResolvedValue(undefined),
}));

const OFFLINE_PROFILE_KEY = 'offline-profile';

const cashierRow = {
  id: 'user-1',
  name: 'Kasir Satu',
  role: 'Kasir',
  store_id: 'store-1',
  created_at: '2026-01-01T00:00:00.000Z',
  isActive: true,
  employee_id: 'emp-1',
};

const cachedProfile = (id = 'user-1') =>
  JSON.stringify({
    id,
    name: 'Kasir Satu',
    role: 'Kasir',
    storeId: 'store-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    isActive: true,
    employeeId: 'emp-1',
  });

const Probe = () => {
  const { currentUser, loading, selectedStoreId, signOut } = useAppContext();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{currentUser ? currentUser.name : 'none'}</span>
      <span data-testid="created">{currentUser?.createdAt?.toISOString() ?? '-'}</span>
      <span data-testid="store">{selectedStoreId}</span>
      <button onClick={() => void signOut()}>logout</button>
    </div>
  );
};

const renderApp = async () => {
  render(
    <ToastProvider>
      <AppProvider>
        <Probe />
      </AppProvider>
    </ToastProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
};

describe('AppContext offline profile fallback', () => {
  beforeEach(() => {
    sessionStorage.clear();
    db.signOut.mockResolvedValue({});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db.signOut.mockReset();
    sessionStorage.clear();
  });

  it('remembers the verified profile for this tab after an online login', async () => {
    db.profileResult = { data: cashierRow, error: null };
    await renderApp();

    expect(screen.getByTestId('user').textContent).toBe('Kasir Satu');
    expect(JSON.parse(sessionStorage.getItem(OFFLINE_PROFILE_KEY)!)).toMatchObject({
      id: 'user-1',
      storeId: 'store-1',
    });
  });

  it('keeps the cashier signed in when the profile cannot be fetched offline', async () => {
    sessionStorage.setItem(OFFLINE_PROFILE_KEY, cachedProfile());
    db.profileResult = { data: null, error: { message: 'TypeError: Failed to fetch' } };
    await renderApp();

    expect(screen.getByTestId('user').textContent).toBe('Kasir Satu');
    expect(screen.getByTestId('created').textContent).toBe('2026-01-01T00:00:00.000Z');
    expect(screen.getByTestId('store').textContent).toBe('store-1');
    expect(db.signOut).not.toHaveBeenCalled();
  });

  it('ignores a saved profile that belongs to another account', async () => {
    sessionStorage.setItem(OFFLINE_PROFILE_KEY, cachedProfile('someone-else'));
    db.profileResult = { data: null, error: { message: 'TypeError: Failed to fetch' } };
    await renderApp();

    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('does not use the saved profile when the server answers with a real error', async () => {
    sessionStorage.setItem(OFFLINE_PROFILE_KEY, cachedProfile());
    db.profileResult = { data: null, error: { message: 'permission denied for table profiles' } };
    await renderApp();

    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('forgets the saved profile on logout', async () => {
    db.profileResult = { data: cashierRow, error: null };
    await renderApp();
    expect(sessionStorage.getItem(OFFLINE_PROFILE_KEY)).not.toBeNull();

    await act(async () => {
      screen.getByText('logout').click();
    });

    expect(sessionStorage.getItem(OFFLINE_PROFILE_KEY)).toBeNull();
    expect(db.signOut).toHaveBeenCalled();
  });
});
