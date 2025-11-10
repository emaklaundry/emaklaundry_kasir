
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { Transaction, PaymentMethod } from '../types';
import { formatRupiah, parseRupiah } from '../utils/formatting';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (updatedTransaction: Transaction) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, transaction, onSave }) => {
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [amountToPayStr, setAmountToPayStr] = useState('');
  const [tenderedAmountStr, setTenderedAmountStr] = useState('');

  const remainingBalance = useMemo(() => {
    if (!transaction) return 0;
    return transaction.total - transaction.amountPaid;
  }, [transaction]);

  useEffect(() => {
    if (transaction) {
      setMethod(transaction.paymentMethod || PaymentMethod.Cash);
      setAmountToPayStr(formatRupiah(remainingBalance));
      setTenderedAmountStr('');
    }
  }, [transaction, remainingBalance]);

  const amountToPay = parseRupiah(amountToPayStr);
  const tenderedAmount = parseRupiah(tenderedAmountStr);

  const change = useMemo(() => {
    if (method !== PaymentMethod.Cash || !tenderedAmount || tenderedAmount < amountToPay) {
      return 0;
    }
    return tenderedAmount - amountToPay;
  }, [method, tenderedAmount, amountToPay]);
  
  const handleSave = () => {
    if (!transaction || amountToPay <= 0 || amountToPay > remainingBalance) {
        alert("Jumlah pembayaran tidak valid.");
        return;
    }

    const newAmountPaid = transaction.amountPaid + amountToPay;
    const newStatus = newAmountPaid >= transaction.total ? 'Paid' : 'Partially Paid';

    onSave({
      ...transaction,
      amountPaid: newAmountPaid,
      paymentStatus: newStatus,
      paymentMethod: method,
      change: change,
    });
    onClose();
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pembayaran: ${transaction.id}`}
      footer={
        <>
          <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
          <button 
            onClick={handleSave} 
            disabled={amountToPay <= 0 || amountToPay > remainingBalance}
            className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 disabled:bg-blue-400 disabled:cursor-not-allowed"
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
                <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                    {Object.values(PaymentMethod).map(m => (
                        <button key={m} onClick={() => setMethod(m)} className={`p-3 rounded-lg text-base border-2 ${method === m ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600'}`}>
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="amountToPay" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Jumlah Bayar (Rp)</label>
                <input 
                    type="text" 
                    id="amountToPay" 
                    value={amountToPayStr}
                    onChange={e => setAmountToPayStr(formatRupiah(parseRupiah(e.target.value)))}
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                />
            </div>
            
            {method === PaymentMethod.Cash && (
                 <div>
                    <label htmlFor="tenderedAmount" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Uang Diterima (Rp)</label>
                    <input 
                        type="text" 
                        id="tenderedAmount" 
                        value={tenderedAmountStr}
                        onChange={e => setTenderedAmountStr(formatRupiah(parseRupiah(e.target.value)))}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        placeholder="Masukkan jumlah uang tunai"
                    />
                </div>
            )}
            
            {change > 0 && (
                 <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-lg flex justify-between items-center text-xl font-bold text-green-800 dark:text-green-300">
                    <span>Kembalian:</span>
                    <span>Rp {formatRupiah(change)}</span>
                </div>
            )}
        </div>
    </Modal>
  );
};

export default PaymentModal;
