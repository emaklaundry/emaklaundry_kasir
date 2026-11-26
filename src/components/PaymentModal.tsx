import React, { useState, useMemo, useEffect } from 'react';
import { formatRupiah, parseRupiah } from '@/utils/formatting';
import { formatTransactionId } from '@/utils/uiHelpers';
import useToasts from '../contexts/useToasts';
import { useSettings } from '../contexts/SettingsContext';
import Modal from './Modal';
import DynamicQRIS from './DynamicQRIS';
import { SpinnerIcon } from './icons';
import { Transaction, PaymentMethod, PaymentStatus } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (updatedTransaction: Transaction) => Promise<void> | void;
  disabled?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  disabled,
}) => {
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [tenderedAmountStr, setTenderedAmountStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToasts();
  const { settings } = useSettings();

  const remainingBalance = useMemo(() => {
    if (!transaction) return 0;
    return transaction.total - transaction.amountPaid;
  }, [transaction]);

  useEffect(() => {
    if (transaction) {
      setTimeout(() => {
        setMethod(transaction.paymentMethod || PaymentMethod.Cash);
        setTenderedAmountStr('');
        setIsSaving(false);
      }, 0);
    }
  }, [transaction]);

  const amountToPay = remainingBalance;
  const tenderedAmount = parseRupiah(tenderedAmountStr);

  // Calculate cash change (only applies to Cash payment)
  const change = useMemo(() => {
    if (method !== PaymentMethod.Cash || !tenderedAmount || tenderedAmount < amountToPay) {
      return 0;
    }
    return tenderedAmount - amountToPay;
  }, [method, tenderedAmount, amountToPay]);

  const handleSave = async () => {
    if (!transaction || isSaving) return;

    try {
      setIsSaving(true);
      const lockedAmountToPay = amountToPay;
      const lockedRemainingBalance = remainingBalance;
      const lockedTenderedAmount = tenderedAmount;

      // Validasi awal
      if (lockedAmountToPay < 0 || lockedRemainingBalance < 0) {
        addToast('Terjadi kesalahan: nilai pembayaran tidak valid.', 'error');
        return;
      }

      // Jika total 0 atau amountPaid >= total, status harus Lunas
      if (transaction.total === 0 || transaction.amountPaid >= transaction.total) {
        await onSave({
          ...transaction,
          paymentStatus: PaymentStatus.Paid,
          amountPaid: transaction.total,
        });
        onClose();
        return;
      }

      if (lockedAmountToPay <= 0) {
        addToast('Jumlah pembayaran harus lebih dari nol.', 'error');
        return;
      }

      // Semua metode pembayaran: harus bayar penuh, tidak boleh kurang dari sisa tagihan
      if (lockedAmountToPay < lockedRemainingBalance) {
        addToast('Pembayaran harus sama dengan sisa tagihan. Tidak boleh bayar sebagian.', 'error');
        return;
      }

      if (lockedAmountToPay > lockedRemainingBalance) {
        addToast('Jumlah pembayaran tidak boleh melebihi sisa tagihan.', 'error');
        return;
      }

      if (method === PaymentMethod.Cash && lockedTenderedAmount < lockedAmountToPay) {
        addToast('Jumlah uang yang diterima kurang dari jumlah yang harus dibayar.', 'error');
        return;
      }

      const newAmountPaid = Math.min(transaction.amountPaid + lockedAmountToPay, transaction.total);
      const newStatus =
        newAmountPaid >= transaction.total ? PaymentStatus.Paid : PaymentStatus.Unpaid;
      const isPaid = newStatus === PaymentStatus.Paid;

      await onSave({
        ...transaction,
        amountPaid: newAmountPaid,
        paymentStatus: newStatus,
        paymentMethod: method,
        change: isPaid ? change : 0,
      });

      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
      addToast('Terjadi kesalahan saat menyimpan pembayaran. Silakan coba lagi.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? () => {} : onClose}
      title={`Pembayaran: ${formatTransactionId(transaction)}`}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Batalkan pembayaran"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={disabled || isSaving || amountToPay <= 0 || amountToPay > remainingBalance}
            className="flex justify-center items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 font-medium rounded-lg text-lg px-6 py-3 disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            type="button"
          >
            {isSaving && <SpinnerIcon className="w-5 h-5 animate-spin" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pembayaran'}</span>
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
          <div className="flex justify-between text-lg">
            <span>Total Tagihan:</span>
            <span className="font-semibold">Rp {formatRupiah(transaction.total)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Sudah Dibayar:</span>
            <span>- Rp {formatRupiah(transaction.amountPaid)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t dark:border-slate-600">
            <span>Sisa Tagihan:</span>
            <span>Rp {formatRupiah(remainingBalance)}</span>
          </div>
        </div>

        <div>
          <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(PaymentMethod).map((m) => (
              <button
                key={m}
                type="button"
                disabled={isSaving}
                onClick={() => setMethod(m)}
                className={`flex items-center justify-center p-3 border rounded-lg gap-2 transition-all duration-200
                  ${
                    method === m
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-white'
                  }
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span className="font-medium">{m}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic QRIS Display */}
        {method === PaymentMethod.QRIS && settings?.qrisStaticCode && (
          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <DynamicQRIS
              staticQRIS={settings.qrisStaticCode}
              amount={amountToPay}
              size={180}
              showAmount={true}
            />
          </div>
        )}

        {/* QRIS Not Configured Warning */}
        {method === PaymentMethod.QRIS && !settings?.qrisStaticCode && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
              ⚠️ QRIS belum dikonfigurasi
            </p>
            <p className="text-yellow-600 dark:text-yellow-400 text-xs text-center mt-1">
              Tambahkan kode QRIS statis di menu Pengaturan untuk mengaktifkan Dynamic QRIS
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="amountToPay"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Jumlah Bayar (Rp)
          </label>
          <input
            type="text"
            id="amountToPay"
            name="amountToPay"
            value={formatRupiah(amountToPay)}
            readOnly
            className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white opacity-70 cursor-not-allowed"
            autoComplete="off"
          />
        </div>

        {method === PaymentMethod.Cash && (
          <div>
            <label
              htmlFor="tenderedAmount"
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Uang Diterima (Rp)
            </label>
            <input
              type="text"
              id="tenderedAmount"
              name="tenderedAmount"
              disabled={isSaving}
              value={tenderedAmountStr}
              onChange={(e) => setTenderedAmountStr(formatRupiah(parseRupiah(e.target.value)))}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Masukkan jumlah uang tunai"
              autoComplete="off"
            />
          </div>
        )}

        {change > 0 && (
          <div className="p-3 rounded-lg flex justify-between items-center text-xl font-bold bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300">
            <span>Kembalian:</span>
            <span>Rp {formatRupiah(change)}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;
