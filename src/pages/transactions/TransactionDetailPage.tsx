import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTransactions } from '../../contexts/TransactionContext';
import { supabase } from '../../utils/supabaseClient';
import { fetchCustomers } from '../../contexts/CustomerContext';
import {
  ChevronLeftIcon,
  PrinterIcon,
  UsersIcon,
  ShoppingCartIcon,
  SendIcon, // Import icon Send
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import { useAppContext } from '../../contexts/AppContext';
import { useToasts } from '../../contexts/ToastContext';
import PaymentModal from '../../components/PaymentModal';
import WhatsAppModal from '../../components/WhatsAppModal'; // Import WhatsAppModal
import { getStatusBadge, getPaymentStatusBadge } from '@/utils/uiHelpers';
import { OrderStatus, PaymentStatus, Transaction, Customer } from '@/types';

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({
  label,
  value,
  className,
}) => (
  <div className={`flex justify-between items-start py-2 ${className}`}>
    <span className="text-base text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-base font-semibold text-slate-800 dark:text-slate-200 text-right">
      {value}
    </span>
  </div>
);

const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Mengambil fungsi updateTransaction dari context
  const { updateTransaction } = useTransactions({ enabled: false });

  // Query untuk mengambil SATU transaksi berdasarkan ID
  const {
    data: transaction,
    isLoading: isTransactionLoading,
    error: transactionError,
  } = useQuery<Transaction, Error>({
    queryKey: ['transaction', id],
    queryFn: async () => {
      if (!id) throw new Error('Transaction ID is missing');
      const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Transaction;
    },
    enabled: !!id,
  });

  const customersQuery = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });

  const customers = useMemo(() => {
    return Array.isArray(customersQuery.data)
      ? customersQuery.data
      : (customersQuery.data?.data ?? []);
  }, [customersQuery.data]);

  const customer = transaction ? customers.find((c) => c.id === transaction.customerId) : null;

  // State untuk WhatsApp manual dari header (opsional, jika ingin tombol di header)
  // const [isHeaderWAOpen, setIsHeaderWAOpen] = useState(false); // Unused

  if (isTransactionLoading) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Memuat detail transaksi...
      </div>
    );
  }

  if (transactionError || !transaction || !customer) {
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

  const remainingBalance = transaction.total - transaction.amountPaid;

  return (
    <div className="space-y-6">
      <Link
        to="/transactions"
        className="flex items-center text-base text-blue-600 hover:underline dark:text-blue-400"
      >
        <ChevronLeftIcon className="w-4 h-4 mr-1" />
        Kembali ke Daftar Transaksi
      </Link>

      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Detail Transaksi</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              {transaction.invoice_code || transaction.id}
            </p>
          </div>
          <div className="flex gap-2">
             {/* Tombol Kirim WA Manual */}
            {/*
            <button
              onClick={() => setIsHeaderWAOpen(true)}
              className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-4 py-3"
              title="Kirim Struk WhatsApp"
            >
              <SendIcon className="h-5 w-5" />
            </button>
            */}
            <Link
              to={`/transactions/${transaction.id}/receipt`}
              className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Cetak Struk
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3 flex items-center">
              <UsersIcon className="w-6 h-6 mr-3 text-slate-500" />
              Info Pelanggan
            </h2>
            <DetailItem label="Nama" value={customer.name} />
            <DetailItem label="Telepon" value={customer.phone} />
            <DetailItem label="Alamat" value={customer.address || '-'} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3 flex items-center">
              <ShoppingCartIcon className="w-6 h-6 mr-3 text-slate-500" />
              Info Transaksi
            </h2>
            <DetailItem
              label="Tanggal Masuk"
              value={new Date(transaction.createdAt).toLocaleString('id-ID')}
            />
            <DetailItem
              label="Estimasi Selesai"
              value={new Date(transaction.estimatedCompletionDate).toLocaleString('id-ID')}
            />
            <DetailItem
              label="Status Pesanan"
              value={
                <span
                  className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(
                    transaction.orderStatus,
                  )}`}
                >
                  {transaction.orderStatus}
                </span>
              }
            />
            <DetailItem
              label="Status Bayar"
              value={
                <span
                  className={`px-2 py-1 text-sm font-medium rounded-full ${getPaymentStatusBadge(
                    transaction.paymentStatus,
                  )}`}
                >
                  {transaction.paymentStatus}
                </span>
              }
            />
            <DetailItem label="Metode Bayar" value={transaction.paymentMethod || '-'} />
          </div>
        </div>
        {transaction.notes && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Catatan</h3>
            <p className="text-base p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg whitespace-pre-wrap">
              {transaction.notes}
            </p>
          </div>
        )}

        {/* Action buttons passing updateTransaction and customer */}
        <ActionButtons 
          transaction={transaction} 
          customer={customer}
          updateTransaction={updateTransaction} 
        />
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Rincian Item</h2>
        {/* Tampilan Tabel Desktop */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Layanan</th>
                <th className="px-4 py-3 text-center">Jumlah</th>
                <th className="px-4 py-3 text-right">Harga Satuan</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, index) => (
                <tr key={index} className="border-b dark:border-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {item.serviceName}
                    {item.itemDetails?.slice(0, item.quantity).some((d) => d.note) && (
                      <div className="pl-4 mt-1 space-y-0.5">
                        {item.itemDetails?.slice(0, item.quantity).map(
                          (detail, detailIndex) =>
                            detail.note && (
                              <p
                                key={detailIndex}
                                className="text-sm font-normal text-slate-500 dark:text-slate-400"
                              >
                                - Item #{detailIndex + 1}: {detail.note}
                              </p>
                            ),
                        )}
                      </div>
                    )}
                    {item.taggedItems && (
                      <div className="pl-4 mt-1">
                        <p className="text-sm font-normal text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                          Rincian: {item.taggedItems}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tampilan Kartu Mobile */}
        <div className="md:hidden space-y-3">
          {transaction.items.map((item, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {item.serviceName}
                </span>
                <span className="font-semibold text-right text-slate-700 dark:text-slate-200">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {item.quantity} {item.unit} @ Rp {item.price.toLocaleString('id-ID')}
              </p>
              {item.itemDetails?.slice(0, item.quantity).some((d) => d.note) && (
                <div className="pl-2 mt-2 space-y-0.5 border-l-2 border-slate-300 dark:border-slate-600">
                  {item.itemDetails?.slice(0, item.quantity).map(
                    (detail, detailIndex) =>
                      detail.note && (
                        <p
                          key={detailIndex}
                          className="text-sm font-normal text-slate-500 dark:text-slate-400"
                        >
                          - Item #{detailIndex + 1}: {detail.note}
                        </p>
                      ),
                  )}
                </div>
              )}
              {item.taggedItems && (
                <div className="pl-2 mt-2 border-l-2 border-slate-300 dark:border-slate-600">
                  <p className="text-sm font-normal text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                    Rincian: {item.taggedItems}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="w-full md:w-1/2 lg:w-1/3 ml-auto mt-6 space-y-2">
          <DetailItem
            label="Subtotal"
            value={`Rp ${transaction.subtotal.toLocaleString('id-ID')}`}
          />
          {transaction.discount > 0 && (
            <DetailItem
              label="Diskon"
              value={`- Rp ${transaction.discount.toLocaleString('id-ID')}`}
              className="!text-red-600 dark:!text-red-400"
            />
          )}
          {transaction.tax > 0 && (
            <DetailItem label="Pajak" value={`+ Rp ${transaction.tax.toLocaleString('id-ID')}`} />
          )}
          <DetailItem
            label="Grand Total"
            value={`Rp ${transaction.total.toLocaleString('id-ID')}`}
            className="text-xl font-bold border-t dark:border-slate-700 pt-3 !text-slate-900 dark:!text-white"
          />
          <DetailItem
            label="Sudah Dibayar"
            value={`Rp ${transaction.amountPaid.toLocaleString('id-ID')}`}
          />
          <DetailItem
            label="Sisa Tagihan"
            value={`Rp ${remainingBalance > 0 ? remainingBalance.toLocaleString('id-ID') : 0}`}
            className="text-lg font-bold !text-slate-900 dark:!text-white"
          />
        </div>
      </div>
      
      {/* WhatsApp Modal untuk tombol manual di header */}
      {/*
      {isHeaderWAOpen && (
        <WhatsAppModal
          isOpen={isHeaderWAOpen}
          onClose={() => setIsHeaderWAOpen(false)}
          transaction={transaction}
          customer={customer}
        />
      )}
      */}
    </div>
  );
};

export default TransactionDetailPage;

interface ActionButtonsProps {
  transaction: Transaction;
  customer: Customer; // Customer prop added
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<Transaction | null>;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ transaction, customer, updateTransaction }) => {
  const { currentUser } = useAppContext();
  const { addToast, updateToast } = useToasts();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  // State untuk WhatsApp Modal otomatis setelah aksi
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const isKasir = currentUser?.role === 'Kasir';
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin';

  if (!isKasir && !isAdmin) return null;

  function handleOpenPaymentModal() {
    setIsPaymentOpen(true);
  }

  async function onSavePayment(updatedTransaction: Transaction) {
    setLoading(true);
    const toastId = addToast('Menyimpan pembayaran...', 'info');
    const shouldShowWhatsAppModal =
      updatedTransaction.paymentStatus === PaymentStatus.Paid &&
      (updatedTransaction.orderStatus === OrderStatus.Completed || updatedTransaction.orderStatus === OrderStatus.Ready);
    try {
      await updateTransaction(transaction.id, {
        amountPaid: updatedTransaction.amountPaid,
        change: updatedTransaction.change,
        paymentMethod: updatedTransaction.paymentMethod ?? undefined,
        paymentStatus: updatedTransaction.paymentStatus,
      });
      await queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] });
      updateToast(toastId, 'Pembayaran berhasil disimpan', 'success');
      if (shouldShowWhatsAppModal) {
        setIsWhatsAppOpen(true);
      }
    } catch (err: any) {
      updateToast(toastId, err?.message ?? 'Gagal memperbarui status pembayaran', 'error');
    } finally {
      setLoading(false);
      setIsPaymentOpen(false);
    }
  }

  async function handleMarkReady() {
    setLoading(true);
    const toastId = addToast('Memperbarui status pesanan...', 'info');
    try {
      await updateTransaction(transaction.id, { orderStatus: OrderStatus.Ready });
      updateToast(toastId, 'Status pesanan diperbarui: Siap Ambil', 'success');
      // Otomatis tawarkan kirim WA saat Ready
      setIsWhatsAppOpen(true);
    } catch (err: any) {
      updateToast(toastId, err?.message ?? 'Gagal memperbarui status pesanan', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkCompleted() {
    if (transaction.paymentStatus !== PaymentStatus.Paid) {
      addToast('Transaksi belum lunas. Harap lunasi tagihan sebelum menyelesaikan pesanan.', 'error');
      return;
    }
    
    setLoading(true);
    const toastId = addToast('Memperbarui status pesanan...', 'info');
    try {
      await updateTransaction(transaction.id, { orderStatus: OrderStatus.Completed });
      updateToast(toastId, 'Status pesanan diperbarui: Selesai', 'success');
    } catch (err: any) {
      updateToast(toastId, err?.message ?? 'Gagal memperbarui status pesanan', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex gap-3 relative flex-wrap">
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/60 dark:bg-black/50 rounded-md flex items-center justify-center">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-blue-700"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span className="text-base font-medium text-slate-900 dark:text-white">
              Memproses...
            </span>
          </div>
        </div>
      )}

      {/* Tombol Bayar HANYA muncul jika BELUM Lunas */}
      {transaction.paymentStatus !== PaymentStatus.Paid && (
        <button
          disabled={loading}
          onClick={handleOpenPaymentModal}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:bg-green-300 disabled:cursor-not-allowed"
          title="Input Pembayaran"
        >
          Bayar
        </button>
      )}

      <button
        disabled={
          loading ||
          transaction.orderStatus === OrderStatus.Ready ||
          transaction.orderStatus === OrderStatus.Completed
        }
        onClick={handleMarkReady}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md disabled:bg-yellow-300 disabled:cursor-not-allowed"
      >
        Tandai Siap Ambil
      </button>

      <button
        disabled={
          loading ||
          transaction.orderStatus === OrderStatus.Completed ||
          transaction.paymentStatus !== PaymentStatus.Paid
        }
        onClick={handleMarkCompleted}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-blue-300 disabled:cursor-not-allowed"
        title={
          transaction.paymentStatus !== PaymentStatus.Paid
            ? 'Pelunasan diperlukan sebelum menyelesaikan pesanan'
            : 'Selesaikan Pesanan'
        }
      >
        Tandai Selesai
      </button>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        transaction={transaction}
        onSave={onSavePayment}
        disabled={loading}
      />
      
      {/* Modal WA Otomatis setelah aksi */}
      {isWhatsAppOpen && (
        <WhatsAppModal
            isOpen={isWhatsAppOpen}
            onClose={() => setIsWhatsAppOpen(false)}
            transaction={transaction}
            customer={customer}
        />
      )}
    </div>
  );
};