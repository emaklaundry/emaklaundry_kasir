import * as React from 'react';
import useAppContext from '../contexts/useAppContext';
import useTheme from '../hooks/useTheme';
import useCommandPalette from '../hooks/useCommandPalette';
import { SunIcon, MoonIcon, CommandIcon } from './icons';
import { UserRole } from '@/types';

const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
        isOnline
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}
      title={isOnline ? 'Koneksi Internet Aktif' : 'Mode Offline'}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
};

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
  const { currentUser, signOut, stores, selectedStoreId, setSelectedStoreId } = useAppContext();
  const { open } = useCommandPalette();

  // Dropdown user dinonaktifkan karena allUsers/setCurrentUser tidak tersedia
  // const handleUserChange = ...

  const currentStore = stores.find((s) => s.id === currentUser.storeId);
  const activeStores = stores.filter((s) => s.isActive);

  return (
    <header className="print-hide bg-slate-50 dark:bg-slate-800 shadow-sm p-2 sm:p-4 sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold text-slate-800 dark:text-white truncate">
          {pageTitle}
        </h1>
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          <ConnectionStatus />
          <button
            onClick={open}
            className="flex items-center gap-1 sm:gap-2 p-2.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 touch-target"
            aria-label="Buka pencarian global"
          >
            <CommandIcon className="w-6 h-6 sm:w-5 sm:h-5" />
            <kbd className="hidden md:inline-flex h-5 items-center justify-center rounded border bg-slate-100 px-1.5 text-xs font-mono font-medium text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              ⌘K
            </kbd>
          </button>
          <ThemeToggleButton />
          {currentUser.role === UserRole.SuperAdmin && (
            <div className="w-32 sm:w-auto">
              <label htmlFor="store-filter" className="sr-only">
                Filter Toko
              </label>
              <select
                id="store-filter"
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm sm:text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 sm:p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white input-mobile"
              >
                <option value="all">Semua Cabang</option>
                {activeStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Dropdown user dinonaktifkan karena allUsers/setCurrentUser tidak tersedia */}
          {/* Info profil user */}
          <div className="hidden sm:flex flex-col items-end mr-2 text-right">
            <span className="font-semibold text-sm md:text-base text-slate-700 dark:text-slate-200">
              {currentUser.name}
            </span>
            <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              {currentUser.role}
            </span>
          </div>
          <button
            onClick={signOut}
            className="px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-colors text-sm sm:text-base font-medium touch-target min-w-[80px] sm:min-w-[90px]"
            aria-label="Logout"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">✕</span>
          </button>
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
