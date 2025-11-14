import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UsersIcon, ShoppingCartIcon, PlusCircleIcon } from './icons';
type NavItemProps = {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full text-center transition-colors duration-200 ${
          isActive
            ? 'text-brand-blue-600 dark:text-brand-blue-300'
            : 'text-slate-500 dark:text-slate-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400'
        }`
      }
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-medium tracking-tight">{label}</span>
    </NavLink>
  );
}

function BottomNavBar() {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-slate-200 dark:bg-slate-800 dark:border-slate-700 sm:hidden">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        <NavItem to="/" icon={HomeIcon} label="Dashboard" />
        <NavItem to="/transactions" icon={ShoppingCartIcon} label="Transaksi" />
        <NavItem to="/transactions/new" icon={PlusCircleIcon} label="Tambah" />
        <NavItem to="/management/customers" icon={UsersIcon} label="Pelanggan" />
      </div>
    </div>
  );
}

export default BottomNavBar;
