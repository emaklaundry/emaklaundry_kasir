

import React from 'react';
import Modal from './Modal';
import { SpinnerIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: string;
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Hapus', 
    confirmColor = 'bg-red-600 hover:bg-red-700',
    isConfirming = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 focus:outline-none hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600 dark:hover:text-white">
            Batal
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isConfirming}
            className={`flex justify-center items-center text-white ${confirmColor} font-medium rounded-lg text-lg px-6 py-3 disabled:opacity-75 disabled:cursor-wait`}
          >
            {isConfirming ? <SpinnerIcon className="w-6 h-6" /> : confirmText}
          </button>
        </>
      }
    >
      <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-300">
        {message}
      </p>
    </Modal>
  );
};

export default ConfirmationModal;