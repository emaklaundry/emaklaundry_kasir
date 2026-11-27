import { InventoryItem } from '../types';

const qtyFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 });

/** Format jumlah stok: 12 → "12", 12.5 → "12,5", 0.125 → "0,125". */
export function formatQty(value: number | null | undefined): string {
  const n = Number(value);
  return qtyFormatter.format(Number.isFinite(n) ? n : 0);
}

/** Format perubahan stok dengan tanda: +5, −2,5. */
export function formatQtyDelta(value: number): string {
  if (value > 0) return `+${formatQty(value)}`;
  if (value < 0) return `−${formatQty(Math.abs(value))}`;
  return '0';
}

export type StockLevel = 'out' | 'low' | 'ok';

/** Status stok; ambang 0 = pemantauan stok rendah dimatikan. */
export function getStockLevel(
  item: Pick<InventoryItem, 'stock' | 'lowStockThreshold'>,
): StockLevel {
  if (item.stock <= 0) return 'out';
  if (item.lowStockThreshold > 0 && item.stock <= item.lowStockThreshold) return 'low';
  return 'ok';
}

export const STOCK_LEVEL_META: Record<StockLevel, { label: string; badge: string; text: string }> =
  {
    out: {
      label: 'Stok Habis',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      text: 'text-red-600 dark:text-red-400 font-bold',
    },
    low: {
      label: 'Stok Rendah',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      text: 'text-yellow-600 dark:text-yellow-400 font-bold',
    },
    ok: {
      label: 'Aman',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      text: 'text-slate-900 dark:text-white',
    },
  };
