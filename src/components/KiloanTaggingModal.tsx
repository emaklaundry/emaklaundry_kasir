import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { TransactionItem } from '../../types';

interface KiloanTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TransactionItem;
  onSave: (tags: string) => void;
}

const KiloanTaggingModal: React.FC<KiloanTaggingModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (item) {
      setTags(item.taggedItems || '');
    }
  }, [item]);

  const handleSave = () => {
    onSave(tags);
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tag Item untuk ${item.serviceName}`}
      footer={
        <>
          <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
          <button onClick={handleSave} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan Tag</button>
        </>
      }
    >
      <div>
        <label htmlFor="kiloan-tags" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">
          Rincian Item (Opsional)
        </label>
        <textarea
          id="kiloan-tags"
          rows={5}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          placeholder="Contoh:&#10;3 Kemeja Lengan Panjang&#10;2 Celana Jeans&#10;1 Jaket"
        />
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Catat jumlah dan jenis pakaian untuk memudahkan pelacakan. Ini tidak akan mempengaruhi harga.
        </p>
      </div>
    </Modal>
  );
};

export default KiloanTaggingModal;