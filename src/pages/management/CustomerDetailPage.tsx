import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UsersIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  ChevronLeftIcon,
  HistoryIcon,
} from '../../components/icons';
import { fetchCustomers } from '../../contexts/CustomerContext';
import { useQuery } from '@tanstack/react-query';
import { useTransactions } from '../../contexts/TransactionContext';
import { OrderStatus, PaymentStatus } from '@/types';
import { getStatusBadge, getPaymentStatusBadge } from '@/utils/uiHelpers';

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });
  const { transactions } = useTransactions();
  const customer = customers.find((c) => c.id === id);
  const customerTransactions = transactions.filter((t) => t.customerId === id);

  if (!customer) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400">
        <p>Pelanggan tidak ditemukan.</p>
        <Link
          to="/management/customers"
          className="text-blue-600 hover:underline dark:text-blue-400 mt-4 inline-block"
        >
          Kembali ke Daftar Pelanggan
        </Link>
      </div>
    );
  }

  const totalSpent = customerTransactions.reduce((sum, t) => sum + t.total, 0);
  const avgTransactionValue =
    customerTransactions.length > 0 ? totalSpent / customerTransactions.length : 0;

  const sortedTransactions = [...customerTransactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const mostRecentTransaction = sortedTransactions.length > 0 ? sortedTransactions[0] : null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Processing:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      // ...existing code...
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/management/customers"
        className="flex items-center text-base text-blue-600 hover:underline dark:text-blue-400 mb-2"
      >
        <ChevronLeftIcon className="w-4 h-4 mr-1" />
        Kembali ke Daftar Pelanggan
      </Link>

      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-shrink-0 w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <UsersIcon className="w-10 h-10 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">{customer.phone}</p>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1">{customer.address}</p>
          </div>
        </div>
        {customer.notes && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 rounded-r-lg">
            <p className="text-base font-medium">Catatan:</p>
            <p className="text-base">{customer.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center space-x-3">
          <DollarSignIcon className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-base text-slate-500 dark:text-slate-400">Total Belanja</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              Rp {totalSpent.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center space-x-3">
          <ShoppingCartIcon className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-base text-slate-500 dark:text-slate-400">Jumlah Transaksi</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {customerTransactions.length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center space-x-3">
          <DollarSignIcon className="w-8 h-8 text-yellow-500" />
          <div>
            <p className="text-base text-slate-500 dark:text-slate-400">Rata-rata Transaksi</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              Rp {avgTransactionValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {mostRecentTransaction && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <HistoryIcon className="w-6 h-6 mr-3 text-slate-500" />
            Transaksi Terakhir
          </h2>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg space-y-2 border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-600 dark:text-slate-400">ID Transaksi:</span>
              <Link
                to={`/transactions/${mostRecentTransaction.id}/receipt`}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {mostRecentTransaction.id}
              </Link>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-600 dark:text-slate-400">Tanggal:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {new Date(mostRecentTransaction.createdAt).toLocaleDateString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-600 dark:text-slate-400">Total:</span>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                Rp {mostRecentTransaction.total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Riwayat Transaksi
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">ID Transaksi</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status Pesanan</th>
                <th className="px-4 py-3">Status Bayar</th>
              </tr>
            </thead>
            <tbody>
              {customerTransactions.length > 0 ? (
                sortedTransactions.map((t) => (
                  <tr key={t.id} className="border-b dark:border-slate-700">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                    <td className="px-4 py-3">
                      {new Date(t.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right">Rp {t.total.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(t.orderStatus)}`}
                      >
                        {t.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-sm font-medium rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}
                      >
                        {t.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500 dark:text-slate-400">
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
