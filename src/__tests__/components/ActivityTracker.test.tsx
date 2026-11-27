import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppContext from '@/contexts/AppContextContext';
import { UserRole } from '@/types';

const trackAudit = vi.fn();
vi.mock('@/utils/auditTracker', () => ({
  trackAudit: (...args: unknown[]) => trackAudit(...args),
  flushAudit: vi.fn(() => Promise.resolve()),
  setAuditActor: vi.fn(),
}));

import ActivityTracker from '@/components/layout/ActivityTracker';

const renderTracker = (children: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={['/transactions']}>
      <AppContext.Provider
        value={
          {
            currentUser: { id: 'u1', name: 'Kasir A', role: UserRole.Cashier, storeId: 's1', isActive: true },
            stores: [],
            selectedStoreId: 's1',
            setSelectedStoreId: vi.fn(),
            signOut: vi.fn(),
            loading: false,
          } as never
        }
      >
        <ActivityTracker pageTitle="Transaksi" />
        {children}
      </AppContext.Provider>
    </MemoryRouter>,
  );

const actions = () => trackAudit.mock.calls.map((c) => (c[0] as { action: string }).action);

describe('ActivityTracker', () => {
  beforeEach(() => {
    trackAudit.mockReset();
    sessionStorage.clear();
  });

  it('mencatat awal sesi dan halaman yang dibuka', () => {
    renderTracker(null);
    expect(actions()).toContain('Membuka aplikasi (sesi dimulai)');
    expect(actions()).toContain('Membuka halaman "Transaksi"');
  });

  it('mencatat klik tombol beserta nama dialognya', () => {
    const { getByText } = renderTracker(
      <div role="dialog" aria-label="Pembayaran">
        <button>Bayar Lunas</button>
      </div>,
    );
    fireEvent.click(getByText('Bayar Lunas'));
    expect(actions()).toContain('Klik tombol "Bayar Lunas" (di "Pembayaran")');
  });

  it('tidak mencatat isi kolom teks maupun password', () => {
    const { getByLabelText } = renderTracker(
      <>
        <label htmlFor="nama">Nama pelanggan</label>
        <input id="nama" />
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" />
      </>,
    );
    fireEvent.change(getByLabelText('Nama pelanggan'), { target: { value: 'Budi 0812' } });
    fireEvent.change(getByLabelText('Password'), { target: { value: 'rahasia' } });
    const all = actions().join('\n');
    expect(all).toContain('Mengisi kolom "Nama pelanggan"');
    expect(all).toContain('Mengisi kolom "Password"');
    expect(all).not.toContain('Budi');
    expect(all).not.toContain('rahasia');
  });

  it('mencatat pilihan dropdown dan centang', () => {
    const { getByLabelText } = renderTracker(
      <>
        <label htmlFor="st">Status</label>
        <select id="st" defaultValue="a">
          <option value="a">Proses</option>
          <option value="b">Selesai</option>
        </select>
        <label htmlFor="cb">Pilih semua</label>
        <input id="cb" type="checkbox" />
      </>,
    );
    fireEvent.change(getByLabelText('Status'), { target: { value: 'b' } });
    fireEvent.click(getByLabelText('Pilih semua'));
    expect(actions()).toContain('Memilih "Selesai" pada "Status"');
    expect(actions()).toContain('Mencentang "Pilih semua"');
  });

  it('melewati elemen di dalam data-audit-ignore', () => {
    const { getByText } = renderTracker(
      <div data-audit-ignore>
        <button>Filter</button>
      </div>,
    );
    fireEvent.click(getByText('Filter'));
    expect(actions().some((a) => a.includes('Filter'))).toBe(false);
  });

  it('tautan luar hanya dicatat domainnya', () => {
    const { getByText } = renderTracker(<a href="https://wa.me/628123456789?text=halo">Kirim WA</a>);
    fireEvent.click(getByText('Kirim WA'));
    const call = trackAudit.mock.calls.find((c) => c[0].action.includes('Kirim WA'));
    expect(call?.[0].metadata).toEqual({ href: 'wa.me' });
  });
});
