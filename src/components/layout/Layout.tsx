import * as React from 'react';
import { useLocation } from 'react-router-dom';
import ToastContainer from '../ToastContainer';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';

const getPageTitle = (pathname: string): string => {
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
    '/management/users': 'Akun Login',
    '/management/employees': 'Manajemen Karyawan',
    '/management/attendance': 'Absensi',
    '/reports': 'Laporan',
    '/audit-log': 'Log Audit',
    '/quick-actions': 'Aksi Cepat',
    '/management/settings': 'Pengaturan',
    '/management/backup': 'Backup & Restore',
    '/management/sop': 'SOP Operasional',
    '/business/calculator': 'Kalkulator Bisnis',
    '/help': 'Bantuan & Tutorial',
    '/business': 'Pusat Bisnis',
  };

  if (staticTitles[pathname]) {
    return staticTitles[pathname];
  }

  if (/^\/transactions\/[^/]+\/receipt$/.test(pathname)) {
    return 'Struk Transaksi';
  }

  if (pathname.startsWith('/transactions/') && pathname !== '/transactions/new') {
    return 'Detail Transaksi';
  }

  if (pathname.startsWith('/management/customers/')) {
    return 'Detail Pelanggan';
  }

  return 'Laundry POS';
};

import Tutorial from '../features/Tutorial';

/** Lebar minimum (Tailwind `lg`) agar sidebar tetap terbuka di samping konten. Di bawahnya sidebar menjadi laci. */
const SIDEBAR_PINNED_MIN_WIDTH = 1024;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
    return typeof window === 'undefined' ? true : window.innerWidth >= SIDEBAR_PINNED_MIN_WIDTH;
  });
  const previousPath = React.useRef(location.pathname);

  React.useEffect(() => {
    const desktopMedia = window.matchMedia(`(min-width: ${SIDEBAR_PINNED_MIN_WIDTH}px)`);
    const syncSidebarWithViewport = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsSidebarOpen(event.matches);
    };

    syncSidebarWithViewport(desktopMedia);
    desktopMedia.addEventListener('change', syncSidebarWithViewport);
    return () => desktopMedia.removeEventListener('change', syncSidebarWithViewport);
  }, []);

  React.useEffect(() => {
    const hasNavigated = previousPath.current !== location.pathname;
    previousPath.current = location.pathname;

    if (window.innerWidth < SIDEBAR_PINNED_MIN_WIDTH) {
      setIsSidebarOpen(false);
      if (hasNavigated) {
        window.requestAnimationFrame(() => document.getElementById('main-content')?.focus());
      }
    }
  }, [location.pathname]);

  const handleSidebarToggle = () => {
    // Di desktop tombol tutup sidebar disembunyikan, jadi fokus tetap di tombol menu header.
    const isDrawer = window.innerWidth < SIDEBAR_PINNED_MIN_WIDTH;
    const focusTarget = isSidebarOpen || !isDrawer ? 'sidebar-toggle' : 'sidebar-close';
    window.requestAnimationFrame(() => document.getElementById(focusTarget)?.focus());
    setIsSidebarOpen((open) => !open);
  };

  const pageTitle = getPageTitle(location.pathname);

  React.useEffect(() => {
    document.title = `${pageTitle} | Laundry POS`;
  }, [pageTitle]);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 focus:shadow-lg"
      >
        Lewati ke konten utama
      </a>
      <Tutorial />
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? 'ml-0 lg:ml-64' : 'ml-0'
        }`}
      >
        <Header
          pageTitle={pageTitle}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleSidebarToggle}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className={`p-3 sm:p-4 md:p-6 flex-1 min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-6 print-main-content`}
        >
          <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
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
