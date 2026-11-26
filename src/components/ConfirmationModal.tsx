import * as React from 'react';
import Modal from './Modal';
import { SpinnerIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  /** `danger` untuk hapus/nonaktifkan, `primary` untuk aksi positif. */
  confirmVariant?: 'danger' | 'primary';
  isConfirming?: boolean;
}

// Nama kelas ditulis lengkap agar terbaca Tailwind (kelas dinamis tidak ikut ter-build).
const CONFIRM_CLASS = { danger: 'btn btn-danger', primary: 'btn btn-primary' } as const;

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  confirmVariant = 'danger',
  isConfirming = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className={CONFIRM_CLASS[confirmVariant]}
          >
            {isConfirming ? <SpinnerIcon className="w-6 h-6" /> : confirmText}
          </button>
        </>
      }
    >
      <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-300">{message}</p>
    </Modal>
  );
};

export default ConfirmationModal;
