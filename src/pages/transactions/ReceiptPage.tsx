import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrinterIcon, ChevronLeftIcon, ShoppingCartIcon } from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import { useSettings } from '../../contexts/SettingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { fetchCustomers } from '../../contexts/CustomerContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';

import { supabase } from '../../utils/supabaseClient';

const ReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { settings } = useSettings();
  const { transactions } = useTransactions();
  const navigate = useNavigate();
  const { addAuditLog } = useAuditLogs();

  const { data: customersRaw = [] } = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });

  // Normalize customers to always be an array
  const customers = Array.isArray(customersRaw) ? customersRaw : (customersRaw?.data ?? []);

  const transaction = transactions.find((t) => t.id === id);
  const [fetchedTransaction, setFetchedTransaction] = React.useState(null);
  React.useEffect(() => {
    if (!transaction && id) {
      supabase.from('transactions').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setFetchedTransaction(data);
      });
    }
  }, [transaction, id]);

  const tx = transaction || fetchedTransaction;
  const customer = tx ? customers.find((c) => c.id === tx.customerId) : null;

  if (!tx || !customer) {
    return (
      <EmptyState
        icon={<ShoppingCartIcon className="mx-auto w-12 h-12 text-slate-400" />}
        title="Transaksi tidak ditemukan"
        description="Transaksi yang Anda cari tidak tersedia atau telah dihapus."
      >
        <Link to="/transactions" className="mt-4 inline-block text-blue-600 hover:underline">
          Kembali ke Daftar Transaksi
        </Link>
      </EmptyState>
    );
  }

  const remainingBalance = tx.total - tx.amountPaid;

  return (
    <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800 p-8 rounded-lg shadow-lg receipt-print">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Laundry POS</h1>
        <p className="text-base text-slate-500 dark:text-slate-400">Struk Transaksi</p>
      </div>

      <div className="border-b-2 border-dashed border-slate-300 dark:border-slate-600 pb-4 mb-4">
        <div className="flex justify-between text-base">
          <span className="text-slate-500 dark:text-slate-400">No. Invoice</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {tx.invoiceCode || tx.id}
          </span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-slate-500 dark:text-slate-400">Tanggal</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {new Date(tx.createdAt).toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-slate-500 dark:text-slate-400">Pelanggan</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{customer.name}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-slate-500 dark:text-slate-400">Status Bayar</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {tx.paymentStatus}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {tx.items.map((item, index) => (
          <div key={index} className="flex flex-col text-base py-1">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.serviceName}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {item.quantity} {item.unit} @ Rp {item.price.toLocaleString('id-ID')}
                </p>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Rp {item.subtotal.toLocaleString('id-ID')}
              </p>
            </div>
            {item.itemDetails?.slice(0, item.quantity).some((d) => d.note) && (
              <div className="pl-4 mt-1 space-y-0.5">
                {item.itemDetails?.slice(0, item.quantity).map(
                  (detail, detailIndex) =>
                    detail.note && (
                      <p key={detailIndex} className="text-sm text-slate-500 dark:text-slate-400">
                        - Item #{detailIndex + 1}: {detail.note}
                      </p>
                    ),
                )}
              </div>
            )}
            {item.taggedItems && (
              <div className="pl-4 mt-1">
                <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                  Rincian: {item.taggedItems}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-4 mt-4 space-y-2">
        <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
          <span>Subtotal</span>
          <span>Rp {tx.subtotal.toLocaleString('id-ID')}</span>
        </div>
        {tx.discount > 0 && (
          <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
            <span>Diskon</span>
            <span>- Rp {tx.discount.toLocaleString('id-ID')}</span>
          </div>
        )}
        {tx.tax > 0 && (
          <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
            <span>Pajak</span>
            <span>+ Rp {tx.tax.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white pt-2 border-t border-slate-300 dark:border-slate-600">
          <span>Total</span>
          <span>Rp {tx.total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-4 mt-4 space-y-2">
        <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
          <span>Metode Bayar</span>
          <span>{tx.paymentMethod || '-'}</span>
        </div>
        <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
          <span>Dibayar</span>
          <span>Rp {tx.amountPaid.toLocaleString('id-ID')}</span>
        </div>
        {tx.change > 0 && (
          <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
            <span>Kembalian</span>
            <span>Rp {tx.change.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg text-slate-900 dark:text-white">
          <span>Sisa Tagihan</span>
          <span>Rp {remainingBalance > 0 ? remainingBalance.toLocaleString('id-ID') : 0}</span>
        </div>
      </div>

      <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
        <p>
          Estimasi Selesai:{' '}
          {tx.estimatedCompletionDate
            ? new Date(tx.estimatedCompletionDate).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : '-'}
        </p>
        <p className="mt-2">
          {settings?.receiptMessage ?? 'Terima kasih telah menggunakan layanan kami.'}
        </p>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 print-hide">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 flex items-center justify-center text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3.5 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Kembali
        </button>
        <button
          onClick={() => {
            if (tx) {
              addAuditLog(
                `Mencetak receipt untuk transaksi ${tx.id}.`,
                tx.storeId,
              );
            }
            window.print();
          }}
          className="flex-1 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5"
        >
          <PrinterIcon className="w-5 h-5 mr-2" />
          Cetak
        </button>
      </div>
    </div>
  );
};

export default ReceiptPage;
