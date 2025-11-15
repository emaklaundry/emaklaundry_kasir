import { OrderStatus, PaymentStatus } from '@/types';

export function getStatusBadge(status: OrderStatus | string): string {
  switch (status) {
    case 'Processing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case 'Ready':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'Completed':
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
    case 'Paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case 'Unpaid':
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  }
}
