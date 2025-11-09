import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../types';

interface HeaderProps {
  pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ pageTitle }) => {
  const { userRole, setUserRole } = useAppContext();

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setUserRole(event.target.value as UserRole);
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm p-4 sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-white">{pageTitle}</h1>
        <div className="flex items-center space-x-4">
          <span className="text-base text-slate-600 dark:text-slate-300">Logged in as:</span>
           {/* This is a simple role switcher for demo purposes */}
          <select 
            value={userRole} 
            onChange={handleRoleChange} 
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option value={UserRole.Admin}>Admin</option>
            <option value={UserRole.Cashier}>Cashier</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;