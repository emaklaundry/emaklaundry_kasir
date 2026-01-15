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
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-[60] max-w-md">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
        <RefreshCwIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Update Tersedia</h3>
          <p className="text-sm text-blue-100 mb-3">
            Versi baru aplikasi telah tersedia. Klik "Perbarui" untuk mendapatkan fitur dan
            perbaikan terbaru.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-medium rounded px-4 py-2 text-sm transition-colors"
            >
              Perbarui Sekarang
            </button>
            <button
              onClick={handleDismiss}
              className="bg-blue-700 hover:bg-blue-800 text-white rounded px-4 py-2 text-sm transition-colors"
            >
              Nanti
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-200 hover:text-white transition-colors"
          aria-label="Tutup"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
