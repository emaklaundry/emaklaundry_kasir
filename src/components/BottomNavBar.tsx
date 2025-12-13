import * as React from 'react';
import { NavLink } from 'react-router-dom';
import useAppContext from '../contexts/useAppContext';
import { UserRole } from '../types';
import { HomeIcon, UsersIcon, ShoppingCartIcon, BarChartIcon, BoltIcon } from './icons';

const NavItem: React.FC<{
  to: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  disabled?: boolean;
}> = ({ to, icon: Icon, label, disabled = false }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }: { isActive: boolean }) =>
      `flex flex-col items-center justify-center w-full h-full text-center transition-colors duration-200 touch-target ${
        isActive
          ? 'text-brand-blue-600 dark:text-brand-blue-300'
          : 'text-slate-500 dark:text-slate-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`
    }
    tabIndex={disabled ? -1 : 0}
    aria-disabled={disabled}
  >
    <Icon className="w-7 h-7 mb-0.5" />
    <span className="text-[11px] font-medium tracking-tight leading-tight">{label}</span>
  </NavLink>
);

const BottomNavBar: React.FC = () => {
  const { currentUser } = useAppContext();
  // Robust role check (case-insensitive)
  const isCashier = currentUser && currentUser.role === UserRole.Cashier;

  // Hanya menu yang boleh diakses kasir
  if (isCashier) {
    return (
      <div className="fixed bottom-0 left-0 z-50 w-full h-[72px] bg-white border-t-2 border-slate-200 dark:bg-slate-800 dark:border-slate-700 sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
          <NavItem to="/" icon={HomeIcon} label="Dashboard" />
          <NavItem to="/quick-actions" icon={BoltIcon} label="Aksi Cepat" />
          <NavItem to="/transactions" icon={ShoppingCartIcon} label="Transaksi" />
        </div>
      </div>
    );
  }

  // Menu untuk admin/superadmin
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-[72px] bg-white border-t-2 border-slate-200 dark:bg-slate-800 dark:border-slate-700 sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        <NavItem to="/" icon={HomeIcon} label="Dashboard" />
        <NavItem to="/quick-actions" icon={BoltIcon} label="Aksi Cepat" />
        <NavItem to="/transactions" icon={ShoppingCartIcon} label="Transaksi" />
        <NavItem to="/management/customers" icon={UsersIcon} label="Pelanggan" />
        <NavItem to="/reports" icon={BarChartIcon} label="Laporan" />
      </div>
    </div>
  );
};

export default BottomNavBar;
