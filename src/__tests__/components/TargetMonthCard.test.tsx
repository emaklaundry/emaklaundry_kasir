import { render, screen } from '@testing-library/react';
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

import TargetMonthCard from '@/components/dashboard/TargetMonthCard';

const makeData = (targets: unknown[]) => ({
  month: '2026-11-01',
  asOf: '2026-11-15',
  targets,
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
    capex: 0,
  },
  daily: [],
  sinceStart: null,
});

const renderCard = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <TargetMonthCard storeId="s1" />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe('TargetMonthCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ctx = { currentUser: { role: 'Super Admin', storeId: 's1' } };
  });

  it('tanpa target: tidak merender apa pun', async () => {
    mocks.fetchTargetVsActual.mockResolvedValue(makeData([]));
    const { container } = renderCard();
    await vi.waitFor(() => expect(mocks.fetchTargetVsActual).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('dengan target: menampilkan tautan Lihat perbandingan', async () => {
    mocks.fetchTargetVsActual.mockResolvedValue(
      makeData([{ storeId: 's1', isDefault: true, values: DEFAULT_PLAN_VALUES }]),
    );
    renderCard();
    const link = await screen.findByRole('link', { name: /Lihat perbandingan/ });
    expect(link).toHaveAttribute('href', '/business?tab=kalkulator&view=perbandingan');
    expect(screen.getByText('Target bulan ini')).toBeInTheDocument();
  });

  it('baris laba operasional: target bulan ini (bukan s.d. hari ini) dan (sementara)', async () => {
    mocks.fetchTargetVsActual.mockResolvedValue(
      makeData([{ storeId: 's1', isDefault: true, values: DEFAULT_PLAN_VALUES }]),
    );
    renderCard();
    const label = await screen.findByText('Laba operasional (sementara)');
    const block = label.parentElement as HTMLElement;
    expect(block.textContent).toMatch(/Target bulan ini\sRp/);
    expect(block.textContent).not.toMatch(/s\.d\. hari ini/);
  });

  it('error RPC: tidak merender apa pun', async () => {
    mocks.fetchTargetVsActual.mockRejectedValue(new Error('boom'));
    const { container } = renderCard();
    await vi.waitFor(() => expect(mocks.fetchTargetVsActual).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
  });
});
