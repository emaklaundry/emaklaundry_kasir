import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Query } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import {
  clearOfflineCache,
  createIndexedDbPersister,
  isCacheOwnedByAnotherUser,
  offlineCacheDehydrateOptions,
  setOfflineCacheOwner,
} from '@/utils/offlineQueryCache';

const makeClient = (customers: unknown[]): PersistedClient => ({
  timestamp: Date.now(),
  buster: 'test',
  clientState: {
    mutations: [],
    queries: [
      {
        queryKey: ['customers'],
        queryHash: '["customers"]',
        state: { data: customers } as never,
      },
    ],
  },
});

const fakeQuery = (key: unknown[], status: 'success' | 'error' | 'pending') =>
  ({ queryKey: key, state: { status } }) as unknown as Query;

describe('utils/offlineQueryCache', () => {
  beforeEach(async () => {
    await clearOfflineCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves and restores query data with Date objects intact', async () => {
    vi.useFakeTimers();
    const persister = createIndexedDbPersister(1000);
    const createdAt = new Date('2026-03-04T05:06:07.000Z');

    persister.persistClient(makeClient([{ id: 'c1', createdAt }]));
    await vi.advanceTimersByTimeAsync(1000);
    vi.useRealTimers();

    const restored = await persister.restoreClient();
    const data = restored?.clientState.queries[0].state.data as Array<{ createdAt: Date }>;
    expect(data[0].createdAt).toBeInstanceOf(Date);
    expect(data[0].createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it('throttles writes and keeps only the latest snapshot', async () => {
    vi.useFakeTimers();
    const persister = createIndexedDbPersister(1000);

    persister.persistClient(makeClient([{ id: 'first' }]));
    persister.persistClient(makeClient([{ id: 'second' }]));
    persister.persistClient(makeClient([{ id: 'latest' }]));
    await vi.advanceTimersByTimeAsync(1000);
    vi.useRealTimers();

    const restored = await persister.restoreClient();
    expect(restored?.clientState.queries[0].state.data).toEqual([{ id: 'latest' }]);
  });

  it('removes saved data and cancels a pending save on clear (logout)', async () => {
    vi.useFakeTimers();
    const persister = createIndexedDbPersister(1000);
    persister.persistClient(makeClient([{ id: 'saved' }]));
    await vi.advanceTimersByTimeAsync(1000);

    persister.persistClient(makeClient([{ id: 'pending' }]));
    vi.useRealTimers();
    await clearOfflineCache(persister);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(await persister.restoreClient()).toBeUndefined();
  });

  it('only keeps successful reads and never saves mutations', () => {
    const { shouldDehydrateQuery, shouldDehydrateMutation } = offlineCacheDehydrateOptions;

    expect(shouldDehydrateQuery(fakeQuery(['customers'], 'success'))).toBe(true);
    expect(shouldDehydrateQuery(fakeQuery(['customers'], 'error'))).toBe(false);
    expect(shouldDehydrateQuery(fakeQuery(['customers'], 'pending'))).toBe(false);
    expect(shouldDehydrateQuery(fakeQuery(['audit_logs'], 'success'))).toBe(false);
    expect(shouldDehydrateMutation()).toBe(false);
  });

  it('tracks which account owns the saved cache', async () => {
    expect(isCacheOwnedByAnotherUser('user-1')).toBe(false);

    setOfflineCacheOwner('user-1');
    expect(isCacheOwnedByAnotherUser('user-1')).toBe(false);
    expect(isCacheOwnedByAnotherUser('user-2')).toBe(true);

    await clearOfflineCache();
    expect(isCacheOwnedByAnotherUser('user-2')).toBe(false);
  });
});
