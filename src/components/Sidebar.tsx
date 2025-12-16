import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAppContext from '../contexts/useAppContext';
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
  ChevronDownIcon,
  ChevronUpIcon,
  TruckIcon,
  ChevronLeftIcon,
  DatabaseIcon,
} from './icons';
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
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/transactions', label: 'Transaksi', icon: ShoppingCartIcon },
  {
    path: '/management',
    label: 'Manajemen',
    icon: PackageIcon,
    adminOnly: true,
    children: [
      { path: '/management/stores', label: 'Cabang', icon: TruckIcon, superAdminOnly: true },
      { path: '/management/customers', label: 'Pelanggan', icon: UsersIcon },
      { path: '/management/services', label: 'Layanan', icon: PackageIcon },
      { path: '/management/inventory', label: 'Inventaris', icon: WrenchIcon },
      { path: '/management/assets', label: 'Aset & Pemeliharaan', icon: WrenchIcon },
      { path: '/management/expenses', label: 'Pengeluaran', icon: DollarSignIcon },
      { path: '/management/users', label: 'Pengguna', icon: UsersIcon },
    ],
  },
  { path: '/reports', label: 'Laporan', icon: BarChartIcon, adminOnly: true },
  { path: '/audit-log', label: 'Log Audit', icon: HistoryIcon, adminOnly: true },
  { path: '/management/backup', label: 'Backup & Restore', icon: DatabaseIcon, adminOnly: true },
  { path: '/settings', label: 'Pengaturan', icon: SettingsIcon, adminOnly: true },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { currentUser } = useAppContext();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>(['/management']);

  const toggleMenu = (path: string) => {
    setOpenMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const hasAdminAccess =
    currentUser?.role === UserRole.SuperAdmin || currentUser?.role === UserRole.Admin;
  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

  const renderNavLinks = (items: NavItem[]) => {
    return items
      .filter((item) => {
        if (item.superAdminOnly && !isSuperAdmin) return false;
        if (item.adminOnly && !hasAdminAccess) return false;

        if (item.children) {
          return item.children.some((child) => {
            if (child.superAdminOnly && !isSuperAdmin) return false;
            if (child.adminOnly && !hasAdminAccess) return false;
            return true;
          });
        }
        return true;
      })
      .map((item) => {
        if (item.children) {
          const isParentActive = location.pathname.startsWith(item.path);
          const isOpen = openMenus.includes(item.path);
          return (
            <li key={item.path}>
              <button
                onClick={() => toggleMenu(item.path)}
                className={`w-full flex items-center p-3 text-base rounded-lg transition-all duration-200 group ${
                  isParentActive
                    ? 'bg-brand-blue-50 dark:bg-slate-700 text-brand-blue-700 dark:text-brand-blue-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-all duration-200 ${
                  isParentActive
                    ? 'text-brand-blue-600 dark:text-brand-blue-400'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-blue-600 dark:group-hover:text-brand-blue-400'
                }`} />
                <span className="flex-1 ml-3 text-left whitespace-nowrap font-medium">{item.label}</span>
                {isOpen ? (
                  <ChevronUpIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                )}
              </button>
              {isOpen && <ul className="mt-2 space-y-1 pl-3 border-l-2 border-slate-200 dark:border-slate-700">{renderNavLinks(item.children)}</ul>}
            </li>
          );
        }
        return (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center p-3 text-base rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-blue-600 dark:bg-brand-blue-600 text-white shadow-lg shadow-brand-blue-500/30'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:pl-4'
                }`
              }
            >
              <item.icon className={`w-5 h-5 transition-all duration-200 ${
                'group-[.active]:text-white'
              }`} />
              <span className="ml-3 font-medium">{item.label}</span>
            </NavLink>
          </li>
        );
      });
  };

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 sm:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      
      <aside
        id="logo-sidebar"
        className={`print-hide fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Header dengan toggle button */}
          <div className="flex items-center justify-between mb-6">
            <NavLink to="/" className="flex items-center group">
              <span className="self-center text-2xl font-bold bg-gradient-to-r from-brand-blue-600 to-brand-blue-400 bg-clip-text text-transparent dark:from-brand-blue-400 dark:to-brand-blue-300">
                Laundry POS
              </span>
            </NavLink>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors hidden sm:block"
              aria-label="Toggle Sidebar"
              title="Sembunyikan Sidebar"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          </div>
          
          <ul className="space-y-2 font-medium flex-1">{renderNavLinks(navItems)}</ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
