import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
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
  },
});

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
