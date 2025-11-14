import { Transaction } from '../types';

export function sanitizeTransactionUpdate(data: Partial<Transaction>): Record<string, any> {
  const allowedColumns = new Set<string>([
    'customerId',
    'items',
    'subtotal',
    'discount',
    'tax',
    'total',
    'paymentStatus',
    'orderStatus',
    'createdAt',
    'estimatedCompletionDate',
    'amountPaid',
    'change',
    'paymentMethod',
    'createdByUserId',
    'storeId',
    'notes',
  ]);

  const payload: Record<string, any> = {};
  Object.entries(data || {}).forEach(([k, v]) => {
    if (allowedColumns.has(k)) payload[k] = v;
  });

  return payload;
}

