import * as React from 'react';
import useAppContext from '../../contexts/useAppContext';
import useTheme from '../../hooks/useTheme';
import useCommandPalette from '../../hooks/useCommandPalette';
import {
  SunIcon,
  MoonIcon,
  KeyIcon,
  MenuIcon,
  LogOutIcon,
  SearchIcon,
  ChevronDownIcon,
} from '../icons';
import { UserRole } from '@/types';
import ChangePasswordModal from '../ChangePasswordModal';

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

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

  return isOnline;
};

const isMacPlatform = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

const getInitials = (name?: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const iconButtonClass =
  'inline-flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 touch-target';

const menuItemClass =
  'flex w-full items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-700 transition-colors';

const UserMenu: React.FC<{
  isOnline: boolean;
  storeName?: string;
  onChangePassword: () => void;
}> = ({ isOnline, storeName, onChangePassword }) => {
  const { currentUser, signOut } = useAppContext();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId();

  const close = React.useCallback((restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const handlePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, close]);

  React.useEffect(() => {
    if (isOpen) {
      containerRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }
  }, [isOpen]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    items[(index + delta + items.length) % items.length]?.focus();
  };

  const isDark = theme === 'dark';

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Menu akun ${currentUser?.name ?? ''}`.trim()}
        className="flex items-center gap-2 rounded-full sm:rounded-lg p-0.5 sm:py-1 sm:pl-1 sm:pr-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue-600 text-sm font-semibold text-white">
          {getInitials(currentUser?.name)}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-slate-50 dark:ring-slate-800 ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
            aria-hidden="true"
          />
        </span>
        <span className="hidden lg:flex flex-col items-start leading-tight min-w-0">
          <span className="max-w-[9rem] truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
            {currentUser?.name}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{currentUser?.role}</span>
        </span>
        <ChevronDownIcon
          className={`hidden sm:block h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="Menu akun"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800 z-40"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
              {currentUser?.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentUser?.role}
              {storeName ? ` · ${storeName}` : ''}
            </p>
            <p
              className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium ${
                isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
              />
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>

          <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />

          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? (
              <SunIcon className="h-5 w-5 text-slate-400" />
            ) : (
              <MoonIcon className="h-5 w-5 text-slate-400" />
            )}
            {isDark ? 'Mode Terang' : 'Mode Gelap'}
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => {
              close();
              onChangePassword();
            }}
          >
            <KeyIcon className="h-5 w-5 text-slate-400" />
            Ubah Password
          </button>

          <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />

          <button
            type="button"
            role="menuitem"
            className={`${menuItemClass} !text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/30`}
            onClick={() => {
              close();
              signOut();
            }}
          >
            <LogOutIcon className="h-5 w-5" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
};

const Header: React.FC<{
  pageTitle: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}> = ({ pageTitle, isSidebarOpen = false, onToggleSidebar }) => {
  const { currentUser, stores, selectedStoreId, setSelectedStoreId } = useAppContext();
  const { open: openCommandPalette } = useCommandPalette();
  const isOnline = useOnlineStatus();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);

  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
  const currentStore = stores.find((s) => s.id === currentUser?.storeId);
  const activeStores = stores.filter((s) => s.isActive);
  const shortcutLabel = React.useMemo(() => (isMacPlatform() ? '⌘K' : 'Ctrl K'), []);

  return (
    <>
      <header className="print-hide sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/75 dark:border-slate-700 dark:bg-slate-800/90 dark:supports-[backdrop-filter]:bg-slate-800/75 px-3 sm:px-4 lg:px-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-3 min-h-[2.75rem]">
          {onToggleSidebar && (
            <button
              id="sidebar-toggle"
              type="button"
              onClick={onToggleSidebar}
              className={`${iconButtonClass} -ml-1 shrink-0 text-slate-700 dark:text-slate-200`}
              aria-label={isSidebarOpen ? 'Tutup navigasi samping' : 'Buka navigasi samping'}
              aria-controls="logo-sidebar"
              aria-expanded={isSidebarOpen}
              title={isSidebarOpen ? 'Tutup navigasi samping' : 'Buka navigasi samping'}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="truncate text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
              {pageTitle}
            </h1>
            {!isSuperAdmin && currentStore && (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                Cabang {currentStore.name}
              </p>
            )}
          </div>

          {isSuperAdmin && (
            <div className="order-last w-full sm:order-none sm:w-44 lg:w-52">
              <label htmlFor="store-filter" className="sr-only">
                Filter Cabang
              </label>
              <select
                id="store-filter"
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="form-input text-sm py-2"
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

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {!isOnline && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
              >
                <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                Offline
              </span>
            )}

            <button
              type="button"
              onClick={openCommandPalette}
              className={`${iconButtonClass} md:gap-2 md:border md:border-slate-200 md:bg-white md:pl-3 md:pr-2 md:py-1.5 md:dark:border-slate-600 md:dark:bg-slate-700/60`}
              aria-label="Buka pencarian"
              title={`Pencarian (${shortcutLabel})`}
            >
              <SearchIcon className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline text-sm text-slate-500 dark:text-slate-400 pr-6">
                Cari…
              </span>
              <kbd className="hidden md:inline-flex h-5 items-center rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {shortcutLabel}
              </kbd>
            </button>

            <UserMenu
              isOnline={isOnline}
              storeName={isSuperAdmin ? undefined : currentStore?.name}
              onChangePassword={() => setIsPasswordModalOpen(true)}
            />
          </div>

        </div>
      </header>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};

export default Header;
