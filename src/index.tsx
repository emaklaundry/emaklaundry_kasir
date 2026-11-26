import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './utils/supabaseClient';
import {
  OFFLINE_CACHE_MAX_AGE_MS,
  clearOfflineCache,
  createIndexedDbPersister,
  isCacheOwnedByAnotherUser,
  offlineCacheDehydrateOptions,
  setOfflineCacheOwner,
} from './utils/offlineQueryCache';
// Side-effect import: start listening for beforeinstallprompt before any page renders.
import './hooks/useInstallPrompt';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

// Konfigurasi QueryClient dengan cache control yang lebih ketat
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // TIDAK auto refetch on window focus untuk mencegah gangguan saat input
      // Akan diaktifkan manual per-query untuk data yang perlu real-time (transactions)
      refetchOnWindowFocus: false,
      // Refetch on reconnect tetap aktif
      refetchOnReconnect: true,
      // Data dianggap stale setelah 5 menit (default untuk data master)
      staleTime: 5 * 60 * 1000, // 5 minutes - untuk customers, services, dll
      // Cache timeout 30 menit
      gcTime: 30 * 60 * 1000, // 30 minutes
      // Retry failed requests 1x
      retry: 1,
    },
    mutations: {
      // Simpan/ubah data saat offline harus langsung GAGAL dengan pesan error, bukan
      // ditahan diam-diam lalu terkirim otomatis saat online (risiko nota ganda jika
      // kasir mengira gagal lalu menginput ulang).
      networkMode: 'always',
    },
  },
});

// Data yang sudah pernah dimuat disimpan di perangkat (IndexedDB) agar tetap bisa
// dilihat saat offline atau setelah reload tanpa internet. Cache dibuang saat versi
// aplikasi berubah (buster) dan setelah 12 jam.
const offlinePersister = createIndexedDbPersister();

const wipeOfflineData = () => {
  queryClient.clear();
  void clearOfflineCache(offlinePersister);
};

// Cache milik satu user: hapus saat logout / tidak ada sesi, dan jika user lain login.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
    wipeOfflineData();
    return;
  }
  const userId = session?.user?.id;
  if (userId && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
    if (isCacheOwnedByAnotherUser(userId)) wipeOfflineData();
    setOfflineCacheOwner(userId);
  }
});

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: offlinePersister,
          maxAge: OFFLINE_CACHE_MAX_AGE_MS,
          buster: import.meta.env.VITE_APP_VERSION,
          dehydrateOptions: offlineCacheDehydrateOptions,
        }}
      >
        <App />
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
