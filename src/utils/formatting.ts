/**
 * Formats a number as Indonesian Rupiah (Rp).
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, ''); // Hapus spasi jika 'Rp' terpisah
}

/**
 * Parses a formatted Rupiah string back into a number.
 */
export function parseRupiah(rupiahStr: string): number {
  if (!rupiahStr) return 0;
  // Hapus "Rp", titik, dan spasi
  const cleaned = rupiahStr.replace(/Rp|\.|\s/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Calculates the next due date for a scheduled maintenance.
 * @param currentDate ISO string or Date
 * @param value number of units
 * @param unit 'days' | 'weeks' | 'months' | 'years'
 * @returns ISO string of next due date
 */
export function calculateNextDueDate(currentDate: string | Date, value: number, unit: 'days' | 'weeks' | 'months' | 'years'): string {
  const date = new Date(currentDate);
  switch (unit) {
    case 'days':
      date.setDate(date.getDate() + value);
      break;
    case 'weeks':
      date.setDate(date.getDate() + value * 7);
      break;
    case 'months':
      date.setMonth(date.getMonth() + value);
      break;
    case 'years':
      date.setFullYear(date.getFullYear() + value);
      break;
  }
  return date.toISOString();
}
