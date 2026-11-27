import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { DEFAULT_PLAN_VALUES } from '@/utils/businessPlan';

const mocks = vi.hoisted(() => ({
  ctx: {} as Record<string, unknown>,
  fetchTargetVsActual: vi.fn(),
}));

vi.mock('@/contexts/useAppContext', () => ({ default: () => mocks.ctx }));
vi.mock('@/hooks/useToday', () => ({ default: () => '2026-11-15' }));
vi.mock('@/utils/businessTargets', () => ({
  fetchTargetVsActual: mocks.fetchTargetVsActual,
}));

import ComparisonTab from '@/pages/business/ComparisonTab';

const stores = [
  { id: 's1', name: 'Cabang A', address: '', isActive: true },
  { id: 's2', name: 'Cabang B', address: '', isActive: true },
];

const setRole = (role: string, selectedStoreId = 's1') => {
  mocks.ctx = { currentUser: { role, storeId: 's1' }, selectedStoreId, stores };
};

const makeData = (over: Record<string, unknown> = {}) => ({
  month: '2026-11-01',
  asOf: '2026-11-15',
  targets: [{ storeId: 's1', isDefault: true, values: DEFAULT_PLAN_VALUES }],
  actual: {
    volume: { kiloanKg: 600, satuanPcs: 40, shoesPairs: 20, carpetM2: 5 },
    revenue: {
      kiloan: 5000000,
      satuan: 800000,
      shoes: 900000,
      carpet: 100000,
      other: 0,
      total: 6800000,
    },
    collected: 6000000,
    costs: {
      hpp: 1500000,
      salary: 3000000,
      rent: 1000000,
      utilities: 500000,
      marketing: 0,
      other: 0,
      total: 6000000,
    },
    capex: 250000,
  },
  daily: [
    { date: '2026-11-01', gross: 400000, collected: 300000 },
    { date: '2026-11-02', gross: 500000, collected: 450000 },
  ],
  sinceStart: { startDate: '2026-01-01', operatingProfit: 20000000, capex: 5000000 },
  ...over,
});

const renderTab = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ComparisonTab />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe('ComparisonTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchTargetVsActual.mockResolvedValue(makeData());
  });

  it('menampilkan baris, kolom target s.d. hari ini, dan status berjalan untuk Gaji', async () => {
    setRole('Super Admin');
    renderTab();
    expect(await screen.findByText('Laba operasional (sementara)')).toBeInTheDocument();
    expect(screen.getByText('Target s.d. hari ini')).toBeInTheDocument();
    expect(screen.getByText(/hari ke-15 dari 30/)).toBeInTheDocument();
    const salaryRow = screen.getByText('Gaji').closest('tr') as HTMLElement;
    expect(within(salaryRow).getByText('berjalan')).toBeInTheDocument();
    expect(screen.getByText('Sejak mulai operasi')).toBeInTheDocument();
    expect(mocks.fetchTargetVsActual).toHaveBeenCalledWith({
      storeId: 's1',
      monthYmd: '2026-11-01',
      asOfYmd: '2026-11-15',
    });
  });

  it('format tanggal mulai operasi id-ID dan angka tidak berupa negatif nol', async () => {
    setRole('Super Admin');
    mocks.fetchTargetVsActual.mockResolvedValue(
      makeData({
        actual: {
          ...makeData().actual,
          capex: 0,
          collected: 0,
          costs: { ...makeData().actual.costs, salary: 5999999.7 },
        },
        sinceStart: { startDate: '2026-01-01', operatingProfit: 0, capex: 0 },
      }),
    );
    const { container } = renderTab();
    await screen.findByText('Laba operasional (sementara)');
    expect(screen.getByText('Sejak 1 Januari 2026')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/[-−]Rp\s?0(?!\d)|[-−]0,0/);
  });

  it('menampilkan omzet per layanan', async () => {
    setRole('Super Admin');
    renderTab();
    expect(await screen.findByText('Omzet Kiloan')).toBeInTheDocument();
    expect(screen.getByText('Omzet Karpet')).toBeInTheDocument();
  });

  it('status ok dan warn punya nama aksesibel', async () => {
    setRole('Super Admin');
    renderTab();
    await screen.findByText('Laba operasional (sementara)');
    expect(screen.getAllByRole('img', { name: 'sesuai target' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('img', { name: 'perlu perhatian' }).length).toBeGreaterThan(0);
  });

  it('tanpa target: Admin melihat pesan pemilik', async () => {
    setRole('Admin');
    mocks.fetchTargetVsActual.mockResolvedValue(makeData({ targets: [] }));
    renderTab();
    expect(await screen.findByText('Target belum diatur oleh pemilik.')).toBeInTheDocument();
  });

  it('tanpa target: Super Admin melihat tautan Atur target', async () => {
    setRole('Super Admin');
    mocks.fetchTargetVsActual.mockResolvedValue(makeData({ targets: [] }));
    renderTab();
    const link = await screen.findByRole('link', { name: 'Atur target' });
    expect(link).toHaveAttribute('href', '/?tab=kalkulator&view=rencana');
  });

  it('semua cabang: catatan cabang tanpa target', async () => {
    setRole('Super Admin', 'all');
    renderTab();
    expect(await screen.findByText(/Cabang tanpa target: 1/)).toBeInTheDocument();
    expect(mocks.fetchTargetVsActual).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: null }),
    );
  });

  it('Admin dengan filter global Semua Cabang tetap memakai cabang sendiri', async () => {
    setRole('Admin', 'all');
    renderTab();
    await screen.findByText('Laba operasional (sementara)');
    expect(mocks.fetchTargetVsActual).toHaveBeenCalledWith({
      storeId: 's1',
      monthYmd: '2026-11-01',
      asOfYmd: '2026-11-15',
    });
    expect(screen.queryByText(/Cabang tanpa target/)).toBeNull();
  });

  it.each([
    ['bulan lalu', '2026-10', '2026-10-01'],
    ['bulan depan', '2026-12', '2026-12-01'],
  ])('kolom Target s.d. hari ini tidak ada untuk %s', async (_label, ym, monthYmd) => {
    setRole('Super Admin');
    mocks.fetchTargetVsActual.mockImplementation(async (a: { monthYmd: string }) =>
      a.monthYmd === monthYmd ? makeData({ month: monthYmd }) : makeData(),
    );
    renderTab();
    expect(await screen.findByText('Target s.d. hari ini')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Bulan'), { target: { value: ym } });
    await waitFor(() =>
      expect(mocks.fetchTargetVsActual).toHaveBeenCalledWith(expect.objectContaining({ monthYmd })),
    );
    await waitFor(() => expect(screen.queryByText('Target s.d. hari ini')).toBeNull());
  });

  it('kartu Sejak mulai operasi disembunyikan bila sinceStart null', async () => {
    setRole('Super Admin');
    mocks.fetchTargetVsActual.mockResolvedValue(makeData({ sinceStart: null }));
    renderTab();
    await screen.findByText('Laba operasional (sementara)');
    expect(screen.queryByText('Sejak mulai operasi')).toBeNull();
  });

  it('bulan depan: Bulan belum dimulai dan tanpa NaN', async () => {
    setRole('Super Admin');
    const { container } = renderTab();
    await screen.findByText('Laba operasional (sementara)');
    fireEvent.change(screen.getByLabelText('Bulan'), { target: { value: '2026-12' } });
    expect(await screen.findByText('Bulan belum dimulai')).toBeInTheDocument();
    await waitFor(() => expect(mocks.fetchTargetVsActual).toHaveBeenCalledTimes(2));
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
  });

  it('baris Belanja modal menampilkan catatan rekonsiliasi', async () => {
    setRole('Super Admin');
    renderTab();
    expect(await screen.findByText(/Laba bersih di Laporan/)).toBeInTheDocument();
  });

  it('MIGRATION_MISSING menampilkan pesan pembaruan database', async () => {
    setRole('Super Admin');
    mocks.fetchTargetVsActual.mockRejectedValue(new Error('MIGRATION_MISSING'));
    renderTab();
    expect(
      await screen.findByText('Fitur ini butuh pembaruan database. Hubungi pengelola sistem.'),
    ).toBeInTheDocument();
  });
});
