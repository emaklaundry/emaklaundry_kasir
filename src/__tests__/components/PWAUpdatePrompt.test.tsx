import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pwa = vi.hoisted(() => ({
  needRefresh: false,
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn(),
  canInstall: false,
  install: vi.fn(),
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [pwa.needRefresh, pwa.setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: pwa.updateServiceWorker,
  }),
}));

vi.mock('@/hooks/useInstallPrompt', () => ({
  default: () => ({ canInstall: pwa.canInstall, install: pwa.install }),
}));

import PWAUpdatePrompt from '@/components/widgets/PWAUpdatePrompt';

const DISMISSED_KEY = 'pwa-install-dismissed-at';

describe('components/PWAUpdatePrompt', () => {
  beforeEach(() => {
    pwa.needRefresh = false;
    pwa.canInstall = false;
    pwa.install.mockResolvedValue('installed');
    localStorage.removeItem(DISMISSED_KEY);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.removeItem(DISMISSED_KEY);
  });

  it('renders nothing when there is no update and the app cannot be installed', () => {
    const { container } = render(<PWAUpdatePrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('activates the waiting version only when the user taps "Perbarui Sekarang"', () => {
    pwa.needRefresh = true;
    render(<PWAUpdatePrompt />);

    expect(screen.getByText('Update Tersedia')).toBeInTheDocument();
    expect(pwa.updateServiceWorker).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Perbarui Sekarang' }));
    expect(pwa.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('lets the user postpone an update', () => {
    pwa.needRefresh = true;
    render(<PWAUpdatePrompt />);

    fireEvent.click(screen.getByRole('button', { name: 'Nanti' }));
    expect(pwa.setNeedRefresh).toHaveBeenCalledWith(false);
    expect(pwa.updateServiceWorker).not.toHaveBeenCalled();
  });

  it('shows the update prompt instead of the install prompt when both apply', () => {
    pwa.needRefresh = true;
    pwa.canInstall = true;
    render(<PWAUpdatePrompt />);

    expect(screen.getByText('Update Tersedia')).toBeInTheDocument();
    expect(screen.queryByText('Install Aplikasi')).not.toBeInTheDocument();
  });

  it('offers installation and opens the browser install dialog', () => {
    pwa.canInstall = true;
    render(<PWAUpdatePrompt />);

    fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    expect(pwa.install).toHaveBeenCalledTimes(1);
  });

  it('snoozes the install prompt for 14 days after "Nanti"', () => {
    pwa.canInstall = true;
    const { unmount } = render(<PWAUpdatePrompt />);

    fireEvent.click(screen.getByRole('button', { name: 'Nanti' }));
    expect(screen.queryByText('Install Aplikasi')).not.toBeInTheDocument();
    expect(Number(localStorage.getItem(DISMISSED_KEY))).toBeGreaterThan(0);

    unmount();
    render(<PWAUpdatePrompt />);
    expect(screen.queryByText('Install Aplikasi')).not.toBeInTheDocument();
  });

  it('offers installation again once the 14-day snooze has passed', () => {
    pwa.canInstall = true;
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(fifteenDaysAgo));

    render(<PWAUpdatePrompt />);
    expect(screen.getByText('Install Aplikasi')).toBeInTheDocument();
  });
});
