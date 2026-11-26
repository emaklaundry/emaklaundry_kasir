import React, { useEffect, useMemo, useState } from 'react';
import { formatRupiah, parseRupiah } from '@/utils/formatting';
import { formatTransactionId } from '@/utils/uiHelpers';
import Modal from './Modal';
import { SpinnerIcon } from './icons';
import { PaymentMethod, Transaction } from '@/types';

export interface PaidPaymentCorrection {
  paymentMethod: PaymentMethod;
  change: number;
}

interface EditPaidPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  onSave: (correction: PaidPaymentCorrection) => Promise<void>;
  /** Ditampilkan bila perubahan ini memakai persetujuan PIN supervisor. */
  approverName?: string | null;
}

/**
 * Koreksi pembayaran nota yang sudah Lunas: metode bayar dan uang tunai yang diterima.
 * Total dan status Lunas tidak berubah.
 */
const EditPaidPaymentModal: React.FC<EditPaidPaymentModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  approverName,
}) => {
  const initialMethod = transaction.paymentMethod ?? PaymentMethod.Cash;
  const initialTendered =
    initialMethod === PaymentMethod.Cash ? transaction.total + (transaction.change ?? 0) : 0;

  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [tenderedStr, setTenderedStr] = useState(formatRupiah(initialTendered));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMethod(initialMethod);
    setTenderedStr(initialTendered > 0 ? formatRupiah(initialTendered) : '');
    setError(null);
    setIsSaving(false);
  }, [isOpen, initialMethod, initialTendered]);

  const tendered = parseRupiah(tenderedStr);
  const change = useMemo(
    () => (method === PaymentMethod.Cash ? Math.max(tendered - transaction.total, 0) : 0),
    [method, tendered, transaction.total],
  );
  const isUnchanged = method === initialMethod && change === (transaction.change ?? 0);

  const handleSave = async () => {
    if (isSaving) return;
    if (method === PaymentMethod.Cash && tendered < transaction.total) {
      setError('Uang diterima tidak boleh kurang dari total tagihan.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ paymentMethod: method, change });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan pembayaran.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? () => {} : onClose}
      title={`Ubah Pembayaran: ${formatTransactionId(transaction)}`}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-secondary">
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUnchanged}
            className="btn btn-primary"
          >
            {isSaving && <SpinnerIcon className="w-5 h-5 animate-spin" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {approverName && (
          <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
            Disetujui oleh <strong>{approverName}</strong>. Persetujuan berlaku 2 menit dan hanya
            untuk satu kali simpan.
          </p>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
          <div className="flex justify-between text-lg">
            <span>Total Tagihan:</span>
            <span className="font-semibold">Rp {formatRupiah(transaction.total)}</span>
          </div>
          <div className="flex justify-between text-base text-slate-600 dark:text-slate-300">
            <span>Tercatat sekarang:</span>
            <span>
              {initialMethod}
              {initialMethod === PaymentMethod.Cash && (transaction.change ?? 0) > 0
                ? `, kembalian Rp ${formatRupiah(transaction.change)}`
                : ''}
            </span>
          </div>
        </div>

        <fieldset>
          <legend className="block mb-2 text-base font-medium text-slate-900 dark:text-white">
            Metode Pembayaran
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(PaymentMethod).map((m) => (
              <button
                key={m}
                type="button"
                disabled={isSaving}
                aria-pressed={method === m}
                onClick={() => {
                  setMethod(m);
                  setError(null);
                }}
                className={`flex items-center justify-center p-3 border rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  method === m
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </fieldset>

        {method === PaymentMethod.Cash && (
          <div>
            <label
              htmlFor="editPaidTendered"
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Uang Diterima (Rp)
            </label>
            <input
              type="text"
              id="editPaidTendered"
              inputMode="numeric"
              autoComplete="off"
              disabled={isSaving}
              value={tenderedStr}
              onChange={(e) => {
                setTenderedStr(formatRupiah(parseRupiah(e.target.value)));
                setError(null);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        )}

        {change > 0 && (
          <div className="p-3 rounded-lg flex justify-between items-center text-xl font-bold bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300">
            <span>Kembalian:</span>
            <span>Rp {formatRupiah(change)}</span>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default EditPaidPaymentModal;
