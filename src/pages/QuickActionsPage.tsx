import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import QuickStockUpdateModal from '../components/QuickStockUpdateModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import QuickMaintenanceModal from '../components/QuickMaintenanceModal';
import WashSettingsModal from '../components/WashSettingsModal';
import useAppContext from '../contexts/useAppContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useToasts from '../contexts/useToasts';
import { UserRole, Expense } from '@/types';
import { can, type Permission } from '@/config/permissions';
import {
  PlusIcon,
  ReceiptIcon,
  WrenchIcon,
  DollarSignIcon,
  PlusCircleIcon,
  BookOpenIcon,
} from '@/components/icons';

// Kelas ditulis lengkap agar terbaca Tailwind.
const tileClass = (primary?: boolean) =>
  `rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[140px] sm:min-h-[160px] touch-target ${
    primary
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/60'
  }`;

const QuickActionsPage: React.FC = () => {
  const { currentUser, selectedStoreId } = useAppContext();
  const { addExpense } = useExpenses();
  const { addAuditLog } = useAuditLogs();
  const { addToast } = useToasts();

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isWashSettingsModalOpen, setIsWashSettingsModalOpen] = useState(false);

  const isActionDisabled = currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all';

  const handleSaveExpense = async (expense: Omit<Expense, 'id' | 'storeId'>) => {
    const storeId =
      currentUser?.role === UserRole.SuperAdmin ? selectedStoreId : currentUser?.storeId;
    if (!storeId || storeId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk mencatat pengeluaran.', 'warning');
      return;
    }
    const newExpense = { ...expense, storeId };
    await addExpense(newExpense);
    addAuditLog(`Mencatat pengeluaran cepat: "${newExpense.description}".`, storeId);
    setIsExpenseModalOpen(false);
  };

  const allActions: {
    label: string;
    icon: React.FC<{ className?: string }>;
    primary?: boolean;
    onClick?: () => void;
    to?: string;
    permission?: Permission;
  }[] = [
    {
      label: 'Transaksi Baru',
      permission: 'transaction.create',
      to: '/transactions/new',
      icon: PlusIcon,
      primary: true,
    },
    {
      label: 'Daftar Transaksi',
      to: '/transactions',
      icon: ReceiptIcon,
    },
    {
      label: 'Update Stok',
      permission: 'inventory.quickUpdate',
      icon: WrenchIcon,
      onClick: () => setIsStockModalOpen(true),
    },
    {
      label: 'Catat Pengeluaran',
      permission: 'expense.create',
      icon: DollarSignIcon,
      onClick: () => setIsExpenseModalOpen(true),
    },
    {
      label: 'Lapor Kerusakan',
      permission: 'maintenance.report',
      icon: PlusCircleIcon,
      onClick: () => setIsMaintenanceModalOpen(true),
    },
    {
      label: 'Panduan Mesin Cuci',
      icon: BookOpenIcon,
      onClick: () => setIsWashSettingsModalOpen(true),
    },
  ];
  const actions = allActions.filter(
    (action) => !action.permission || can(currentUser?.role, action.permission),
  );

  return (
    <div className="p-3 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white">
        Aksi Cepat
      </h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {actions.map((action) =>
          action.onClick ? (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={action.label !== 'Panduan Mesin Cuci' && isActionDisabled}
              className={tileClass(action.primary)}
            >
              <action.icon
                className={`mb-3 h-12 w-12 sm:h-14 sm:w-14 ${action.primary ? '' : 'text-brand-blue-600 dark:text-brand-blue-400'}`}
              />
              <span className="text-base sm:text-lg font-semibold leading-tight">
                {action.label}
              </span>
            </button>
          ) : (
            <Link key={action.to} to={action.to!} className={tileClass(action.primary)}>
              <action.icon
                className={`mb-3 h-12 w-12 sm:h-14 sm:w-14 ${action.primary ? '' : 'text-brand-blue-600 dark:text-brand-blue-400'}`}
              />
              <span className="text-base sm:text-lg font-semibold leading-tight">
                {action.label}
              </span>
            </Link>
          ),
        )}
      </div>
      {isActionDisabled && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-3">
          Pilih cabang spesifik untuk melakukan aksi cepat.
        </p>
      )}
      <QuickStockUpdateModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} />
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expense={null}
      />
      <QuickMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
      />
      <WashSettingsModal
        isOpen={isWashSettingsModalOpen}
        onClose={() => setIsWashSettingsModalOpen(false)}
      />
    </div>
  );
};

export default QuickActionsPage;
