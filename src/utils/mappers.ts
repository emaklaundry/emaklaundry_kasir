import type {
  Transaction,
  TransactionItem,
  PaymentStatus,
  OrderStatus,
  PaymentMethod,
} from '../types';

/**
 * Raw DB transaction shape — handles both snake_case and camelCase columns
 * returned by Supabase depending on the table configuration.
 */
export interface RawDBTransaction {
  id: string;
  invoice_code?: string;
  invoiceCode?: string;
  customer_id?: string;
  customerId?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  amount_paid?: number;
  amountPaid?: number;
  change?: number;
  payment_status?: string;
  paymentStatus?: string;
  order_status?: string;
  orderStatus?: string;
  payment_method?: string;
  paymentMethod?: string;
  created_at?: string;
  createdAt?: string | Date;
  estimated_completion_date?: string;
  estimatedCompletionDate?: string;
  created_by_user_id?: string;
  createdByUserId?: string;
  store_id?: string;
  storeId?: string;
  items?: TransactionItem[] | unknown[];
  notes?: string;
  idempotencyKey?: string;
  whatsappSentAt?: string | null;
  /** Hanya ada di view transactions_operator (Operator tidak membaca tabel customers). */
  customerName?: string | null;
}

/**
 * Map a raw DB row (snake_case or camelCase) to the application Transaction type.
 * This is the single source of truth for all DB → frontend mapping.
 */
export function mapDBtoTransaction(raw: RawDBTransaction): Transaction {
  const createdAtRaw = raw.created_at ?? raw.createdAt;
  let createdAt: Date;
  if (createdAtRaw instanceof Date) {
    createdAt = createdAtRaw;
  } else if (typeof createdAtRaw === 'string') {
    createdAt = new Date(createdAtRaw);
  } else {
    createdAt = new Date();
  }

  const rawItems = raw.items ?? [];
  const items: TransactionItem[] = Array.isArray(rawItems)
    ? (rawItems as TransactionItem[]).map((item) => ({
        ...item,
        itemDetails: item.itemDetails ?? [],
      }))
    : [];

  return {
    id: raw.id,
    invoiceCode: raw.invoice_code ?? raw.invoiceCode ?? undefined,
    customerId: (raw.customer_id ?? raw.customerId ?? '') as string,
    items,
    subtotal: Number(raw.subtotal ?? 0),
    discount: Number(raw.discount ?? 0),
    tax: Number(raw.tax ?? 0),
    total: Number(raw.total ?? 0),
    amountPaid: Number(raw.amount_paid ?? raw.amountPaid ?? 0),
    change: Number(raw.change ?? 0),
    paymentStatus: (raw.payment_status ?? raw.paymentStatus ?? 'Belum Lunas') as PaymentStatus,
    orderStatus: (raw.order_status ?? raw.orderStatus ?? 'Diproses') as OrderStatus,
    paymentMethod: (raw.payment_method ?? raw.paymentMethod ?? undefined) as
      | PaymentMethod
      | undefined,
    createdAt,
    estimatedCompletionDate: raw.estimated_completion_date ?? raw.estimatedCompletionDate ?? '',
    createdByUserId: (raw.created_by_user_id ?? raw.createdByUserId ?? '') as string,
    storeId: (raw.store_id ?? raw.storeId ?? '') as string,
    notes: raw.notes ?? undefined,
    idempotencyKey: raw.idempotencyKey ?? undefined,
    whatsappSentAt: raw.whatsappSentAt ?? null,
    ...(raw.customerName ? { customerName: raw.customerName } : {}),
  };
}
