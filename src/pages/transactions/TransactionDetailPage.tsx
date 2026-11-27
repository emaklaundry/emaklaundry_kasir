import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTransactions } from '../../contexts/TransactionContext';
import { supabase } from '../../utils/supabaseClient';
import { ALL_CUSTOMERS_QUERY_KEY, fetchAllCustomers } from '../../contexts/CustomerContext';
import {
  ChevronLeftIcon,
  PrinterIcon,
  UsersIcon,
  ShoppingCartIcon,
  SendIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import useAppContext from '../../contexts/useAppContext';
import { can } from '../../config/permissions';
import useToasts from '../../contexts/useToasts';
import { savePayment } from '../../utils/paymentUpdate';
import PaymentModal from '../../components/PaymentModal';
import EditPaidPaymentModal, { PaidPaymentCorrection } from '../../components/EditPaidPaymentModal';
import SupervisorPinModal from '../../components/SupervisorPinModal';
import WhatsAppModal from '../../components/WhatsAppModal'; // Import WhatsAppModal
import { getStatusBadge, getPaymentStatusBadge } from '@/utils/uiHelpers';
import { formatRupiah } from '@/utils/formatting';
import { OrderStatus, PaymentStatus, Transaction, Customer, TransactionItem } from '@/types';
import { useAuditLogs } from '../../contexts/AuditLogContext';

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
  const [isHeaderWAOpen, setIsHeaderWAOpen] = useState(false);

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
      // Map Supabase result to app Transaction type
      return {
        ...data,
        customerId: data.customerId ?? '',
        createdByUserId: data.createdByUserId ?? '',
        storeId: data.storeId ?? '',
        notes: data.notes ?? undefined,
        idempotencyKey: data.idempotencyKey ?? undefined,
        items: Array.isArray(data.items)
          ? (data.items as unknown as TransactionItem[]).map((item) => ({
              ...item,
              itemDetails: item.itemDetails ?? [],
            }))
          : [],
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        estimatedCompletionDate: data.estimatedCompletionDate ?? '',
        invoiceCode: data.invoice_code ?? undefined,
        paymentStatus: data.paymentStatus as import('../../types').PaymentStatus,
        orderStatus: data.orderStatus as import('../../types').OrderStatus,
        paymentMethod: data.paymentMethod
          ? (data.paymentMethod as import('../../types').PaymentMethod)
          : undefined,
      };
    },
    enabled: !!id,
  });

  const customersQuery = useQuery({
    queryKey: ALL_CUSTOMERS_QUERY_KEY,
    queryFn: fetchAllCustomers,
  });

  const customers = useMemo(() => {
    return Array.isArray(customersQuery.data)
      ? customersQuery.data
      : (customersQuery.data?.data ?? []);
  }, [customersQuery.data]);

  const customer = transaction ? customers.find((c) => c.id === transaction.customerId) : null;

  // FIXED: Add loading state guard to prevent premature error display
  if (isTransactionLoading || customersQuery.isLoading) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Memuat detail transaksi...
      </div>
    );
  }

  // FIXED: More comprehensive null checks with better error handling
  if (transactionError) {
    console.error('Transaction detail error:', transactionError);
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12" />}
        title="Terjadi Kesalahan"
        description="Terjadi kesalahan saat memuat transaksi"
      />
    );
  }

  if (!transaction) {
    console.warn('Transaction not found for ID:', id);
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12" />}
        title="Tidak Ditemukan"
        description="Transaksi tidak ditemukan"
      />
    );
  }

  if (!customer) {
    console.warn('Customer not found for transaction:', {
      transactionId: transaction.id,
      customerId: transaction.customerId,
    });
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12" />}
        title="Tidak Ditemukan"
        description="Data pelanggan tidak ditemukan"
      />
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

      <div className="card p-4">
        <div className="flex justify-end mb-6">
          <div className="flex gap-2">
            {/* Tombol Kirim WA Manual */}
            <button
              type="button"
              onClick={() => setIsHeaderWAOpen(true)}
              className="btn btn-secondary"
              title={
                transaction.whatsappSentAt
                  ? 'Struk sudah pernah dikirim via WhatsApp. Klik untuk kirim ulang.'
                  : 'Kirim struk via WhatsApp'
              }
            >
              <SendIcon className="h-5 w-5" />
              {transaction.whatsappSentAt ? 'Kirim Ulang WA' : 'Kirim WA'}
            </button>
            <Link to={`/transactions/${transaction.id}/receipt`} className="btn btn-secondary">
              <PrinterIcon className="h-5 w-5" />
              Cetak Struk
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h2 className="text-lg sm:text-lg font-semibold text-slate-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3 flex items-center">
              <UsersIcon className="w-6 h-6 mr-3 text-slate-500" />
              Info Pelanggan
            </h2>
            <DetailItem label="Nama" value={customer.name} />
            <DetailItem label="Telepon" value={customer.phone || '-'} />
            <DetailItem label="Alamat" value={customer.address || '-'} />
          </div>
          <div>
            <h2 className="text-lg sm:text-lg font-semibold text-slate-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3 flex items-center">
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
                <span className={`badge ${getStatusBadge(transaction.orderStatus)}`}>
                  {transaction.orderStatus}
                </span>
              }
            />
            <DetailItem
              label="Status Bayar"
              value={
                <span className={`badge ${getPaymentStatusBadge(transaction.paymentStatus)}`}>
                  {transaction.paymentStatus}
                </span>
              }
            />
            <DetailItem label="Metode Bayar" value={transaction.paymentMethod || '-'} />
            <DetailItem
              label="Struk WhatsApp"
              value={
                transaction.whatsappSentAt ? (
                  <span className="badge badge-success">
                    ✓ Terkirim{' '}
                    {new Date(transaction.whatsappSentAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                ) : (
                  <span className="badge badge-neutral">
                    Belum dikirim
                  </span>
                )
              }
            />
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

      <div className="card p-4">
        <h2 className="text-lg sm:text-lg font-semibold text-slate-900 dark:text-white mb-4">Rincian Item</h2>
        {/* Tampilan Tabel Desktop */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5">Layanan</th>
                <th className="px-4 py-2.5 text-center">Jumlah</th>
                <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                <th className="px-4 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, index) => (
                <tr key={index} className="border-b dark:border-slate-700">
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
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
                  <td className="px-4 py-2.5 text-center">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-2.5 text-right">Rp {formatRupiah(item.price)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                    Rp {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tampilan Kartu Mobile */}
        <div className="md:hidden space-y-3">
          {transaction.items.map((item, index) => (
            <div key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {item.serviceName}
                </span>
                <span className="font-semibold text-right text-slate-700 dark:text-slate-200">
                  Rp {formatRupiah(item.subtotal)}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {item.quantity} {item.unit} @ Rp {formatRupiah(item.price)}
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
          {/* Transaksi lama (sebelum diskon/pajak dihapus) bisa punya total ≠ subtotal. */}
          {transaction.total !== transaction.subtotal && (
            <>
              <DetailItem label="Subtotal" value={`Rp ${formatRupiah(transaction.subtotal)}`} />
              <DetailItem
                label="Penyesuaian"
                value={`${transaction.total < transaction.subtotal ? '- ' : '+ '}Rp ${formatRupiah(Math.abs(transaction.total - transaction.subtotal))}`}
              />
            </>
          )}
          <DetailItem
            label="Total"
            value={`Rp ${formatRupiah(transaction.total)}`}
            className="text-xl font-bold border-t dark:border-slate-700 pt-3 !text-slate-900 dark:!text-white"
          />
          <DetailItem label="Sudah Dibayar" value={`Rp ${formatRupiah(transaction.amountPaid)}`} />
          <DetailItem
            label="Sisa Tagihan"
            value={`Rp ${remainingBalance > 0 ? formatRupiah(remainingBalance) : 0}`}
            className="text-lg font-bold !text-slate-900 dark:!text-white"
          />
        </div>
      </div>

      {/* WhatsApp Modal untuk tombol manual di header */}
      {isHeaderWAOpen && (
        <WhatsAppModal
          isOpen={isHeaderWAOpen}
          onClose={() => setIsHeaderWAOpen(false)}
          transaction={transaction}
          customer={customer}
        />
      )}
    </div>
  );
};

export default TransactionDetailPage;

interface ActionButtonsProps {
  transaction: Transaction;
  customer: Customer; // Customer prop added
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<Transaction | null>;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  transaction,
  customer,
  updateTransaction,
}) => {
  const { currentUser } = useAppContext();
  const { addToast, updateToast } = useToasts();
  const { addAuditLog } = useAuditLogs();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [isEditPaidOpen, setIsEditPaidOpen] = useState(false);
  const [approval, setApproval] = useState<{ id: string; approverName: string } | null>(null);

  // State untuk WhatsApp Modal otomatis setelah aksi
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const isKasir = currentUser?.role === 'Kasir';
  const canTakePayment = can(currentUser?.role, 'transaction.payment');
  const canComplete = can(currentUser?.role, 'transaction.complete');

  if (!can(currentUser?.role, 'transaction.updateStatus')) return null;

  function handleOpenPaymentModal() {
    setIsPaymentOpen(true);
  }

  // Ubah pembayaran nota Lunas: Kasir wajib PIN supervisor, Admin langsung.
  function handleOpenEditPaid() {
    setApproval(null);
    if (isKasir) setIsPinOpen(true);
    else setIsEditPaidOpen(true);
  }

  function handleCloseEditPaid() {
    setIsEditPaidOpen(false);
    setApproval(null);
  }

  async function onSaveEditPaid(correction: PaidPaymentCorrection) {
    if (isKasir && !approval) {
      throw new Error('Persetujuan supervisor belum ada. Minta PIN lagi.');
    }
    await updateTransaction(transaction.id, {
      paymentMethod: correction.paymentMethod,
      change: correction.change,
      ...(approval ? { supervisorApprovalId: approval.id } : {}),
    });
    addAuditLog(
      `Mengubah pembayaran nota lunas ${transaction.invoiceCode ?? transaction.id}: ` +
        `${transaction.paymentMethod ?? '-'} → ${correction.paymentMethod}, ` +
        `kembalian Rp ${formatRupiah(correction.change)}` +
        (approval ? ` (disetujui PIN ${approval.approverName}).` : '.'),
      transaction.storeId,
    );
    await queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] });
    addToast('Pembayaran berhasil diubah.', 'success');
    handleCloseEditPaid();
  }

  async function onSavePayment(updatedTransaction: Transaction) {
    setLoading(true);
    const toastId = addToast('Menyimpan pembayaran...', 'info');
    const shouldShowWhatsAppModal =
      updatedTransaction.paymentStatus === PaymentStatus.Paid &&
      (updatedTransaction.orderStatus === OrderStatus.Completed ||
        updatedTransaction.orderStatus === OrderStatus.Ready);
    try {
      await savePayment(updateTransaction, { ...updatedTransaction, id: transaction.id });
      addAuditLog(
        `Menerima pembayaran untuk transaksi ${transaction.id}. Status bayar: ${updatedTransaction.paymentStatus}.`,
        transaction.storeId,
      );
      await queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] });
      updateToast(toastId, 'Pembayaran berhasil disimpan', 'success');
      if (shouldShowWhatsAppModal) {
        setIsWhatsAppOpen(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui status pembayaran';
      updateToast(toastId, message, 'error');
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
      addAuditLog(
        `Mengubah status transaksi ${transaction.id} menjadi "${OrderStatus.Ready}".`,
        transaction.storeId,
      );
      updateToast(toastId, 'Status pesanan diperbarui: Siap Ambil', 'success');
      // Otomatis tawarkan kirim WA saat Ready
      setIsWhatsAppOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui status pesanan';
      updateToast(toastId, message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkCompleted() {
    if (transaction.paymentStatus !== PaymentStatus.Paid) {
      addToast(
        'Transaksi belum lunas. Harap lunasi tagihan sebelum menyelesaikan pesanan.',
        'error',
      );
      return;
    }

    setLoading(true);
    const toastId = addToast('Memperbarui status pesanan...', 'info');
    try {
      await updateTransaction(transaction.id, { orderStatus: OrderStatus.Completed });
      addAuditLog(
        `Mengubah status transaksi ${transaction.id} menjadi "${OrderStatus.Completed}".`,
        transaction.storeId,
      );
      updateToast(toastId, 'Status pesanan diperbarui: Selesai', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui status pesanan';
      updateToast(toastId, message, 'error');
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
      {canTakePayment && transaction.paymentStatus !== PaymentStatus.Paid && (
        <button
          disabled={loading}
          onClick={handleOpenPaymentModal}
          className="btn btn-success"
          title="Input Pembayaran"
        >
          Bayar
        </button>
      )}

      {/* Koreksi pembayaran nota Lunas (Kasir butuh PIN supervisor) */}
      {canTakePayment && transaction.paymentStatus === PaymentStatus.Paid && (
        <button
          disabled={loading}
          onClick={handleOpenEditPaid}
          className="btn btn-secondary"
          title={
            isKasir ? 'Ubah pembayaran (perlu PIN supervisor)' : 'Ubah metode atau uang diterima'
          }
        >
          Ubah Pembayaran
        </button>
      )}

      <button
        disabled={
          loading ||
          transaction.orderStatus === OrderStatus.Ready ||
          transaction.orderStatus === OrderStatus.Completed
        }
        onClick={handleMarkReady}
        className="btn btn-secondary"
      >
        Tandai Siap Ambil
      </button>

      {/* Serah terima ke pelanggan: Kasir ke atas (Operator tidak). */}
      {canComplete && (
        <button
          disabled={
            loading ||
            transaction.orderStatus === OrderStatus.Completed ||
            transaction.paymentStatus !== PaymentStatus.Paid
          }
          onClick={handleMarkCompleted}
          className="btn btn-primary"
          title={
            transaction.paymentStatus !== PaymentStatus.Paid
              ? 'Pelunasan diperlukan sebelum menyelesaikan pesanan'
              : 'Selesaikan Pesanan'
          }
        >
          Tandai Selesai
        </button>
      )}

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        transaction={transaction}
        onSave={onSavePayment}
        disabled={loading}
      />

      {isPinOpen && (
        <SupervisorPinModal
          isOpen={isPinOpen}
          action="edit_paid"
          description={`Ubah pembayaran nota ${transaction.invoiceCode ?? transaction.id} (Rp ${formatRupiah(transaction.total)}).`}
          transactionId={transaction.id}
          onApproved={(approvalId, approverName) => {
            setApproval({ id: approvalId, approverName });
            setIsPinOpen(false);
            setIsEditPaidOpen(true);
          }}
          onClose={() => setIsPinOpen(false)}
        />
      )}

      {isEditPaidOpen && (
        <EditPaidPaymentModal
          isOpen={isEditPaidOpen}
          onClose={handleCloseEditPaid}
          transaction={transaction}
          onSave={onSaveEditPaid}
          approverName={approval?.approverName}
        />
      )}

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
