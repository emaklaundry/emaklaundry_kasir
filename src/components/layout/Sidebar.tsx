import React, { useLayoutEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAppContext from '../../contexts/useAppContext';
import {
  HomeIcon,
  ShoppingCartIcon,
  PackageIcon,
  UsersIcon,
  BarChartIcon,
  SettingsIcon,
  WrenchIcon,
  DollarSignIcon,
  HistoryIcon,
  TruckIcon,
  ChevronLeftIcon,
  DatabaseIcon,
  BookOpenIcon,
  HelpCircleIcon,
  ArrowTrendingUpIcon,
  CalculatorIcon,
  FileTextIcon,
} from '../icons';
import { useTutorial } from '../../hooks/useTutorial';
import { UserRole } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

interface NavSection {
  /** Judul kelompok; kosong untuk menu utama di paling atas. */
  title?: string;
  items: NavItem[];
}

// Urutan: kerja harian -> data master -> operasional -> SDM -> analisis -> sistem -> panduan.
const navSections: NavSection[] = [
  {
    items: [
      { path: '/', label: 'Dashboard', icon: HomeIcon },
      { path: '/transactions', label: 'Transaksi', icon: ShoppingCartIcon },
    ],
  },
  {
    title: 'Data Master',
    items: [
      { path: '/management/customers', label: 'Pelanggan', icon: UsersIcon, adminOnly: true },
      { path: '/management/services', label: 'Layanan', icon: PackageIcon, adminOnly: true },
    ],
  },
  {
    title: 'Operasional',
    items: [
      { path: '/management/inventory', label: 'Inventaris', icon: PackageIcon, adminOnly: true },
      {
        path: '/management/assets',
        label: 'Aset & Pemeliharaan',
        icon: WrenchIcon,
        adminOnly: true,
      },
      {
        path: '/management/expenses',
        label: 'Pengeluaran',
        icon: DollarSignIcon,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'SDM',
    items: [
      { path: '/management/employees', label: 'Karyawan', icon: UsersIcon, adminOnly: true },
      { path: '/management/attendance', label: 'Absensi', icon: HistoryIcon, adminOnly: true },
    ],
  },
  {
    title: 'Analisis',
    items: [
      { path: '/reports', label: 'Laporan', icon: BarChartIcon, adminOnly: true },
      { path: '/audit-log', label: 'Log Audit', icon: HistoryIcon, adminOnly: true },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { path: '/management/stores', label: 'Cabang', icon: TruckIcon, superAdminOnly: true },
      { path: '/management/users', label: 'Pengguna', icon: UsersIcon, adminOnly: true },
      { path: '/settings', label: 'Pengaturan', icon: SettingsIcon, adminOnly: true },
      {
        path: '/management/backup',
        label: 'Backup & Restore',
        icon: DatabaseIcon,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'Panduan',
    items: [
      { path: '/management/sop', label: 'SOP (Prosedur)', icon: FileTextIcon, adminOnly: true },
      { path: '/docs', label: 'Dokumentasi', icon: BookOpenIcon },
      { path: '/business-guide', label: 'Panduan Bisnis', icon: ArrowTrendingUpIcon },
      { path: '/business/calculator', label: 'Kalkulator Bisnis', icon: CalculatorIcon },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { currentUser } = useAppContext();
  const { startTour } = useTutorial();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (sidebarRef.current) sidebarRef.current.inert = !isOpen;
  }, [isOpen]);

  const hasAdminAccess =
    currentUser?.role === UserRole.SuperAdmin || currentUser?.role === UserRole.Admin;
  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

  const canSee = (item: NavItem) =>
    !(item.superAdminOnly && !isSuperAdmin) && !(item.adminOnly && !hasAdminAccess);

  const renderNavLink = (item: NavItem) => (
    <li key={item.path}>
      <NavLink
        to={item.path}
        end={item.path === '/'}
        className={({ isActive }) =>
          `flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors duration-200 group ${
            isActive
              ? 'bg-brand-blue-600 dark:bg-brand-blue-600 text-white shadow-md shadow-brand-blue-500/30'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`
        }
      >
        <item.icon className="w-5 h-5 shrink-0" />
        <span className="ml-3 font-medium truncate">{item.label}</span>
      </NavLink>
    </li>
  );

  const visibleSections = navSections
    .map((section) => ({ ...section, items: section.items.filter(canSee) }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        id="logo-sidebar"
        className={`print-hide fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
        aria-hidden={!isOpen}
      >
        <div className="h-full px-3 py-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Header dengan toggle button */}
          <div className="flex items-center justify-between mb-6">
            <NavLink to="/" className="flex items-center group">
              <span className="self-center text-2xl font-bold bg-gradient-to-r from-brand-blue-600 to-brand-blue-400 bg-clip-text text-transparent dark:from-brand-blue-400 dark:to-brand-blue-300">
                Laundry POS
              </span>
            </NavLink>
            <button
              id="sidebar-close"
              onClick={onToggle}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-target"
              aria-label="Tutup navigasi"
              title="Tutup navigasi"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          </div>

          <nav aria-label="Navigasi samping" className="flex-1">
            {visibleSections.map((section, index) => {
              const headingId = section.title
                ? `sidebar-section-${section.title.toLowerCase().replace(/\W+/g, '-')}`
                : undefined;
              return (
                <div key={section.title ?? 'utama'} className={index > 0 ? 'mt-5' : undefined}>
                  {section.title && (
                    <h3
                      id={headingId}
                      className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      {section.title}
                    </h3>
                  )}
                  <ul className="space-y-1" aria-labelledby={headingId}>
                    {section.items.map(renderNavLink)}
                  </ul>
                </div>
              );
            })}
          </nav>

          {/* Tutorial Button */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                if (location.pathname === '/' || location.pathname === '/dashboard') {
                  startTour('dashboard');
                } else if (location.pathname === '/transactions/new') {
                  startTour('new_transaction');
                } else if (location.pathname === '/transactions') {
                  startTour('transaction_list');
                } else if (location.pathname === '/management/employees') {
                  startTour('employees');
                } else {
                  // Fallback to dashboard tour if on other pages
                  startTour('dashboard');
                }
                if (window.innerWidth < 1024) onToggle(); // Tutup laci di mobile & tablet
              }}
              className="w-full flex items-center p-3 text-base rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group"
            >
              <HelpCircleIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-brand-blue-600 dark:group-hover:text-brand-blue-400 transition-colors" />
              <span className="ml-3 font-medium">Bantuan / Tutorial</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
