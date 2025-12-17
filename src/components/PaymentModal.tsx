import React, { useState, useMemo, useEffect } from 'react';
import { formatRupiah, parseRupiah } from '../utils/formatting';
import useToasts from '../contexts/useToasts';
import Modal from './Modal';
// import { SpinnerIcon, DollarSignIcon } from './icons';
import { Transaction, PaymentMethod, PaymentStatus } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (updatedTransaction: Transaction, pointsEarned?: number) => Promise<void> | void;
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
  // amountToPayStr dihilangkan, diganti dengan auto value dari remainingBalance
  const [tenderedAmountStr, setTenderedAmountStr] = useState('');
  // No internal isSaving state
  const { addToast } = useToasts();

  const remainingBalance = useMemo(() => {
    if (!transaction) return 0;
    return transaction.total - transaction.amountPaid;
  }, [transaction]);

  useEffect(() => {
    if (transaction) {
      setTimeout(() => {
        setMethod(transaction.paymentMethod || PaymentMethod.Cash);
        setTenderedAmountStr('');
      }, 0);
    }
  }, [transaction]);

  const amountToPay = remainingBalance;
  const tenderedAmount = parseRupiah(tenderedAmountStr);

  // NEW: Calculate rounding for ALL payment methods based on total remainder
  // Get last 2 digits of amount (remainder when divided by 100)
  const totalRemainder = amountToPay % 100;
  // Round if remainder is between 1-49 (e.g., Rp 10,350 → round down Rp 50)
  const shouldRoundTotal = totalRemainder > 0 && totalRemainder < 50;
  const roundedAmountToPay = shouldRoundTotal ? amountToPay - totalRemainder : amountToPay;
  const pointsEarnedFromRounding = shouldRoundTotal ? totalRemainder : 0;

  // Calculate cash change (only applies to Cash payment)
  const change = useMemo(() => {
    if (method !== PaymentMethod.Cash || !tenderedAmount || tenderedAmount < roundedAmountToPay) {
      return 0;
    }
    return tenderedAmount - roundedAmountToPay;
  }, [method, tenderedAmount, roundedAmountToPay]);

  const handleSave = async () => {
    if (!transaction) return;

    try {
      // FIXED: Lock values immediately to prevent race conditions
      const lockedAmountToPay = amountToPay;
      const lockedRemainingBalance = remainingBalance;
      const lockedTenderedAmount = tenderedAmount;

      // Validasi awal
      if (lockedAmountToPay < 0 || lockedRemainingBalance < 0) {
        addToast('Terjadi kesalahan: nilai pembayaran tidak valid.', 'error');
        return;
      }

      // Jika total 0 (karena diskon penuh atau pajak), atau amountPaid >= total, status harus Lunas
      if (transaction.total === 0 || transaction.amountPaid >= transaction.total) {
        await onSave({
          ...transaction,
          paymentStatus: PaymentStatus.Paid,
          amountPaid: transaction.total, // pastikan tidak berlebih
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

      if (method === PaymentMethod.Cash && lockedTenderedAmount < roundedAmountToPay) {
        addToast('Jumlah uang yang diterima kurang dari jumlah yang harus dibayar.', 'error');
        return;
      }

      // Use roundedAmountToPay instead of lockedAmountToPay for actual payment
      const newAmountPaid = Math.min(transaction.amountPaid + roundedAmountToPay, transaction.total);
      let newStatus = PaymentStatus.Unpaid;

      if (newAmountPaid >= transaction.total) {
        newStatus = PaymentStatus.Paid;
      } else if (newAmountPaid > 0) {
        newStatus = PaymentStatus.Unpaid;
      }

      const finalChange = newStatus === PaymentStatus.Paid ? change : 0;
      const finalPoints = newStatus === PaymentStatus.Paid ? pointsEarnedFromRounding : 0;

      await onSave({
        ...transaction,
        amountPaid: newAmountPaid,
        paymentStatus: newStatus,
        paymentMethod: method,
        change: finalChange,
      }, finalPoints);

      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
      addToast('Terjadi kesalahan saat menyimpan pembayaran. Silakan coba lagi.', 'error');
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      // PERBAIKAN: Gunakan invoice_code jika ada, jika tidak baru gunakan ID
      title={`Pembayaran: ${transaction.invoiceCode || '#' + transaction.id.substring(0, 8)}`}
      footer={
        <>
          <button
            onClick={onClose}
            className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600"
            aria-label="Batalkan pembayaran"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={disabled || amountToPay <= 0 || amountToPay > remainingBalance}
            className="flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 font-medium rounded-lg text-lg px-6 py-3 disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            type="button"
          >
            Simpan Pembayaran
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
                onClick={() => setMethod(m)}
                className={`flex items-center justify-center p-3 border rounded-lg gap-2 transition-all duration-200
                  ${
                    method === m
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-white'
                  }
                `}
              >
                <span className="font-medium">{m}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="amountToPay"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Jumlah Bayar (Rp)
            {shouldRoundTotal && (
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                (Sudah dibulatkan)
              </span>
            )}
          </label>
          <input
            type="text"
            id="amountToPay"
            name="amountToPay"
            value={formatRupiah(roundedAmountToPay)}
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

        {shouldRoundTotal && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                  💰 Pembulatan Otomatis!
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Total dibulatkan: Rp {formatRupiah(amountToPay)} → Rp {formatRupiah(roundedAmountToPay)}
                  <br />
                  Saldo diskon bertambah: +Rp {formatRupiah(pointsEarnedFromRounding)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;
