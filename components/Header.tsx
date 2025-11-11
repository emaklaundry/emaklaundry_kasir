


import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../types';
import { useTheme, Theme } from '../hooks/useTheme';
import { SunIcon, MoonIcon, CommandIcon } from './icons';
import { useCommandPalette } from '../hooks/useCommandPalette';

const ThemeToggleButton: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 dark:focus:ring-offset-slate-800"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
        </button>
    );
};


const Header: React.FC<{ pageTitle: string }> = ({ pageTitle }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    allUsers, 
    stores, 
    selectedStoreId, 
    setSelectedStoreId 
  } = useAppContext();
  const { open } = useCommandPalette();


  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUser = allUsers.find(u => u.id === parseInt(event.target.value, 10));
    if (selectedUser) {
      setCurrentUser(selectedUser);
    }
  };

  const currentStore = stores.find(s => s.id === currentUser.storeId);
  const activeStores = stores.filter(s => s.isActive);

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm p-4 sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-white">{pageTitle}</h1>
        <div className="flex items-center space-x-2 sm:space-x-4">
           <button 
                onClick={open}
                className="flex items-center gap-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Buka pencarian global"
            >
                <CommandIcon className="w-5 h-5" />
                <kbd className="hidden md:inline-flex h-5 items-center justify-center rounded border bg-slate-100 px-1.5 text-xs font-mono font-medium text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    ⌘K
                </kbd>
            </button>
          <ThemeToggleButton />
          {currentUser.role === UserRole.SuperAdmin && (
            <div>
              <label htmlFor="store-filter" className="sr-only">Filter Toko</label>
              <select 
                id="store-filter"
                value={selectedStoreId} 
                onChange={e => setSelectedStoreId(e.target.value)} 
                className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="all">Semua Cabang</option>
                {activeStores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center">
             <span className="hidden sm:inline text-base text-slate-600 dark:text-slate-300 mr-2">Login sebagai:</span>
            <select 
              value={currentUser.id} 
              onChange={handleUserChange} 
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            >
              {allUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
        </div>
      </div>
       {currentUser.role !== UserRole.SuperAdmin && currentStore && (
         <div className="text-right text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cabang: {currentStore.name}
         </div>
       )}
    </header>
  );
};

export default Header;