import { OrderStatus, PaymentStatus } from '@/types';

export function getStatusBadge(status: OrderStatus | string): string {
  switch (status) {
    case 'Diproses': // Processing
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case 'Siap Diambil': // Ready
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'Selesai': // Completed
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case 'Active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case 'Under Maintenance':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'Decommissioned':
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  }
}

export function getPaymentStatusBadge(status: PaymentStatus | string): string {
  switch (status) {
    case 'Lunas': // Paid
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case 'Belum Lunas': // Unpaid
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  }
}

export const formatTransactionId = (transaction: { id: string; invoiceCode?: string }): string => {
  if (transaction.invoiceCode) return transaction.invoiceCode;
  // Fallback to simpler format if no invoice code
  return `#${transaction.id.substring(0, 8)}`;
};
