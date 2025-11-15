import * as React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { fetchCustomers } from '../contexts/CustomerContext';
import { useQuery } from '@tanstack/react-query';
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

  if (pathname.startsWith('/transactions/') && pathname.endsWith('/details')) {
    return `Detail Transaksi: ${params.id}`;
  }

  if (pathname.startsWith('/management/customers/')) {
    const customer = customers.find((c) => c.id === params.id);
    return customer ? `Detail Pelanggan: ${customer.name}` : 'Detail Pelanggan';
  }

  return 'Laundry POS';
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const params = useParams();
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });
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
