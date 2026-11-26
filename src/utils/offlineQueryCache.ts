import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import type { Query } from '@tanstack/react-query';

/**
 * Offline cache for React Query data, stored in IndexedDB on this device.
 *
 * Values are written with structured clone (not JSON), so Date objects in query data
 * (e.g. customer.createdAt) come back as Dates. The cache belongs to one user and is
 * wiped on logout (see index.tsx), so the next person on a shared device never sees it.
 */

const DB_NAME = 'emaklaundry-offline';
const STORE_NAME = 'kv';
const CLIENT_KEY = 'react-query-cache';
const OWNER_STORAGE_KEY = 'offline-cache-owner';

/** How long a saved cache may be shown offline before it is discarded. */
export const OFFLINE_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

// Large or audit-only data is not worth keeping on the device.
const EXCLUDED_QUERY_ROOTS = new Set(['audit_logs']);

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
};

const runStore = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest,
): Promise<T | undefined> => {
  try {
    const db = await openDb();
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    // Private mode, quota exceeded or unclonable data: offline cache is best-effort only.
    console.warn('[OfflineCache] IndexedDB operation failed:', error);
    return undefined;
  }
};

/** Persister for PersistQueryClientProvider; saves are throttled to one per second. */
export const createIndexedDbPersister = (throttleMs = 1000): Persister => {
  let pending: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    persistClient: (client) => {
      pending = client;
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        const toSave = pending;
        pending = null;
        if (toSave) void runStore('readwrite', (store) => store.put(toSave, CLIENT_KEY));
      }, throttleMs);
    },
    restoreClient: () => runStore<PersistedClient>('readonly', (store) => store.get(CLIENT_KEY)),
    removeClient: async () => {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
      await runStore('readwrite', (store) => store.delete(CLIENT_KEY));
    },
  };
};

export const offlineCacheDehydrateOptions = {
  // Only finished, successful reads. Mutations are never saved: replaying a half-sent
  // transaction after a reload could create duplicates.
  shouldDehydrateQuery: (query: Query) =>
    query.state.status === 'success' && !EXCLUDED_QUERY_ROOTS.has(String(query.queryKey[0])),
  shouldDehydrateMutation: () => false,
};

const readOwner = (): string | null => {
  try {
    return localStorage.getItem(OWNER_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeOwner = (userId: string | null) => {
  try {
    if (userId) localStorage.setItem(OWNER_STORAGE_KEY, userId);
    else localStorage.removeItem(OWNER_STORAGE_KEY);
  } catch {
    // Storage unavailable: the cache is still wiped on every logout.
  }
};

/** Returns true when the saved cache belongs to someone other than `userId`. */
export const isCacheOwnedByAnotherUser = (userId: string): boolean => {
  const owner = readOwner();
  return owner !== null && owner !== userId;
};

export const setOfflineCacheOwner = (userId: string) => writeOwner(userId);

/** Deletes the saved cache from this device. */
export const clearOfflineCache = async (persister?: Persister) => {
  writeOwner(null);
  if (persister) {
    await persister.removeClient();
  } else {
    await runStore('readwrite', (store) => store.delete(CLIENT_KEY));
  }
};
