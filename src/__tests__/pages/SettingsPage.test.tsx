import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SettingsPage from '@/pages/management/SettingsPage';
import { calculateCRC16 } from '@/utils/qrisUtils';

const tlv = (tag: string, value: string) =>
  `${tag}${String(value.length).padStart(2, '0')}${value}`;

/** QRIS contoh dengan CRC yang benar. "11" = statis, "12" = dinamis. */
const buildQris = (pointOfInitiation: '11' | '12') => {
  const body =
    tlv('00', '01') +
    tlv('01', pointOfInitiation) +
    tlv('26', tlv('00', 'ID.CO.EXAMPLE.WWW') + tlv('01', '936009180000000001')) +
    tlv('52', '5812') +
    tlv('53', '360') +
    tlv('58', 'ID') +
    tlv('59', 'EMAK LAUNDRY') +
    tlv('60', 'BANJAR') +
    '6304';
  return body + calculateCRC16(body);
};

// Objek stabil: halaman memakai `settings`/`stores` sebagai dependency effect.
const mocks = vi.hoisted(() => ({
  settings: { id: 1, receiptMessage: 'Terima kasih', whatsappFooter: 'Footer' },
  stores: [] as Array<Record<string, unknown>>,
  ctx: { currentUser: { role: 'Admin', storeId: 's1' }, selectedStoreId: 'all' },
}));
const updateSettings = vi.fn().mockResolvedValue(null);
const updateStore = vi.fn().mockResolvedValue({});
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: mocks.settings, updateSettings }),
}));
vi.mock('@/contexts/StoreContext', () => ({
  useStores: () => ({ stores: mocks.stores, updateStore }),
}));
vi.mock('@/contexts/AuditLogContext', () => ({ useAuditLogs: () => ({ addAuditLog: vi.fn() }) }));
const addToast = vi.fn().mockReturnValue('t1');
vi.mock('@/contexts/useToasts', () => ({
  default: () => ({ addToast, updateToast: vi.fn() }),
}));
vi.mock('@/contexts/useAppContext', () => ({ default: () => mocks.ctx }));
vi.mock('@/components/SupervisorPinSettings', () => ({ default: () => null }));
vi.mock('@/components/ChangePasswordModal', () => ({ default: () => null }));

const fillQris = (value: string) =>
  fireEvent.change(screen.getByLabelText('Kode QRIS Statis'), {
    target: { name: 'qrisStaticCode', value },
  });
const save = () => fireEvent.click(screen.getByRole('button', { name: /^Simpan/ }));

describe('SettingsPage — QRIS statis', () => {
  beforeEach(() => {
    updateSettings.mockClear();
    addToast.mockClear();
  });

  it('menyimpan kode QRIS statis yang valid (baris baru & spasi di ujung dibuang, spasi di nama dipertahankan)', async () => {
    render(<SettingsPage />);
    const qris = buildQris('11');
    fillQris(`${qris.slice(0, 20)}\n${qris.slice(20)} `);
    save();
    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ qrisStaticCode: qris }),
      ),
    );
  });

  it('menolak kode dengan checksum rusak', () => {
    render(<SettingsPage />);
    const qris = buildQris('11');
    fillQris(qris.slice(0, -1) + (qris.endsWith('0') ? '1' : '0'));
    save();
    expect(updateSettings).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith(expect.stringMatching(/tidak valid/), 'error');
  });

  it('menolak QRIS dinamis', () => {
    render(<SettingsPage />);
    fillQris(buildQris('12'));
    save();
    expect(updateSettings).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith(expect.stringMatching(/dinamis/), 'error');
  });

  it('isian kosong disimpan sebagai null', async () => {
    render(<SettingsPage />);
    fillQris('');
    save();
    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ qrisStaticCode: null }),
      ),
    );
  });
});

describe('SettingsPage — data cabang', () => {
  const store = { id: 's1', name: 'Banjar', address: 'Jl. Lama', phone: null, isActive: true };
  const original = { ...mocks.ctx };

  beforeEach(() => {
    updateSettings.mockClear();
    updateStore.mockClear();
    addToast.mockClear();
    mocks.stores = [store];
  });
  afterEach(() => {
    mocks.ctx = original;
    mocks.stores = [];
  });

  it('Super Admin menyimpan alamat & No. HP cabang, dan pratinjau struk ikut berubah', async () => {
    mocks.ctx = { currentUser: { role: 'Super Admin', storeId: 's1' }, selectedStoreId: 's1' };
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText('Alamat Cabang'), {
      target: { name: 'address', value: 'Jl. Baru 2' },
    });
    fireEvent.change(screen.getByLabelText('No. HP / WhatsApp Cabang'), {
      target: { name: 'phone', value: '081234567890' },
    });
    expect(screen.getByText('Telp/WA 081234567890')).toBeInTheDocument();
    save();
    await waitFor(() =>
      expect(updateStore).toHaveBeenCalledWith(
        's1',
        expect.objectContaining({ address: 'Jl. Baru 2', phone: '081234567890' }),
      ),
    );
  });

  it('menolak No. HP cabang yang berisi huruf', () => {
    mocks.ctx = { currentUser: { role: 'Super Admin', storeId: 's1' }, selectedStoreId: 's1' };
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText('No. HP / WhatsApp Cabang'), {
      target: { name: 'phone', value: '0812abc' },
    });
    save();
    expect(updateSettings).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith(expect.stringMatching(/No\. HP cabang/), 'error');
  });

  it('Admin hanya melihat data cabang (tidak bisa diubah, tidak ikut disimpan)', async () => {
    mocks.ctx = { currentUser: { role: 'Admin', storeId: 's1' }, selectedStoreId: 's1' };
    render(<SettingsPage />);
    expect(screen.getByLabelText('Alamat Cabang')).toHaveAttribute('readonly');
    expect(screen.getByText(/Hanya Super Admin yang dapat mengubah data cabang/)).toBeInTheDocument();
    save();
    await waitFor(() => expect(updateSettings).toHaveBeenCalled());
    expect(updateStore).not.toHaveBeenCalled();
  });
});
