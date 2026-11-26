import * as React from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type NavigatorWithInstall = Navigator & { install?: () => Promise<void> };

export type InstallResult = 'installed' | 'dismissed' | 'failed';

// beforeinstallprompt can fire before any component mounts (e.g. on the login page),
// so it is captured at module level and shared with every hook instance.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const supportsWebInstall = () =>
  typeof navigator !== 'undefined' &&
  typeof (navigator as NavigatorWithInstall).install === 'function';

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

const canInstallNow = () => !isStandalone() && (supportsWebInstall() || deferredPrompt !== null);

/**
 * Exposes whether the app can be installed right now and a function that opens the
 * browser's install dialog. `install` must be called directly from a click handler.
 */
const useInstallPrompt = () => {
  const [canInstall, setCanInstall] = React.useState(canInstallNow);

  React.useEffect(() => {
    const update = () => setCanInstall(canInstallNow());
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = React.useCallback(async (): Promise<InstallResult> => {
    try {
      if (supportsWebInstall()) {
        // Called synchronously from the click handler to keep user activation.
        await (navigator as NavigatorWithInstall).install!();
        return 'installed';
      }
      if (!deferredPrompt) return 'failed';
      // The event is single-use: clear it before awaiting the user's choice.
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      notify();
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      return outcome === 'accepted' ? 'installed' : 'dismissed';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed';
      console.error('[PWA] Install failed:', error);
      return 'failed';
    }
  }, []);

  return { canInstall, install };
};

export default useInstallPrompt;
