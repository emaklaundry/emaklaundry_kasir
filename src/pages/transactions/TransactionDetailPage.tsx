import * as React from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { useTransactions } from '../../contexts/TransactionContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { OrderStatus, PaymentStatus, Transaction } from '../../../types';
import { ChevronLeftIcon, PrinterIcon, UsersIcon, ShoppingCartIcon } from '../../components/icons';
// import { updateTransactionProgress } from '../../utils/supabaseClient';
import EmptyState from '../../components/EmptyState';
import { useAppContext } from '../../contexts/AppContext';
import { useToasts } from '../../contexts/ToastContext';
import PaymentModal from '../../components/PaymentModal';
// supabase client not used directly in this file; progress updates go through RPC helper

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={`flex justify-between items-start py-2 ${className}`}>
        <span className="text-base text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-base font-semibold text-slate-800 dark:text-slate-200 text-right">{value}</span>
    </div>
);

const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Processing: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case OrderStatus.Ready: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case OrderStatus.Completed: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
};

const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
        case PaymentStatus.Paid: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case PaymentStatus.Unpaid: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        case PaymentStatus.PartiallyPaid: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
        default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
};

const TransactionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { transactions } = useTransactions();
    const { customers } = useCustomers();

    const transaction = transactions.find(t => t.id === id);
    const customer = transaction ? customers.find(c => c.id === transaction.customerId) : null;

    if (!transaction || !customer) {
        return (
            <EmptyState
                icon={<ShoppingCartIcon className="mx-auto w-12 h-12 text-slate-400" />}
                title="Transaksi tidak ditemukan"
                description="Transaksi yang Anda cari tidak tersedia atau telah dihapus."
            >
                <Link to="/transactions" className="mt-4 inline-block text-blue-600 hover:underline">Kembali ke Daftar Transaksi</Link>
            </EmptyState>
        );
    }

    const remainingBalance = transaction.total - transaction.amountPaid;

    return (
        <div className="space-y-6">
            <Link to="/transactions" className="flex items-center text-base text-blue-600 hover:underline dark:text-blue-400">
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Kembali ke Daftar Transaksi
            </Link>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Detail Transaksi</h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400">{transaction.id}</p>
                    </div>
                    <Link to={`/transactions/${transaction.id}/receipt`} className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5">
                        <PrinterIcon className="h-5 w-5 mr-2" />
                        Cetak Struk
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3 flex items-center">
                            <UsersIcon className="w-6 h-6 mr-3 text-slate-500"/>
                            Info Pelanggan
                        </h2>
                        <DetailItem label="Nama" value={customer.name} />
                        <DetailItem label="Telepon" value={customer.phone} />
                        <DetailItem label="Alamat" value={customer.address || '-'} />
                    </div>
                    <div>
                         <h2 className="text-2xl font-semibold text-slate-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3 flex items-center">
                            <ShoppingCartIcon className="w-6 h-6 mr-3 text-slate-500"/>
                            Info Transaksi
                        </h2>
                        <DetailItem label="Tanggal Masuk" value={new Date(transaction.createdAt).toLocaleString('id-ID')} />
                        <DetailItem label="Estimasi Selesai" value={new Date(transaction.estimatedCompletionDate).toLocaleString('id-ID')} />
                        <DetailItem label="Status Pesanan" value={<span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(transaction.orderStatus)}`}>{transaction.orderStatus}</span>} />
                        <DetailItem label="Status Bayar" value={<span className={`px-2 py-1 text-sm font-medium rounded-full ${getPaymentStatusBadge(transaction.paymentStatus)}`}>{transaction.paymentStatus}</span>} />
                        <DetailItem label="Metode Bayar" value={transaction.paymentMethod || '-'} />
                        <DetailItem label="Sisa Tagihan" value={`Rp ${remainingBalance > 0 ? remainingBalance.toLocaleString('id-ID') : 0}`} />
                    </div>
                </div>
                {transaction.notes && (
                     <div className="mt-6">
                         <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Catatan</h3>
                         <p className="text-base p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg whitespace-pre-wrap">{transaction.notes}</p>
                     </div>
                )}

                {/* Action buttons for Kasir / Admin to update progress only */}
                <ActionButtons transaction={transaction} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                 <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Rincian Item</h2>
                 <div className="overflow-x-auto">
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
                                        {item.itemDetails?.slice(0, item.quantity).some(d => d.note) && (
                                            <div className="pl-4 mt-1 space-y-0.5">
                                                {item.itemDetails?.slice(0, item.quantity).map((detail, detailIndex) => detail.note && (
                                                    <p key={detailIndex} className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                                        - Item #{detailIndex + 1}: {detail.note}
                                                    </p>
                                                ))}
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
                                    <td className="px-4 py-3 text-center">{item.quantity} {item.unit}</td>
                                    <td className="px-4 py-3 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>

                 <div className="w-full md:w-1/2 lg:w-1/3 ml-auto mt-6 space-y-2">
                    <DetailItem label="Subtotal" value={`Rp ${transaction.subtotal.toLocaleString('id-ID')}`} />
                     {transaction.discount > 0 && (
                        <DetailItem label="Diskon" value={`- Rp ${transaction.discount.toLocaleString('id-ID')}`} className="!text-red-600 dark:!text-red-400" />
                    )}
                    {transaction.tax > 0 && (
                        <DetailItem label="Pajak" value={`+ Rp ${transaction.tax.toLocaleString('id-ID')}`} />
                    )}
                    <DetailItem label="Grand Total" value={`Rp ${transaction.total.toLocaleString('id-ID')}`} className="text-xl font-bold border-t dark:border-slate-700 pt-3 !text-slate-900 dark:!text-white" />
                 </div>
            </div>
        </div>
    );
};

export default TransactionDetailPage;

const ActionButtons: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const { currentUser } = useAppContext();
    const { addToast, updateToast } = useToasts();
    const { updateTransaction } = useTransactions();
    const [loading, setLoading] = React.useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);

    const isKasir = currentUser?.role === 'Kasir';
    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin';

    if (!isKasir && !isAdmin) return null;

    // Open payment modal
    function handleOpenPaymentModal() {
        setIsPaymentOpen(true);
    }

    async function onSavePayment(updatedTransaction: Transaction) {
        setLoading(true);
        const toastId = addToast('Menyimpan pembayaran...', 'info');
        try {
            await updateTransaction(transaction.id, {
                amountPaid: updatedTransaction.amountPaid,
                change: updatedTransaction.change,
                paymentMethod: updatedTransaction.paymentMethod ?? null,
                paymentStatus: updatedTransaction.paymentStatus ?? null
            });
            updateToast(toastId, 'Status pembayaran diperbarui', 'success');
        } catch (err: any) {
            updateToast(toastId, err?.message ?? 'Gagal memperbarui status pembayaran', 'error');
            throw err;
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
        } catch (err: any) {
            updateToast(toastId, err?.message ?? 'Gagal memperbarui status pesanan', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkCompleted() {
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
        <div className="mt-6 flex gap-3 relative">
            {loading && (
                <div className="absolute inset-0 z-50 bg-white/60 dark:bg-black/50 rounded-md flex items-center justify-center">
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <span className="text-base font-medium text-slate-900 dark:text-white">Memproses...</span>
                    </div>
                </div>
            )}
            <button disabled={loading} onClick={handleOpenPaymentModal} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">Bayar</button>
            <button disabled={loading} onClick={handleMarkReady} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md">Tandai Siap Ambil</button>
            <button disabled={loading} onClick={handleMarkCompleted} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">Tandai Selesai</button>
            {isAdmin && (
                <Link to={`/transactions/${transaction.id}/edit`} className="ml-auto inline-block text-sm text-slate-700 dark:text-slate-200 hover:underline">Edit Items</Link>
            )}

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                transaction={transaction}
                onSave={onSavePayment}
                disabled={loading}
            />
        </div>
    );
};