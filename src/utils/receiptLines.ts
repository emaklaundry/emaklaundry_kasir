import type { Customer, Settings, Transaction } from '../types';
import { formatTransactionId } from './uiHelpers';
import type { ReceiptHeader } from './receiptHeader';
import type { ReceiptLine } from './thermalPrinter';

export const DEFAULT_RECEIPT_MESSAGE = 'Terima kasih telah menggunakan layanan kami.';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Tanggal ringkas untuk kertas sempit: `27/11/26 18:38`. */
export function formatReceiptDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${pad2(d.getFullYear() % 100)} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

export const formatRp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

type ReceiptTransaction = Pick<
  Transaction,
  | 'id'
  | 'invoiceCode'
  | 'createdAt'
  | 'paymentStatus'
  | 'items'
  | 'subtotal'
  | 'total'
  | 'amountPaid'
  | 'change'
  | 'paymentMethod'
  | 'estimatedCompletionDate'
>;

export interface ReceiptLineOptions {
  /** Nomor cetakan (1 = asli). Cetakan ke-2 dst. diberi tanda CETAK ULANG. */
  printNumber?: number;
}

/**
 * Isi struk transaksi — satu-satunya sumber untuk pratinjau layar, cetak lewat
 * browser (komputer & HP), dan ESC/POS langsung, supaya hasilnya selalu sama.
 */
export function buildTransactionReceiptLines(
  tx: ReceiptTransaction,
  customer: Pick<Customer, 'name'>,
  header: ReceiptHeader,
  settings: Pick<Settings, 'receiptMessage'> | null | undefined,
  options: ReceiptLineOptions = {},
): ReceiptLine[] {
  const lines: ReceiptLine[] = [
    { type: 'text', text: header.title, align: 'center', bold: true, size: 'large' },
    ...header.details.map((text): ReceiptLine => ({ type: 'text', text, align: 'center' })),
  ];

  if (options.printNumber && options.printNumber > 1) {
    lines.push({
      type: 'text',
      text: `*** CETAK ULANG ke-${options.printNumber} ***`,
      align: 'center',
      bold: true,
    });
  }

  lines.push(
    { type: 'divider' },
    { type: 'pair', left: 'No. Nota', right: formatTransactionId(tx) },
    { type: 'pair', left: 'Tanggal', right: formatReceiptDate(tx.createdAt) },
    { type: 'pair', left: 'Pelanggan', right: customer.name },
    { type: 'divider' },
  );

  for (const item of tx.items) {
    lines.push({ type: 'text', text: item.serviceName, bold: true });
    lines.push({
      type: 'pair',
      left: ` ${item.quantity} ${item.unit} x ${formatRp(item.price)}`,
      right: formatRp(item.subtotal),
    });
    item.itemDetails?.slice(0, item.quantity).forEach((detail, i) => {
      if (detail.note) lines.push({ type: 'text', text: ` #${i + 1} ${detail.note}` });
    });
    if (item.taggedItems) lines.push({ type: 'text', text: ` Rincian: ${item.taggedItems}` });
  }

  lines.push({ type: 'divider' });

  // Nota lama (sebelum diskon/pajak dihapus) bisa punya total ≠ subtotal.
  const adjustment = tx.total - tx.subtotal;
  if (adjustment !== 0) {
    lines.push({ type: 'pair', left: 'Subtotal', right: formatRp(tx.subtotal) });
    lines.push({
      type: 'pair',
      left: 'Penyesuaian',
      right: `${adjustment < 0 ? '-' : '+'}${formatRp(Math.abs(adjustment))}`,
    });
  }
  lines.push({ type: 'pair', left: 'TOTAL', right: formatRp(tx.total), bold: true });

  if (tx.amountPaid > 0) {
    lines.push({
      type: 'pair',
      left: tx.paymentMethod ? `Bayar (${tx.paymentMethod})` : 'Bayar',
      right: formatRp(tx.amountPaid),
    });
  }
  if (tx.change > 0) lines.push({ type: 'pair', left: 'Kembali', right: formatRp(tx.change) });

  const remaining = tx.total - tx.amountPaid;
  if (remaining > 0) {
    lines.push({ type: 'pair', left: 'SISA TAGIHAN', right: formatRp(remaining), bold: true });
  } else {
    lines.push({
      type: 'text',
      text: `** ${String(tx.paymentStatus).toUpperCase()} **`,
      align: 'center',
      bold: true,
    });
  }

  lines.push(
    { type: 'divider' },
    {
      type: 'text',
      align: 'center',
      text: `Selesai: ${formatReceiptDate(tx.estimatedCompletionDate)}`,
    },
    {
      type: 'text',
      align: 'center',
      text: settings?.receiptMessage?.trim() || DEFAULT_RECEIPT_MESSAGE,
    },
  );

  return lines;
}
