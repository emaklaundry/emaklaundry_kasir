import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Outcome = 'accepted' | 'dismissed';

const fireBeforeInstallPrompt = (outcome: Outcome = 'accepted') => {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: Outcome }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
};

// The hook keeps the captured event at module level, so each test loads a fresh copy.
const loadHook = async () => (await import('@/hooks/useInstallPrompt')).default;

describe('hooks/useInstallPrompt', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cannot install until the browser offers an install prompt', async () => {
    const useInstallPrompt = await loadHook();
    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canInstall).toBe(false);
    await expect(result.current.install()).resolves.toBe('failed');
  });

  it('captures beforeinstallprompt and suppresses the automatic browser prompt', async () => {
    const useInstallPrompt = await loadHook();
    const { result } = renderHook(() => useInstallPrompt());

    const event = fireBeforeInstallPrompt();

    expect(event.defaultPrevented).toBe(true);
    expect(result.current.canInstall).toBe(true);
  });

  it('keeps an event that fired before any component mounted', async () => {
    const useInstallPrompt = await loadHook();
    fireBeforeInstallPrompt();

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canInstall).toBe(true);
  });

  it('shows the browser prompt once and reports the accepted outcome', async () => {
    const useInstallPrompt = await loadHook();
    const { result } = renderHook(() => useInstallPrompt());
    const event = fireBeforeInstallPrompt('accepted');

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.install();
    });

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(outcome).toBe('installed');
    // The event is single-use: the button must hide until the browser fires a new one.
    expect(result.current.canInstall).toBe(false);
  });

  it('reports a dismissed prompt', async () => {
    const useInstallPrompt = await loadHook();
    const { result } = renderHook(() => useInstallPrompt());
    fireBeforeInstallPrompt('dismissed');

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.install();
    });

    expect(outcome).toBe('dismissed');
  });

  it('hides the install option once the app has been installed', async () => {
    const useInstallPrompt = await loadHook();
    const { result } = renderHook(() => useInstallPrompt());
    fireBeforeInstallPrompt();

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.canInstall).toBe(false);
  });

  it('never offers installation when already running as an installed app', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const useInstallPrompt = await loadHook();
    const { result } = renderHook(() => useInstallPrompt());

    fireBeforeInstallPrompt();

    expect(result.current.canInstall).toBe(false);
  });
});
