import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { DownloadIcon, RefreshCwIcon, XIcon } from '../icons';
import useInstallPrompt from '../../hooks/useInstallPrompt';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed-at';
const INSTALL_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

const isInstallSnoozed = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(INSTALL_DISMISSED_KEY));
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < INSTALL_SNOOZE_MS;
  } catch {
    return false;
  }
};

const PromptCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  isPrimaryBusy?: boolean;
  onDismiss: () => void;
}> = ({ icon, title, description, primaryLabel, onPrimary, isPrimaryBusy, onDismiss }) => (
  <div
    role="status"
    aria-live="polite"
    className="fixed bottom-20 right-4 left-4 z-[60] sm:bottom-4 sm:left-auto sm:max-w-sm"
  >
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      {icon}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onPrimary}
            aria-disabled={isPrimaryBusy}
            className="btn btn-primary btn-sm"
          >
            {primaryLabel}
          </button>
          <button type="button" onClick={onDismiss} className="btn btn-secondary btn-sm">
            Nanti
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="btn btn-ghost btn-icon btn-sm -mr-2 -mt-2"
        aria-label="Tutup"
      >
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  </div>
);

/**
 * PWA prompts:
 * - "Update Tersedia": a new service worker is waiting; it only activates when the user
 *   taps "Perbarui Sekarang", so unsaved form input is never lost to an auto-reload.
 * - "Install Aplikasi": shown when the browser allows installing the app (snoozed 14 days
 *   after "Nanti"). The update prompt always takes priority.
 */
const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return;
      // The cashier tab often stays open all day: look for a new version hourly
      // and whenever the app comes back to the foreground.
      const checkForUpdate = () => {
        if (navigator.onLine) registration.update().catch(() => undefined);
      };
      setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    },
    onRegisterError(error: Error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  const { canInstall, install } = useInstallPrompt();
  const [isInstallDismissed, setIsInstallDismissed] = React.useState(isInstallSnoozed);
  const [isInstalling, setIsInstalling] = React.useState(false);

  if (needRefresh) {
    return (
      <PromptCard
        icon={
          <RefreshCwIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-blue-600 dark:text-brand-blue-400" />
        }
        title="Update Tersedia"
        description="Versi baru aplikasi telah tersedia. Simpan pekerjaan yang sedang diisi, lalu perbarui untuk mendapatkan fitur dan perbaikan terbaru."
        primaryLabel="Perbarui Sekarang"
        onPrimary={() => updateServiceWorker(true)}
        onDismiss={() => setNeedRefresh(false)}
      />
    );
  }

  if (!canInstall || isInstallDismissed) return null;

  const dismissInstall = () => {
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
    } catch {
      // Storage unavailable (private mode): hide for this session only.
    }
    setIsInstallDismissed(true);
  };

  const handleInstall = async () => {
    if (isInstalling) return;
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <PromptCard
      icon={
        <DownloadIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-blue-600 dark:text-brand-blue-400" />
      }
      title="Install Aplikasi"
      description="Pasang Emak Laundry di perangkat ini agar bisa dibuka langsung dari layar utama, lebih cepat, dan tampil layar penuh."
      primaryLabel="Install"
      onPrimary={handleInstall}
      isPrimaryBusy={isInstalling}
      onDismiss={dismissInstall}
    />
  );
};

export default PWAUpdatePrompt;
