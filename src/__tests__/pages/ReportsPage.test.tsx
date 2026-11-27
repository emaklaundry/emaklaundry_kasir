import { render, screen, within } from '@testing-library/react';
import ReportsPage from '@/pages/ReportsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import AppContext from '@/contexts/AppContextContext';
import { UserRole } from '@/types';
import { vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastContext';
import { computeReportRange } from '@/utils/reportDates';
import { normalizeReport, ReportData } from '@/utils/financialReport';

const mockUser = {
  id: 'test-user',
  name: 'Test User',
  role: UserRole.SuperAdmin,
  storeId: 'test-store',
  createdAt: new Date(),
  isActive: true,
  canGiveDiscount: false,
};

const mockStores = [
  { id: 'store-a', name: 'Cabang A', address: 'Jl. A', isActive: true },
  { id: 'store-b', name: 'Cabang B', address: 'Jl. B', isActive: true },
];

function renderWithReport(data: Record<string, unknown>, source: ReportData['source'] = 'server') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { enabled: false } },
  });
  const r = computeReportRange('monthly', new Date());
  queryClient.setQueryData(
    ['financial-report', 'all', r.startYmd, r.endYmd, r.prevStartYmd, r.prevEndYmd],
    normalizeReport(data, source),
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ToastProvider>
          <AppContext.Provider
            value={{
              currentUser: mockUser,
              signOut: vi.fn(),
              stores: mockStores,
              selectedStoreId: 'all',
              setSelectedStoreId: vi.fn(),
              loading: false,
            }}
          >
            <ReportsPage />
          </AppContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const card = async (title: string) =>
  (await screen.findByText(title, { selector: 'p' })).parentElement as HTMLElement;

describe('ReportsPage', () => {
  it('shows summary cards with the comparison to the previous period', async () => {
    renderWithReport({
      summary: {
        gross: 80000,
        collected: 60000,
        receivable: 20000,
        unpaidCount: 1,
        count: 2,
        expenses: 10000,
        expenseCount: 1,
      },
      previous: { collected: 40000, expenses: 10000, receivable: 0, count: 2 },
    });

    const revenue = await card('Pendapatan Diterima');
    expect(within(revenue).getByText('Rp 60.000')).toBeInTheDocument();
    expect(within(revenue).getByText('Omzet Rp 80.000')).toBeInTheDocument();
    expect(within(revenue).getByText(/50,0/)).toBeInTheDocument(); // naik 50% dari 40.000
    const receivable = await card('Piutang');
    expect(within(receivable).getByText('1 nota belum lunas')).toBeInTheDocument();
    expect(within(await card('Laba Bersih')).getByText('Rp 50.000')).toBeInTheDocument();
  });

  it('renders cashiers with the same fallback name as separate rows without key warnings', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithReport({
      summary: { gross: 300, collected: 300, count: 2 },
      cashiers: [
        { userId: 'u1', name: 'Pengguna Tidak Dikenal', transactionCount: 1, totalRevenue: 100 },
        { userId: 'u2', name: 'Pengguna Tidak Dikenal', transactionCount: 1, totalRevenue: 200 },
      ],
    });
    expect(await screen.findAllByText('Pengguna Tidak Dikenal')).toHaveLength(2);
    expect(consoleError.mock.calls.filter((a) => String(a[0]).includes('same key'))).toHaveLength(
      0,
    );
    consoleError.mockRestore();
  });

  it('lists receivables with a link to the transaction and shows branch comparison', async () => {
    renderWithReport({
      summary: { gross: 30000, collected: 10000, receivable: 20000, unpaidCount: 1, count: 1 },
      receivables: [
        {
          id: 'tx-1',
          invoiceCode: 'INV-001',
          customerName: 'Budi',
          total: 30000,
          paid: 10000,
          outstanding: 20000,
          createdAt: new Date().toISOString(),
          ageDays: 12,
          orderStatus: 'Diproses',
        },
      ],
      stores: [
        {
          storeId: 'store-a',
          name: 'Cabang A',
          count: 1,
          gross: 30000,
          collected: 10000,
          expenses: 0,
          net: 10000,
        },
        {
          storeId: 'store-b',
          name: 'Cabang B',
          count: 0,
          gross: 0,
          collected: 0,
          expenses: 0,
          net: 0,
        },
      ],
    });

    const link = await screen.findByRole('link', { name: 'INV-001' });
    expect(link).toHaveAttribute('href', '/transactions/tx-1/details');
    expect(screen.getByText('12 hari')).toBeInTheDocument();
    expect(screen.getByText('Perbandingan Cabang')).toBeInTheDocument();
    expect(screen.getAllByText('Cabang B').length).toBeGreaterThan(0);
  });

  it('warns when the report runs in limited (client) mode', async () => {
    renderWithReport({ summary: { count: 1, gross: 1, collected: 1 } }, 'client');
    expect(await screen.findByText(/Mode terbatas/)).toBeInTheDocument();
  });

  it('shows an empty state when the period has no data', async () => {
    renderWithReport({ summary: {} });
    expect(
      await screen.findByText('Belum ada transaksi atau pengeluaran pada periode ini.'),
    ).toBeInTheDocument();
  });
});
