import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import { SpinnerIcon } from './icons';
import { formatRupiah } from '@/utils/formatting';
import { remainingBalance } from '@/utils/paymentUpdate';
import { OrderStatus, PaymentMethod, PaymentStatus, Transaction } from '@/types';

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Nota yang dipilih (boleh campur lunas & belum lunas; yang lunas dilewati). */
  transactions: Transaction[];
  onConfirm: (method: PaymentMethod) => Promise<void> | void;
  /** Nota "Siap Diambil" yang dilunasi otomatis jadi "Selesai". */
  completeIfReady?: boolean;
  isProcessing?: boolean;
}

const BulkPaymentModal: React.FC<BulkPaymentModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onConfirm,
  completeIfReady = false,
  isProcessing = false,
}) => {
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.Cash);


  const unpaid = useMemo(
    () => transactions.filter((t) => t.paymentStatus !== PaymentStatus.Paid),
    [transactions],
  );
  const skippedCount = transactions.length - unpaid.length;
  const totalDue = useMemo(() => unpaid.reduce((sum, t) => sum + remainingBalance(t), 0), [unpaid]);
  const readyCount = completeIfReady
    ? unpaid.filter((t) => t.orderStatus === OrderStatus.Ready).length
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title="Tandai Lunas Massal"
      footer={
        <>
          <button onClick={onClose} disabled={isProcessing} className="btn btn-secondary">
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(method)}
            disabled={isProcessing || unpaid.length === 0}
            className="btn btn-primary"
          >
            {isProcessing && <SpinnerIcon className="w-5 h-5" />}
            <span>{isProcessing ? 'Menyimpan...' : `Lunasi ${unpaid.length} Transaksi`}</span>
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
          <div className="flex justify-between text-lg">
            <span>Transaksi belum lunas:</span>
            <span className="font-semibold">{unpaid.length}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t dark:border-slate-600">
            <span>Total Sisa Tagihan:</span>
            <span>Rp {formatRupiah(totalDue)}</span>
          </div>
        </div>

        <div>
          <p id="bulk-payment-method-label" className="form-label">
            Metode Pembayaran
          </p>
          <div
            role="group"
            aria-labelledby="bulk-payment-method-label"
            className="grid grid-cols-3 gap-2"
          >
            {Object.values(PaymentMethod).map((m) => (
              <button
                key={m}
                type="button"
                disabled={isProcessing}
                onClick={() => setMethod(m)}
                aria-pressed={method === m}
                className={`flex items-center justify-center p-3 border rounded-lg gap-2 transition-all duration-200
                  ${
                    method === m
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-white'
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span className="font-medium">{m}</span>
              </button>
            ))}
          </div>
        </div>

        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-5">
          <li>Setiap transaksi dibayar penuh sebesar sisa tagihannya, tanpa kembalian.</li>
          {skippedCount > 0 && <li>{skippedCount} transaksi yang sudah lunas akan dilewati.</li>}
          {readyCount > 0 && (
            <li>{readyCount} transaksi "Siap Diambil" akan otomatis ditandai Selesai.</li>
          )}
        </ul>
      </div>
    </Modal>
  );
};

export default BulkPaymentModal;
