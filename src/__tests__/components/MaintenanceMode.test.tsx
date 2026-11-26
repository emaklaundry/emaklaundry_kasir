import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaintenanceMode from '@/components/MaintenanceMode';

describe('MaintenanceMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default message', () => {
    render(<MaintenanceMode />);

    expect(screen.getByText('Mode Pemeliharaan')).toBeInTheDocument();
    expect(
      screen.getByText('Sistem sedang dalam perbaikan. Mohon tunggu beberapa saat.'),
    ).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    const customMessage = 'Maintenance dijadwalkan hingga pukul 15:00 WIB';
    render(<MaintenanceMode message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('should have refresh button that reloads page', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(<MaintenanceMode />);

    const refreshButton = screen.getByRole('button', { name: /muat ulang halaman/i });
    await userEvent.click(refreshButton);

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('should display maintenance information sections', () => {
    render(<MaintenanceMode />);

    expect(screen.getByText('Apa yang sedang terjadi?')).toBeInTheDocument();
    expect(screen.getByText('Kapan sistem akan kembali normal?')).toBeInTheDocument();
    expect(screen.getByText('Data Anda Aman')).toBeInTheDocument();
  });

  it('announces the message and offers logout when onLogout is given', () => {
    const onLogout = vi.fn();
    render(<MaintenanceMode message="Sedang upgrade server" onLogout={onLogout} />);

    expect(screen.getByRole('status')).toHaveTextContent('Sedang upgrade server');
    expect(screen.queryByRole('button', { name: /muat ulang/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
