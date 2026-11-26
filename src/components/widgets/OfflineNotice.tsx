import React from 'react';
import { AlertTriangleIcon, XIcon } from '../icons';

/**
 * Explains what still works when the connection drops: data already loaded stays
 * viewable (offline cache), but saving needs internet. Shown on every transition to
 * offline (and on load if already offline); hides itself when the connection returns.
 */
const OfflineNotice: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );

  React.useEffect(() => {
    const handleOffline = () => setIsVisible(true);
    const handleOnline = () => setIsVisible(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="print-hide fixed top-[max(0.75rem,env(safe-area-inset-top))] left-4 right-4 z-[60] sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2"
    >
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-lg dark:border-amber-700 dark:bg-amber-950">
        <AlertTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">Mode Offline</h3>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            Data yang sudah pernah dibuka tetap bisa dilihat. Menyimpan transaksi dan mengubah data
            butuh internet.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="btn btn-ghost btn-icon btn-sm -mr-2 -mt-2"
          aria-label="Tutup"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default OfflineNotice;
