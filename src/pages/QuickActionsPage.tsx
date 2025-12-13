import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import QuickStockUpdateModal from '../components/QuickStockUpdateModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import QuickMaintenanceModal from '../components/QuickMaintenanceModal';
import useAppContext from '../contexts/useAppContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useToasts from '../contexts/useToasts';
import { UserRole, Expense } from '@/types';
import {
  PlusIcon,
  ReceiptIcon,
  WrenchIcon,
  DollarSignIcon,
  PlusCircleIcon,
} from '@/components/icons';

const QuickActionsPage: React.FC = () => {
  const { currentUser, selectedStoreId } = useAppContext();
  const { addExpense } = useExpenses();
  const { addAuditLog } = useAuditLogs();
  const { addToast } = useToasts();

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const isActionDisabled = currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all';

  const handleSaveExpense = async (expense: Omit<Expense, 'id' | 'storeId'>) => {
    const storeId =
      currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
    if (!storeId || storeId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk mencatat pengeluaran.', 'warning');
      return;
    }
    const newExpense = { ...expense, storeId };
    await addExpense(newExpense);
    addAuditLog(`Mencatat pengeluaran cepat: "${newExpense.description}".`, storeId);
    setIsExpenseModalOpen(false);
  };

  const actions = [
    {
      label: 'Update Stok',
      icon: WrenchIcon,
      color: 'bg-teal-500 hover:bg-teal-600',
      onClick: () => setIsStockModalOpen(true),
      modal: null,
    },
    {
      label: 'Catat Pengeluaran',
      icon: DollarSignIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => setIsExpenseModalOpen(true),
      modal: null,
    },
    {
      label: 'Lapor Kerusakan',
      icon: PlusCircleIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => setIsMaintenanceModalOpen(true),
      modal: null,
    },
    // ...existing actions for navigation
    {
      label: 'Transaksi Baru',
      to: '/transactions/new',
      icon: PlusIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      label: 'Daftar Transaksi',
      to: '/transactions',
      icon: ReceiptIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  return (
    <div className="p-3 sm:p-4 pb-20 sm:pb-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white">Aksi Cepat</h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {actions.map((action) =>
          action.onClick ? (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={isActionDisabled}
              className={`${action.color} text-white rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[140px] sm:min-h-[160px] touch-target`}
            >
              <action.icon className="w-12 h-12 sm:w-14 sm:h-14 mb-3" />
              <span className="text-base sm:text-lg font-semibold leading-tight">{action.label}</span>
            </button>
          ) : (
            <Link
              key={action.to}
              to={action.to!}
              className={`${action.color} text-white rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg transition-all transform active:scale-95 min-h-[140px] sm:min-h-[160px] touch-target`}
            >
              <action.icon className="w-12 h-12 sm:w-14 sm:h-14 mb-3" />
              <span className="text-base sm:text-lg font-semibold leading-tight">{action.label}</span>
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
    </div>
  );
};

export default QuickActionsPage;
