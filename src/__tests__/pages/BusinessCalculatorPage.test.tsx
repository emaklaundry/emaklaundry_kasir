import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('@/contexts/useAppContext', () => ({
  default: () => ({
    currentUser: { role: 'Admin', storeId: 's1' },
    selectedStoreId: 's1',
    stores: [],
  }),
}));
vi.mock('@/contexts/useToasts', () => ({ default: () => ({ addToast: vi.fn() }) }));
vi.mock('@/contexts/AuditLogContext', () => ({ useAuditLogs: () => ({ addAuditLog: vi.fn() }) }));

import BusinessCalculatorPage from '@/pages/business/BusinessCalculatorPage';

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <BusinessCalculatorPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const summary = () => screen.getByRole('region', { name: 'Ringkasan Profit' });

describe('BusinessCalculatorPage', () => {
  beforeEach(() => {
    // November 2026 = 30 hari, supaya angka omzet stabil di bulan apa pun.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 15));
  });
  afterEach(() => vi.useRealTimers());

  it('links every label to its input', () => {
    renderPage();
    expect(screen.getByLabelText('Harga / Kg')).toHaveValue(9000);
    expect(screen.getByLabelText('Total Modal Investasi (Rp)')).toHaveValue(160000000);
  });

  it('recalculates revenue when an input changes', () => {
    renderPage();
    // Default: 80 kg × 30 hari × Rp9.000 = Rp21.600.000
    expect(screen.getByText(/21\.600\.000/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Target Kg / Hari'), { target: { value: '100' } });
    expect(screen.getByText(/27\.000\.000/)).toBeInTheDocument();
  });

  it('shows a warning instead of "Infinity" or "NaN" when the business loses money', () => {
    renderPage();
    for (const label of ['Target Kg / Hari', 'Target Pcs / Hari', 'Target Pasang / Hari']) {
      fireEvent.change(screen.getByLabelText(label), { target: { value: '0' } });
    }
    fireEvent.change(screen.getByLabelText('Target m² / Bulan'), { target: { value: '0' } });

    const panel = summary();
    expect(within(panel).getByText(/Belum balik modal/)).toBeInTheDocument();
    expect(within(panel).getByText(/Margin Rugi/)).toBeInTheDocument();
    expect(panel.textContent).not.toMatch(/Infinity|NaN/);
  });
});
