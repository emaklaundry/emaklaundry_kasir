import { act, fireEvent, render, screen } from '@testing-library/react';
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

import PWAUpdatePrompt, { INSTALL_PROMPT_DELAY_MS } from '@/components/widgets/PWAUpdatePrompt';

const DISMISSED_KEY = 'pwa-install-dismissed-at';
const INSTALLED_KEY = 'pwa-installed';

const renderAfterDelay = () => {
  const view = render(<PWAUpdatePrompt />);
  act(() => {
    vi.advanceTimersByTime(INSTALL_PROMPT_DELAY_MS);
  });
  return view;
};

describe('components/PWAUpdatePrompt', () => {
  beforeEach(() => {
    pwa.needRefresh = false;
    pwa.canInstall = false;
    pwa.install.mockResolvedValue('installed');
    localStorage.removeItem(DISMISSED_KEY);
    localStorage.removeItem(INSTALLED_KEY);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.removeItem(DISMISSED_KEY);
    localStorage.removeItem(INSTALLED_KEY);
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

  it('waits before offering installation so it does not pop up on every page load', () => {
    pwa.canInstall = true;
    render(<PWAUpdatePrompt />);
    expect(screen.queryByText('Install Aplikasi')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(INSTALL_PROMPT_DELAY_MS);
    });
    expect(screen.getByText('Install Aplikasi')).toBeInTheDocument();
  });

  it('offers installation and opens the browser install dialog', () => {
    pwa.canInstall = true;
    renderAfterDelay();

    fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    expect(pwa.install).toHaveBeenCalledTimes(1);
  });

  it('snoozes the install prompt for 30 days after "Nanti"', () => {
    pwa.canInstall = true;
    const { unmount } = renderAfterDelay();

    fireEvent.click(screen.getByRole('button', { name: 'Nanti' }));
    expect(screen.queryByText('Install Aplikasi')).not.toBeInTheDocument();
    expect(Number(localStorage.getItem(DISMISSED_KEY))).toBeGreaterThan(0);

    unmount();
    renderAfterDelay();
    expect(screen.queryByText('Install Aplikasi')).not.toBeInTheDocument();
  });

  it('snoozes the install prompt when the browser install dialog is closed', async () => {
    pwa.canInstall = true;
    pwa.install.mockResolvedValue('dismissed');
    renderAfterDelay();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    });

    expect(screen.queryByText('Install Aplikasi')).not.toBeInTheDocument();
    expect(Number(localStorage.getItem(DISMISSED_KEY))).toBeGreaterThan(0);
  });

  it('never offers installation again once the app has been installed', async () => {
    pwa.canInstall = true;
    const { unmount } = renderAfterDelay();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    });
    expect(localStorage.getItem(INSTALLED_KEY)).toBe('1');

    unmount();
    localStorage.setItem(DISMISSED_KEY, String(Date.now() - 365 * 24 * 60 * 60 * 1000));
    renderAfterDelay();
    expect(screen.queryByText('Install Aplikasi')).not.toBeInTheDocument();
  });

  it('remembers an installation reported by the browser', () => {
    pwa.canInstall = true;
    renderAfterDelay();

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(screen.queryByText('Install Aplikasi')).not.toBeInTheDocument();
    expect(localStorage.getItem(INSTALLED_KEY)).toBe('1');
  });

  it('offers installation again once the 30-day snooze has passed', () => {
    pwa.canInstall = true;
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(thirtyOneDaysAgo));

    renderAfterDelay();
    expect(screen.getByText('Install Aplikasi')).toBeInTheDocument();
  });
});
