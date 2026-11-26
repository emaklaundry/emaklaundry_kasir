import { render, screen, fireEvent, within } from '@testing-library/react';
import BusinessCalculatorPage from '@/pages/business/BusinessCalculatorPage';

const summary = () => screen.getByRole('region', { name: 'Ringkasan Profit' });

describe('BusinessCalculatorPage', () => {
  it('links every label to its input', () => {
    render(<BusinessCalculatorPage />);
    expect(screen.getByLabelText('Harga / Kg')).toHaveValue(9000);
    expect(screen.getByLabelText('Total Modal Investasi (Rp)')).toHaveValue(160000000);
  });

  it('recalculates revenue when an input changes', () => {
    render(<BusinessCalculatorPage />);
    // Default: 80 kg × 30 hari × Rp9.000 = Rp21.600.000
    expect(screen.getByText(/21\.600\.000/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Target Kg / Hari'), { target: { value: '100' } });
    expect(screen.getByText(/27\.000\.000/)).toBeInTheDocument();
  });

  it('shows a warning instead of "Infinity" or "NaN" when the business loses money', () => {
    render(<BusinessCalculatorPage />);
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
