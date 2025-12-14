import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useDebounce from '@/hooks/useDebounce';
import {
  HomeIcon,
  ShoppingCartIcon,
  PlusCircleIcon,
  PackageIcon,
  UsersIcon,
  BarChartIcon,
  SettingsIcon,
  TruckIcon,
  WrenchIcon,
  DollarSignIcon,
  HistoryIcon,
  SearchIcon,
} from './icons';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { fetchCustomers } from '@/contexts/CustomerContext';

interface Command {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
  section: string;
  action: () => void;
  keywords?: string;
  path?: string;
}

const CommandPalette: React.FC = () => {
  const { isOpen, close } = useCommandPalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const customersQuery = useQuery({
    queryKey: ['customers', { searchTerm: debouncedQuery }],
    queryFn: async () => {
      if (!debouncedQuery) return { data: [], count: 0 };
      return fetchCustomers({ searchTerm: debouncedQuery });
    },
    enabled: !!debouncedQuery,
    staleTime: 1000 * 60,
  });
  const customers = useMemo(() => {
    return Array.isArray(customersQuery.data)
      ? customersQuery.data
      : (customersQuery.data?.data ?? []);
  }, [customersQuery.data]);

  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const allCommands = useMemo(() => {
    const baseCommands: Omit<Command, 'id' | 'action'>[] = [
      { title: 'Dashboard', icon: HomeIcon, section: 'Navigasi', path: '/' },
      {
        title: 'Daftar Transaksi',
        icon: ShoppingCartIcon,
        section: 'Navigasi',
        keywords: 'list',
        path: '/transactions',
      },
      {
        title: 'Buat Transaksi Baru',
        icon: PlusCircleIcon,
        section: 'Navigasi',
        keywords: 'new add',
        path: '/transactions/new',
      },
      {
        title: 'Manajemen Pelanggan',
        icon: UsersIcon,
        section: 'Navigasi',
        keywords: 'customer',
        path: '/management/customers',
      },
      {
        title: 'Manajemen Layanan',
        icon: PackageIcon,
        section: 'Navigasi',
        keywords: 'service',
        path: '/management/services',
      },
      {
        title: 'Manajemen Inventaris',
        icon: WrenchIcon,
        section: 'Navigasi',
        keywords: 'inventory',
        path: '/management/inventory',
      },
      {
        title: 'Manajemen Aset',
        icon: WrenchIcon,
        section: 'Navigasi',
        keywords: 'asset maintenance',
        path: '/management/assets',
      },
      {
        title: 'Manajemen Pengeluaran',
        icon: DollarSignIcon,
        section: 'Navigasi',
        keywords: 'expense',
        path: '/management/expenses',
      },
      {
        title: 'Manajemen Pengguna',
        icon: UsersIcon,
        section: 'Navigasi',
        keywords: 'user',
        path: '/management/users',
      },
      {
        title: 'Manajemen Cabang',
        icon: TruckIcon,
        section: 'Navigasi',
        keywords: 'store',
        path: '/management/stores',
      },
      {
        title: 'Laporan',
        icon: BarChartIcon,
        section: 'Navigasi',
        keywords: 'report',
        path: '/reports',
      },
      {
        title: 'Log Audit',
        icon: HistoryIcon,
        section: 'Navigasi',
        keywords: 'audit log',
        path: '/audit-log',
      },
      {
        title: 'Pengaturan',
        icon: SettingsIcon,
        section: 'Navigasi',
        keywords: 'setting',
        path: '/settings',
      },
    ];

    const navigationCommands: Command[] = baseCommands.map((cmd) => ({
      ...cmd,
      id: `nav-${cmd.path}`,
      action: () => navigate(cmd.path!),
    }));

    const customerCommands: Command[] = customers.map((customer) => ({
      id: `cust-${customer.id}`,
      title: customer.name,
      icon: UsersIcon,
      section: 'Pelanggan',
      keywords: customer.phone,
      action: () => navigate(`/management/customers/${customer.id}`),
    }));

    return [...navigationCommands, ...customerCommands];
  }, [customers, navigate]);

  const filteredCommands = useMemo(() => {
    if (!query) return [];
    const lowerCaseQuery = query.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(lowerCaseQuery) ||
        cmd.keywords?.toLowerCase().includes(lowerCaseQuery),
    );
  }, [query, allCommands]);

  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce(
      (acc, cmd) => {
        if (!acc[cmd.section]) {
          acc[cmd.section] = [];
        }
        acc[cmd.section].push(cmd);
        return acc;
      },
      {} as Record<string, Command[]>,
    );
  }, [filteredCommands]);

  useEffect(() => {
    if (isOpen) {
      // Hindari cascading render: gunakan flushSync jika perlu, atau debounce
      setTimeout(() => {
        setQuery('');
        setActiveIndex(0);
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    // Hindari cascading render: gunakan flushSync jika perlu, atau debounce
    setTimeout(() => setActiveIndex(0), 0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[activeIndex]) {
          filteredCommands[activeIndex].action();
          close();
        }
      } else if (e.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, close]);

  useEffect(() => {
    document.getElementById(`command-item-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black bg-opacity-60"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl mx-4 bg-white rounded-lg shadow-2xl dark:bg-slate-800 ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <SearchIcon className="w-5 h-5 text-slate-400 mr-3" />
          <label htmlFor="command-palette-search" className="sr-only">
            Cari Perintah
          </label>
          <input
            ref={inputRef}
            id="command-palette-search"
            name="command-palette-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik perintah atau cari..."
            className="w-full bg-transparent border-none focus:ring-0 text-lg text-slate-800 dark:text-slate-200 placeholder-slate-400"
            autoComplete="off"
          />
        </div>
        <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-2">
          {query &&
            Object.entries(groupedCommands).map(([section, commands]: [string, Command[]]) => (
              <div key={section} className="mb-2">
                <h3 className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {section}
                </h3>
                <ul>
                  {commands.map((cmd) => {
                    const globalIndex = filteredCommands.findIndex((fc) => fc.id === cmd.id);
                    return (
                      <li key={cmd.id} id={`command-item-${globalIndex}`}>
                        <button
                          onClick={() => {
                            cmd.action();
                            close();
                          }}
                          className={`w-full flex items-center text-left px-3 py-2.5 rounded-md ${activeIndex === globalIndex ? 'bg-blue-500 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                          <cmd.icon
                            className={`w-5 h-5 mr-3 ${activeIndex === globalIndex ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}
                          />
                          <span>{cmd.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          {!query && (
            <div className="text-center p-6 text-slate-500 dark:text-slate-400">
              Mulai ketik untuk mencari halaman, pelanggan, atau perintah.
            </div>
          )}
          {query && filteredCommands.length === 0 && (
            <div className="text-center p-6 text-slate-500 dark:text-slate-400">
              Tidak ada hasil ditemukan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
