import React from 'react';
import { TransactionItem } from '../types';
import Modal from './Modal';

interface ItemNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TransactionItem;
  notes: { note: string }[];
  setNotes: (notes: { note: string }[]) => void;
  onSave: (notes: { note: string }[]) => void;
}

const ItemNotesModal: React.FC<ItemNotesModalProps> = ({
  isOpen,
  onClose,
  item,
  notes,
  setNotes,
  onSave,
}) => {
  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...notes];
    newNotes[index] = { note: value };
    setNotes(newNotes);
  };

  const handleSave = () => {
    // Merge edited notes with any preserved notes beyond quantity
    const allNotes = item.itemDetails || [];
    const mergedNotes = [...notes, ...allNotes.slice(notes.length)];
    onSave(mergedNotes);
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Catatan untuk ${item.serviceName}`}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Batal
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Simpan Catatan
          </button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {notes.map((n, i) => (
          <div key={i}>
            <label
              htmlFor={`note-${i}`}
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              {`Item #${i + 1}`}
            </label>
            <input
              type="text"
              id={`note-${i}`}
              name={`note-${i}`}
              value={n.note}
              placeholder="Noda di kerah, sobek, dsb."
              onChange={(e) => handleNoteChange(i, e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              aria-label={`Item #${i + 1}`}
              autoComplete="off"
            />
          </div>
        ))}
      </form>
    </Modal>
  );
};

export default ItemNotesModal;
