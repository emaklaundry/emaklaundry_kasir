import { renderHook } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import useTheme from '@/hooks/useTheme';

describe('hooks/useTheme', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('should be a function', () => {
    expect(typeof useTheme).toBe('function');
  });

  it('uses the dark reference theme when no preference has been saved', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('respects a saved light preference', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('light');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('keeps the UI usable when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });
});
