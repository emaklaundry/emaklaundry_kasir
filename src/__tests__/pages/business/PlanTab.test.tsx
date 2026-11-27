import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { DEFAULT_PLAN_VALUES } from '@/utils/businessPlan';

const mocks = vi.hoisted(() => ({
  ctx: {} as Record<string, unknown>,
  fetchStoreTargets: vi.fn(),
  saveStoreTarget: vi.fn(),
  addToast: vi.fn(),
  addAuditLog: vi.fn(),
}));

vi.mock('@/contexts/useAppContext', () => ({ default: () => mocks.ctx }));
vi.mock('@/contexts/useToasts', () => ({ default: () => ({ addToast: mocks.addToast }) }));
vi.mock('@/contexts/AuditLogContext', () => ({
  useAuditLogs: () => ({ addAuditLog: mocks.addAuditLog }),
}));
vi.mock('@/utils/businessTargets', () => ({
  fetchStoreTargets: mocks.fetchStoreTargets,
  saveStoreTarget: mocks.saveStoreTarget,
}));

import PlanTab from '@/pages/business/PlanTab';

const stores = [
  { id: 's1', name: 'Cabang A', address: '', isActive: true },
  { id: 's2', name: 'Cabang B', address: '', isActive: true },
];

const setRole = (role: string) => {
  mocks.ctx = { currentUser: { role, storeId: 's1' }, selectedStoreId: 's1', stores };
};

const renderTab = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <PlanTab />
    </QueryClientProvider>,
  );
};

describe('PlanTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchStoreTargets.mockResolvedValue([
      { period: null, values: DEFAULT_PLAN_VALUES, updatedAt: '2026-11-01' },
    ]);
    mocks.saveStoreTarget.mockResolvedValue(undefined);
  });

  it('Admin tidak melihat panel target', () => {
    setRole('Admin');
    renderTab();
    expect(screen.queryByRole('button', { name: 'Simpan sebagai target' })).toBeNull();
    expect(screen.getByLabelText('Target Kg / Hari')).toBeInTheDocument();
  });

  it('Super Admin menyimpan target periode Default', async () => {
    setRole('Super Admin');
    mocks.fetchStoreTargets.mockResolvedValue([]);
    renderTab();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Simpan sebagai target' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai target' }));
    await waitFor(() =>
      expect(mocks.saveStoreTarget).toHaveBeenCalledWith('s1', null, DEFAULT_PLAN_VALUES),
    );
    await waitFor(() => expect(mocks.addToast).toHaveBeenCalled());
    expect(mocks.addAuditLog).toHaveBeenCalled();
  });

  it('menandai perubahan yang belum disimpan setelah target dimuat', async () => {
    setRole('Super Admin');
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Muat target tersimpan' }));
    await waitFor(() => expect(mocks.fetchStoreTargets).toHaveBeenCalled());
    expect(screen.queryByText('Ada perubahan yang belum disimpan')).toBeNull();
    fireEvent.change(screen.getByLabelText('Target Kg / Hari'), { target: { value: '99' } });
    expect(await screen.findByText('Ada perubahan yang belum disimpan')).toBeInTheDocument();
  });

  it('menimpa target tersimpan tanpa memuat: minta konfirmasi, batal tidak menyimpan', async () => {
    setRole('Super Admin');
    renderTab();
    expect(await screen.findByText('Target tersimpan ada untuk periode ini')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Target Kg / Hari'), { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai target' }));
    expect(
      await screen.findByText('Timpa target tersimpan untuk Cabang A · Default (setiap bulan)?'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    await waitFor(() => expect(screen.queryByText(/Timpa target tersimpan/)).toBeNull());
    expect(mocks.saveStoreTarget).not.toHaveBeenCalled();
  });

  it('konfirmasi timpa menyimpan target', async () => {
    setRole('Super Admin');
    renderTab();
    await screen.findByText('Target tersimpan ada untuk periode ini');
    fireEvent.change(screen.getByLabelText('Target Kg / Hari'), { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai target' }));
    await screen.findByText(/Timpa target tersimpan untuk/);
    fireEvent.click(screen.getByRole('button', { name: 'Timpa' }));
    await waitFor(() => expect(mocks.saveStoreTarget).toHaveBeenCalled());
    expect(mocks.saveStoreTarget.mock.calls[0][2].kiloan.kgPerDay).toBe(99);
  });

  it('target yang sudah dimuat disimpan tanpa konfirmasi', async () => {
    setRole('Super Admin');
    renderTab();
    await screen.findByText('Target tersimpan ada untuk periode ini');
    fireEvent.click(screen.getByRole('button', { name: 'Muat target tersimpan' }));
    await waitFor(() =>
      expect(mocks.addToast).toHaveBeenCalledWith('Target tersimpan dimuat.', 'success'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai target' }));
    await waitFor(() => expect(mocks.saveStoreTarget).toHaveBeenCalled());
    expect(screen.queryByText(/Timpa target tersimpan/)).toBeNull();
  });

  it('menandai perubahan terhadap target tersimpan tanpa harus memuat dulu', async () => {
    setRole('Super Admin');
    renderTab();
    await screen.findByText('Target tersimpan ada untuk periode ini');
    expect(screen.queryByText('Ada perubahan yang belum disimpan')).toBeNull();
    fireEvent.change(screen.getByLabelText('Target Kg / Hari'), { target: { value: '99' } });
    expect(await screen.findByText('Ada perubahan yang belum disimpan')).toBeInTheDocument();
  });

  it('tombol simpan nonaktif selama target tersimpan belum selesai dimuat', async () => {
    setRole('Super Admin');
    let resolve: (v: unknown) => void = () => {};
    mocks.fetchStoreTargets.mockReturnValue(new Promise((r) => (resolve = r)));
    renderTab();
    expect(screen.getByRole('button', { name: 'Simpan sebagai target' })).toBeDisabled();
    resolve([]);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Simpan sebagai target' })).toBeEnabled(),
    );
  });

  it('gagal memeriksa target tersimpan: minta konfirmasi sebelum menyimpan', async () => {
    setRole('Super Admin');
    mocks.fetchStoreTargets.mockRejectedValue(new Error('network'));
    renderTab();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Simpan sebagai target' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai target' }));
    expect(
      await screen.findByText('Tidak bisa memeriksa target tersimpan. Tetap simpan?'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    await waitFor(() => expect(screen.queryByText(/Tidak bisa memeriksa/)).toBeNull());
    expect(mocks.saveStoreTarget).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai target' }));
    await screen.findByText(/Tidak bisa memeriksa/);
    fireEvent.click(screen.getByRole('button', { name: 'Tetap simpan' }));
    await waitFor(() => expect(mocks.saveStoreTarget).toHaveBeenCalledTimes(1));
  });

  it('nilai sama dengan target tersimpan: simpan tanpa konfirmasi timpa', async () => {
    setRole('Super Admin');
    renderTab();
    await screen.findByText('Target tersimpan ada untuk periode ini');
    // form masih berisi nilai bawaan yang sama dengan baris tersimpan -> tidak kotor
    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai target' }));
    await waitFor(() => expect(mocks.saveStoreTarget).toHaveBeenCalled());
    expect(screen.queryByText(/Timpa target tersimpan/)).toBeNull();
  });

  it('menyimpan bulan tertentu mengirim YYYY-MM-01 dan meng-invalidate cache', async () => {
    setRole('Super Admin');
    mocks.fetchStoreTargets.mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    render(
      <QueryClientProvider client={qc}>
        <PlanTab />
      </QueryClientProvider>,
    );
    const select = screen.getByLabelText('Periode') as HTMLSelectElement;
    const option = Array.from(select.options).find((o) => o.value !== 'default')!;
    fireEvent.change(select, { target: { value: option.value } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Simpan sebagai target' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai target' }));
    await waitFor(() =>
      expect(mocks.saveStoreTarget).toHaveBeenCalledWith('s1', option.value, DEFAULT_PLAN_VALUES),
    );
    expect(option.value).toMatch(/^\d{4}-\d{2}-01$/);
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['business-targets', 's1'] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ['target-vs-actual'] });
    });
  });

  it('label biaya: Marketing & Pemeliharaan', () => {
    setRole('Super Admin');
    renderTab();
    expect(screen.getByLabelText('Marketing & Pemeliharaan')).toBeInTheDocument();
  });

  it('semua input 0 tidak menampilkan NaN atau Infinity', () => {
    setRole('Super Admin');
    const { container } = renderTab();
    container.querySelectorAll('input[type="number"]').forEach((el) => {
      fireEvent.change(el, { target: { value: '0' } });
    });
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
  });

  it('memilih cabang saat stores baru tiba setelah render pertama', async () => {
    mocks.ctx = {
      currentUser: { role: 'Super Admin', storeId: 's1' },
      selectedStoreId: 'all',
      stores: [],
    };
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const ui = () => (
      <QueryClientProvider client={qc}>
        <PlanTab />
      </QueryClientProvider>
    );
    const { rerender } = render(ui());
    expect(screen.getByRole('button', { name: 'Simpan sebagai target' })).toBeDisabled();
    mocks.fetchStoreTargets.mockResolvedValue([]);
    mocks.ctx = { ...mocks.ctx, stores };
    rerender(ui());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Simpan sebagai target' })).toBeEnabled(),
    );
    const save = screen.getByRole('button', { name: 'Simpan sebagai target' });
    expect(screen.getByLabelText('Cabang')).toHaveValue('s1');
    fireEvent.click(save);
    await waitFor(() =>
      expect(mocks.saveStoreTarget).toHaveBeenCalledWith('s1', null, DEFAULT_PLAN_VALUES),
    );
  });

  it('mengunci pilihan cabang dan periode selama proses berjalan', async () => {
    setRole('Super Admin');
    let resolve: (v: unknown) => void = () => {};
    mocks.fetchStoreTargets.mockReturnValue(new Promise((r) => (resolve = r)));
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Muat target tersimpan' }));
    expect(screen.getByLabelText('Cabang')).toBeDisabled();
    expect(screen.getByLabelText('Periode')).toBeDisabled();
    resolve([{ period: null, values: DEFAULT_PLAN_VALUES, updatedAt: '' }]);
    await waitFor(() => expect(screen.getByLabelText('Cabang')).toBeEnabled());
  });
});
