import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OfflineNotice from '@/components/widgets/OfflineNotice';

const setOnline = (online: boolean) =>
  vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(online);

const goOffline = () => {
  setOnline(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
};

const goOnline = () => {
  setOnline(true);
  act(() => {
    window.dispatchEvent(new Event('online'));
  });
};

describe('components/OfflineNotice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stays hidden while online', () => {
    setOnline(true);
    render(<OfflineNotice />);
    expect(screen.queryByText('Mode Offline')).not.toBeInTheDocument();
  });

  it('shows immediately when the app opens without a connection', () => {
    setOnline(false);
    render(<OfflineNotice />);
    expect(screen.getByText('Mode Offline')).toBeInTheDocument();
    expect(screen.getByText(/Menyimpan transaksi dan mengubah data butuh internet/)).toBeVisible();
  });

  it('appears when the connection drops and hides when it returns', () => {
    setOnline(true);
    render(<OfflineNotice />);

    goOffline();
    expect(screen.getByText('Mode Offline')).toBeInTheDocument();

    goOnline();
    expect(screen.queryByText('Mode Offline')).not.toBeInTheDocument();
  });

  it('can be dismissed and comes back on the next disconnect', () => {
    setOnline(true);
    render(<OfflineNotice />);

    goOffline();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(screen.queryByText('Mode Offline')).not.toBeInTheDocument();

    goOnline();
    goOffline();
    expect(screen.getByText('Mode Offline')).toBeInTheDocument();
  });
});
