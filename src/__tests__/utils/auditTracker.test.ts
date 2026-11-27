import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const insert = vi.fn();
vi.mock('@/utils/supabaseClient', () => ({
  supabase: { from: vi.fn(() => ({ insert })) },
}));

import {
  __resetAuditTracker,
  flushAudit,
  setAuditActor,
  trackAudit,
} from '@/utils/auditTracker';

describe('auditTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetAuditTracker();
    insert.mockReset();
    insert.mockResolvedValue({ error: null });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tidak mencatat apa pun tanpa pengguna login', async () => {
    trackAudit({ action: 'Klik tombol "Simpan"', category: 'klik' });
    await flushAudit();
    expect(insert).not.toHaveBeenCalled();
  });

  it('mengirim log berkelompok setelah jeda', async () => {
    setAuditActor({ name: 'Kasir A', storeId: 'store-1' });
    trackAudit({ action: 'Membuka halaman "Transaksi"', category: 'navigasi' });
    trackAudit({ action: 'Klik tombol "Simpan"', category: 'klik' });
    expect(insert).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3000);

    expect(insert).toHaveBeenCalledTimes(1);
    const batch = insert.mock.calls[0][0];
    expect(batch).toHaveLength(2);
    expect(batch[0]).toMatchObject({
      user: 'Kasir A',
      storeId: 'store-1',
      category: 'navigasi',
      action: 'Membuka halaman "Transaksi"',
    });
    expect(typeof batch[0].page).toBe('string');
  });

  it('immediate langsung mengirim', async () => {
    setAuditActor({ name: 'Admin', storeId: null });
    trackAudit({ action: 'Menghapus pelanggan', storeId: 'store-2' }, { immediate: true });
    await vi.waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(insert.mock.calls[0][0][0]).toMatchObject({ category: 'aktivitas', storeId: 'store-2' });
  });

  it('menyimpan kembali log bila pengiriman gagal lalu mengirim ulang', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    setAuditActor({ name: 'Kasir A', storeId: 'store-1' });
    insert.mockResolvedValueOnce({ error: new Error('offline') });

    trackAudit({ action: 'Klik tombol "Bayar"', category: 'klik' }, { immediate: true });
    await vi.waitFor(() => expect(insert).toHaveBeenCalledTimes(1));

    await flushAudit();
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[1][0][0].action).toBe('Klik tombol "Bayar"');
  });
});
