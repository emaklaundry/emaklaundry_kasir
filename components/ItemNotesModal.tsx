import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { TransactionItem } from '../types';

interface ItemNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TransactionItem;
  onSave: (notes: { note: string }[]) => void;
}

const ItemNotesModal: React.FC<ItemNotesModalProps> = ({ isOpen, onClose, item, onSave }) => {

  // Always preserve all notes, but only show/edit up to item.quantity
  const [notes, setNotes] = useState<{ note: string }[]>([]);

  useEffect(() => {
    if (item) {
      // Use all notes from itemDetails, but only show up to quantity
      const allNotes = item.itemDetails || [];
      const initialNotes = Array.from({ length: item.quantity }, (_, i) => allNotes[i] || { note: '' });
      setNotes(initialNotes);
    }
  }, [item]);

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
          <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
          <button onClick={handleSave} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan Catatan</button>
        </>
      }
    >
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {notes.map((note, index) => (
          <div key={index}>
            <label htmlFor={`note-${index}`} className="block mb-1 text-base font-medium text-slate-900 dark:text-white">
              Item #{index + 1}
            </label>
            <input
              type="text"
              id={`note-${index}`}
              value={note.note}
              onChange={(e) => handleNoteChange(index, e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Contoh: Noda di kerah"
            />
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default ItemNotesModal;
