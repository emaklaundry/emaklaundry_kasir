import React, { useEffect, useId, useRef, useState } from 'react';
import Modal from './Modal';
import { KeyIcon } from './icons';
import {
  SUPERVISOR_ACTION_LABELS,
  SupervisorAction,
  isValidPinFormat,
  requestSupervisorApproval,
} from '../utils/supervisorApproval';

interface SupervisorPinModalProps {
  isOpen: boolean;
  action: SupervisorAction;
  /** Ringkasan yang disetujui, mis. "Batalkan transaksi EL-0012 milik Budi". */
  description: string;
  transactionId?: string;
  onApproved: (approvalId: string, approverName: string) => void;
  onClose: () => void;
}

const SupervisorPinModal: React.FC<SupervisorPinModalProps> = ({
  isOpen,
  action,
  description,
  transactionId,
  onApproved,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  useEffect(() => {
    if (!isOpen) return;
    setPin('');
    setError(null);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isChecking) return;
    if (!isValidPinFormat(pin)) {
      setError('PIN harus 6 angka.');
      return;
    }
    setIsChecking(true);
    setError(null);
    try {
      const result = await requestSupervisorApproval(action, pin, { transactionId });
      if (result.ok) {
        onApproved(result.approvalId, result.approverName);
        return;
      }
      setPin('');
      setError(
        result.remainingAttempts > 0
          ? `PIN salah. Sisa ${result.remainingAttempts} percobaan.`
          : 'PIN salah 5 kali. Permintaan dikunci 15 menit.',
      );
      inputRef.current?.focus();
    } catch (err) {
      setPin('');
      setError(err instanceof Error ? err.message : 'Gagal memeriksa PIN. Coba lagi.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    if (!isChecking) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="PIN Supervisor"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isChecking}
            className="btn btn-secondary"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isChecking || pin.length !== 6}
            className="btn btn-primary"
          >
            {isChecking ? 'Memeriksa…' : 'Setujui'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <KeyIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>{SUPERVISOR_ACTION_LABELS[action]}</strong> perlu persetujuan Admin cabang.
            <br />
            {description}
          </p>
        </div>

        <div>
          <label htmlFor={inputId} className="form-label">
            Minta Admin memasukkan PIN 6 angka
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            disabled={isChecking}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="block w-full rounded-lg border border-slate-300 bg-white p-3 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          {error && (
            <p id={errorId} role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Persetujuan hanya berlaku sekali dan tercatat di Log Audit atas nama Admin yang memasukkan
          PIN.
        </p>
      </form>
    </Modal>
  );
};

export default SupervisorPinModal;
