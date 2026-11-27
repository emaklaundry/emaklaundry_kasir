import { OrderStatus, PaymentStatus } from '@/types';

/** Varian `.badge-*` (src/index.css) untuk status pesanan & aset. Pakai bersama kelas `badge`. */
export function getStatusBadge(status: OrderStatus | string): string {
  switch (status) {
    case 'Diproses': // Processing — sedang berjalan
      return 'badge-info';
    case 'Siap Diambil': // Ready — perlu tindakan pelanggan
      return 'badge-warning';
    case 'Selesai': // Completed
    case 'Active':
      return 'badge-success';
    case 'Under Maintenance':
      return 'badge-warning';
    case 'Decommissioned':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
}

/** Varian `.badge-*` untuk status pembayaran. */
export function getPaymentStatusBadge(status: PaymentStatus | string): string {
  switch (status) {
    case 'Lunas': // Paid
      return 'badge-success';
    case 'Bayar Sebagian':
      return 'badge-warning';
    case 'Belum Lunas': // Unpaid
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
}

export const formatTransactionId = (transaction: { id: string; invoiceCode?: string }): string => {
  if (transaction.invoiceCode) return transaction.invoiceCode;
  // Fallback to simpler format if no invoice code
  return `#${transaction.id.substring(0, 8)}`;
};

/** Label Bahasa Indonesia untuk status aset (nilai DB tetap bahasa Inggris). */
export const ASSET_STATUS_LABELS: Record<string, string> = {
  Active: 'Aktif',
  'Under Maintenance': 'Dalam Perbaikan',
  Decommissioned: 'Diberhentikan',
};

export const getAssetStatusLabel = (status: string): string =>
  ASSET_STATUS_LABELS[status] ?? status;

/** Label Bahasa Indonesia untuk satuan frekuensi jadwal perawatan. */
export const FREQUENCY_UNIT_LABELS: Record<string, string> = {
  days: 'hari',
  weeks: 'minggu',
  months: 'bulan',
  years: 'tahun',
};
