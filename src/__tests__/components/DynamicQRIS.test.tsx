import { render, screen } from '@testing-library/react';
import DynamicQRIS from '@/components/DynamicQRIS';

vi.mock('@/utils/qrisUtils', () => ({
  generateDynamicQRIS: () => 'dynamic-qris',
  getMerchantName: () => 'Emak Laundry',
  formatQRISAmount: () => 'Rp 12.000',
}));

describe('DynamicQRIS', () => {
  it('gives the payment QR code an accessible name', () => {
    render(<DynamicQRIS staticQRIS={'0'.repeat(50)} amount={12000} />);

    expect(
      screen.getByRole('img', { name: /QRIS.*Rp 12\.000.*Emak Laundry/i }),
    ).toBeInTheDocument();
  });
});
