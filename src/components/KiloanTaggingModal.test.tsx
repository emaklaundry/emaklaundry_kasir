import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import KiloanTaggingModal from './KiloanTaggingModal';

describe('KiloanTaggingModal', () => {
  const baseItem = {
    serviceId: '1',
    serviceName: 'Cuci Kiloan',
    quantity: 1,
    price: 10000,
    subtotal: 10000,
    unit: 'kg',
    taggedItems: '2 Kemeja, 1 Celana',
  };

  it('renders textarea and buttons', () => {
    render(<KiloanTaggingModal isOpen={true} onClose={vi.fn()} item={baseItem} onSave={vi.fn()} />);
    expect(screen.getByText(/tag item untuk cuci kiloan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rincian item/i)).toBeInTheDocument();
    expect(screen.getByText('Batal')).toBeInTheDocument();
    expect(screen.getByText('Simpan Tag')).toBeInTheDocument();
  });

  it('shows initial tags from item', () => {
    render(<KiloanTaggingModal isOpen={true} onClose={vi.fn()} item={baseItem} onSave={vi.fn()} />);
    expect(screen.getByDisplayValue('2 Kemeja, 1 Celana')).toBeInTheDocument();
  });

  it('calls onClose when Batal is clicked', () => {
    const onClose = vi.fn();
    render(<KiloanTaggingModal isOpen={true} onClose={onClose} item={baseItem} onSave={vi.fn()} />);
    fireEvent.click(screen.getByText('Batal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with updated tags when Simpan Tag is clicked', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<KiloanTaggingModal isOpen={true} onClose={onClose} item={baseItem} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/rincian item/i), { target: { value: '3 Jaket' } });
    fireEvent.click(screen.getByText(/simpan tag/i));
    expect(onSave).toHaveBeenCalledWith('3 Jaket');
    expect(onClose).toHaveBeenCalled();
  });
});
