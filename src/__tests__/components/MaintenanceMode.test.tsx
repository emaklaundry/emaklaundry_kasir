import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaintenanceMode from '@/components/MaintenanceMode';

describe('MaintenanceMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default message', () => {
    render(<MaintenanceMode />);
    
    expect(screen.getByText('Mode Pemeliharaan')).toBeInTheDocument();
    expect(screen.getByText('Sistem sedang dalam perbaikan. Mohon tunggu beberapa saat.')).toBeInTheDocument();
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

  it('should have proper styling and animations', () => {
    const { container } = render(<MaintenanceMode />);
    
    // Check for wrench icon with pulse animation
    const wrenchIcon = container.querySelector('.animate-pulse');
    expect(wrenchIcon).toBeInTheDocument();
    
    // Check for loading dots with bounce animation
    const bouncingDots = container.querySelectorAll('.animate-bounce');
    expect(bouncingDots.length).toBeGreaterThan(0);
  });
});
