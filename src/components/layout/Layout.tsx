import * as React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCustomers } from '../../contexts/CustomerContext';
import ToastContainer from '../ToastContainer';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import { Customer } from '@/types';

const getPageTitle = (
  pathname: string,
  params: Record<string, string | undefined>,
  customers: Customer[],
): string => {
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
    return 'Detail Transaksi';
  }

  if (pathname.startsWith('/management/customers/')) {
    // Sama, fallback ke URL jika params.id undefined
    const customerId = params.id || pathname.split('/').pop();
    const customer = customers.find((c) => c.id === customerId);
    return customer ? `Detail Pelanggan: ${customer.name}` : 'Detail Pelanggan';
  }

  return 'Laundry POS';
};

import Tutorial from '../features/Tutorial';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const params = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
    return typeof window === 'undefined' ? true : window.innerWidth >= 640;
  });

  React.useEffect(() => {
    const desktopMedia = window.matchMedia('(min-width: 640px)');
    const syncSidebarWithViewport = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsSidebarOpen(event.matches);
    };

    syncSidebarWithViewport(desktopMedia);
    desktopMedia.addEventListener('change', syncSidebarWithViewport);
    return () => desktopMedia.removeEventListener('change', syncSidebarWithViewport);
  }, []);

  React.useEffect(() => {
    if (window.innerWidth < 640) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const { data: customersRaw = [] } = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });
  // Normalize customers to always be an array
  const customers = Array.isArray(customersRaw) ? customersRaw : (customersRaw?.data ?? []);
  const pageTitle = getPageTitle(location.pathname, params, customers);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen flex flex-col">
      <Tutorial />
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'ml-0 sm:ml-64' : 'ml-0'
        }`}
      >
        <Header pageTitle={pageTitle} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className={`p-2 sm:p-4 md:p-6 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-6 print-main-content`}>
          {children}
        </main>
        <footer className="print-hide bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-2 sm:py-3 px-4 text-center hidden sm:block">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Laundry Management System. Developed by{' '}
            <a
              href="https://novionics.web.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Novionics
            </a>
          </p>
        </footer>
      </div>
      <BottomNavBar />
      <ToastContainer />
    </div>
  );
};

export default Layout;
