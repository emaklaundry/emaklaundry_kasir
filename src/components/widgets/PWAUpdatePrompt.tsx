import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCwIcon, XIcon } from '../icons';

/**
 * PWA Update Prompt Component
 * Menampilkan notifikasi saat ada update aplikasi baru
 * User dapat memilih untuk reload atau mengabaikan
 */
const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      // console.log('[PWA] Service Worker registered');
    },
    onRegisterError(error: Error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
    onNeedRefresh() {
      // console.log('[PWA] New version available, prompting user to update');
    },
  });

  // Use needRefresh directly as state instead of separate showPrompt
  const showPrompt = needRefresh;

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 right-4 left-4 z-[60] sm:bottom-4 sm:left-auto sm:max-w-sm"
    >
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <RefreshCwIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-blue-600 dark:text-brand-blue-400" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white">Update Tersedia</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Versi baru aplikasi telah tersedia. Perbarui untuk mendapatkan fitur dan perbaikan
            terbaru.
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={handleUpdate} className="btn btn-primary btn-sm">
              Perbarui Sekarang
            </button>
            <button onClick={handleDismiss} className="btn btn-secondary btn-sm">
              Nanti
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="btn btn-ghost btn-icon btn-sm -mr-2 -mt-2"
          aria-label="Tutup"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
