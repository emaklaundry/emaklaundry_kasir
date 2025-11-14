import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
} from './icons';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../../types';

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
  { path: '/settings', label: 'Pengaturan', icon: SettingsIcon, adminOnly: true },
];

const Sidebar: React.FC = () => {
  const { currentUser } = useAppContext();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>(['/management']);

  const toggleMenu = (path: string) => {
    setOpenMenus(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };
  
  const hasAdminAccess = currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.BranchAdmin;
  const isSuperAdmin = currentUser.role === UserRole.SuperAdmin;

  const renderNavLinks = (items: NavItem[]) => {
    return items
      .filter(item => {
        if (item.superAdminOnly && !isSuperAdmin) return false;
        if (item.adminOnly && !hasAdminAccess) return false;
        
        if (item.children) {
            return item.children.some(child => {
                if(child.superAdminOnly && !isSuperAdmin) return false;
                if(child.adminOnly && !hasAdminAccess) return false;
                return true;
            });
        }
        return true;
      })
      .map(item => {
      if (item.children) {
        const isParentActive = location.pathname.startsWith(item.path);
        const isOpen = openMenus.includes(item.path);
        return (
          <li key={item.path}>
            <button
              onClick={() => toggleMenu(item.path)}
              className={`w-full flex items-center p-3 text-lg rounded-lg text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 group ${isParentActive ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
            >
              <item.icon className="w-6 h-6 text-slate-500 transition duration-75 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
              <span className="flex-1 ml-4 text-left whitespace-nowrap">{item.label}</span>
              {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
            {isOpen && (
              <ul className="py-2 space-y-2 pl-4">
                {renderNavLinks(item.children)}
              </ul>
            )}
          </li>
        );
      }
      return (
        <li key={item.path}>
          <NavLink
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center p-3 text-lg rounded-lg text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 group ${isActive ? 'bg-brand-blue-50 dark:bg-slate-700 text-brand-blue-600 dark:text-brand-blue-300 font-semibold' : ''}`
            }
          >
            <item.icon className="w-6 h-6 text-slate-500 transition duration-75 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
            <span className="ml-4">{item.label}</span>
          </NavLink>
        </li>
      );
    });
  };

  return (
    <aside id="logo-sidebar" className="print-hide fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
      <div className="h-full px-3 py-4 overflow-y-auto bg-slate-50 dark:bg-slate-800">
        <NavLink to="/" className="flex items-center pl-2.5 mb-5">
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Laundry POS</span>
        </NavLink>
        <ul className="space-y-2 font-medium">
          {renderNavLinks(navItems)}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;