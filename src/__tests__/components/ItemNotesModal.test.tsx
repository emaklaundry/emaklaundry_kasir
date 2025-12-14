import { render, screen, fireEvent } from '@testing-library/react';
import ItemNotesModal from '@/components/ItemNotesModal';
import React from 'react';
import { vi } from 'vitest';

describe('ItemNotesModal', () => {
  const baseItem = {
    id: '1',
    serviceId: 'svc-1',
    serviceName: 'Cuci Kering',
    quantity: 2,
    price: 10000,
    subtotal: 20000,
    unit: 'pcs',
    itemDetails: [{ note: 'Noda di lengan' }, { note: '' }],
  };

  it('renders notes inputs for each item quantity', () => {
    const notes = [{ note: 'Noda di lengan' }, { note: '' }];
    const setNotes = vi.fn();
    render(
      <ItemNotesModal
        isOpen={true}
        onClose={vi.fn()}
        item={baseItem}
        notes={notes}
        setNotes={setNotes}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText(/catatan untuk cuci kering/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Item #1')).toBeInTheDocument();
    expect(screen.getByLabelText('Item #2')).toBeInTheDocument();
    const noteInputs = screen.getAllByPlaceholderText(/noda di kerah/i);
    expect(noteInputs.length).toBe(2);
  });

  it('calls onClose when Batal is clicked', () => {
    const onClose = vi.fn();
    const notes = [{ note: 'Noda di lengan' }, { note: '' }];
    const setNotes = vi.fn();
    render(
      <ItemNotesModal
        isOpen={true}
        onClose={onClose}
        item={baseItem}
        notes={notes}
        setNotes={setNotes}
        onSave={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Batal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with updated notes when Simpan Catatan is clicked', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    // We'll use a React state to simulate controlled notes
    function Wrapper() {
      const [notes, setNotes] = React.useState([{ note: 'Noda di lengan' }, { note: '' }]);
      return (
        <ItemNotesModal
          isOpen={true}
          onClose={onClose}
          item={baseItem}
          notes={notes}
          setNotes={setNotes}
          onSave={onSave}
        />
      );
    }
    render(<Wrapper />);
    fireEvent.change(screen.getByLabelText('Item #2'), { target: { value: 'Ada sobek' } });
    fireEvent.click(screen.getByText(/simpan catatan/i));
    expect(onSave).toHaveBeenCalledWith([{ note: 'Noda di lengan' }, { note: 'Ada sobek' }]);
    expect(onClose).toHaveBeenCalled();
  });
});
