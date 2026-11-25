import { render, screen, fireEvent } from '@testing-library/react';
import CustomerSelector from '@/components/features/CustomerSelector';
import { vi } from 'vitest';

describe('CustomerSelector', () => {
  const customers = [
    {
      id: '1',
      name: 'Budi',
      phone: '0811111111',
      address: '',
      notes: '',
      defaultDiscount: 0,
      storeId: 'store-1',
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Siti',
      phone: '0822222222',
      address: '',
      notes: '',
      defaultDiscount: 0,
      storeId: 'store-1',
      createdAt: new Date(),
    },
  ];

  it('renders input, label, and add button', () => {
    render(
      <CustomerSelector
        customers={customers}
        selectedCustomer={null}
        onSelectCustomer={vi.fn()}
        onAddNewCustomer={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/pelanggan/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/cari nama/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows dropdown and filters customers by name', () => {
    render(
      <CustomerSelector
        customers={customers}
        selectedCustomer={null}
        onSelectCustomer={vi.fn()}
        onAddNewCustomer={vi.fn()}
      />,
    );
    const input = screen.getByPlaceholderText(/cari nama/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Budi' } });
    expect(screen.getByText('Budi')).toBeInTheDocument();
    expect(screen.queryByText('Siti')).not.toBeInTheDocument();
  });

  it('calls onSelectCustomer when a customer is clicked', () => {
    const onSelectCustomer = vi.fn();
    render(
      <CustomerSelector
        customers={customers}
        selectedCustomer={null}
        onSelectCustomer={onSelectCustomer}
        onAddNewCustomer={vi.fn()}
      />,
    );
    const input = screen.getByPlaceholderText(/cari nama/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Budi' } });
    fireEvent.click(screen.getByText('Budi'));
    expect(onSelectCustomer).toHaveBeenCalledWith(customers[0]);
  });

  it('calls onAddNewCustomer when add button is clicked', () => {
    const onAddNewCustomer = vi.fn();
    render(
      <CustomerSelector
        customers={customers}
        selectedCustomer={null}
        onSelectCustomer={vi.fn()}
        onAddNewCustomer={onAddNewCustomer}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onAddNewCustomer).toHaveBeenCalled();
  });

  it('shows selected customer info', () => {
    render(
      <CustomerSelector
        customers={customers}
        selectedCustomer={customers[1]}
        onSelectCustomer={vi.fn()}
        onAddNewCustomer={vi.fn()}
      />,
    );
    expect(screen.getByText(/terpilih/i)).toBeInTheDocument();
    expect(screen.getByText('Siti')).toBeInTheDocument();
    // Cari node yang mengandung nomor telepon meski terpisah elemen
    const phoneNodes = screen.getAllByText(
      (content, node) => !!node?.textContent && node.textContent.includes('0822222222'),
    );
    expect(phoneNodes.length).toBeGreaterThan(0);
  });
});
