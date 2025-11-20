import * as React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCustomers } from '../contexts/CustomerContext';
import { useAppContext } from '../contexts/AppContext';
import ToastContainer from './ToastContainer';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import VersionInfo from './VersionInfo';
import { Customer, UserRole } from '@/types';

const getPageTitle = (pathname: string, params: any, customers: Customer[]): string => {
  const staticTitles: { [key: string]: string } = {
    '/': 'Dashboard',
    '/transactions': 'Transaksi',
    '/transactions/new': 'Buat Transaksi Baru',
    '/management/stores': 'Manajemen Cabang',
    '/management/customers': 'Manajemen Pelanggan',
    '/management/services': 'Manajemen Layanan',
    '/management/inventory': 'Manajemen Inventaris',
    '/management/assets': 'Manajemen Aset & Pemeliharaan',
    '/management/expenses': 'Manajemen Pengeluaran',
    '/management/users': 'Manajemen Pengguna',
    '/reports': 'Laporan',
    '/audit-log': 'Log Audit',
    '/settings': 'Pengaturan',
  };

  if (staticTitles[pathname]) {
    return staticTitles[pathname];
  }

  // Perbaikan: Tangani route detail transaksi dengan lebih robust
  if (pathname.startsWith('/transactions/') && pathname !== '/transactions/new') {
    // Coba ambil ID dari params, jika tidak ada (undefined), ambil dari split URL
    // Asumsi format URL: /transactions/:id atau /transactions/:id/details
    const segments = pathname.split('/');
    // segments[0] = "", segments[1] = "transactions", segments[2] = ID
    const transactionId = params.id || segments[2];
    if (transactionId) {
      return `Detail Transaksi: ${transactionId}`;
    }
  }

  if (pathname.startsWith('/management/customers/')) {
    // Sama, fallback ke URL jika params.id undefined
    const customerId = params.id || pathname.split('/').pop();
    const customer = customers.find((c) => c.id === customerId);
    return customer ? `Detail Pelanggan: ${customer.name}` : 'Detail Pelanggan';
  }

  return 'Laundry POS';
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const params = useParams();
  const { data: customersRaw = [] } = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });
  // Normalize customers to always be an array
  const customers = Array.isArray(customersRaw)
    ? customersRaw
    : (customersRaw?.data ?? []);
  const { currentUser } = useAppContext();
  const pageTitle = getPageTitle(location.pathname, params, customers);
  const isCashier = currentUser.role === UserRole.Cashier;

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen flex flex-col">
      <Sidebar />
      <div className="sm:ml-64 flex-1 flex flex-col">
        <Header pageTitle={pageTitle} />
        <main
          className={`p-4 md:p-6 flex-1 ${isCashier ? 'pb-24 sm:pb-6' : ''} print-main-content`}
        >
          {children}
        </main>
        <VersionInfo />
      </div>
      {isCashier && <BottomNavBar />}
      <ToastContainer />
    </div>
  );
};

export default Layout;
