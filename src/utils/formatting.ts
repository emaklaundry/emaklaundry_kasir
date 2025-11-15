/**
 * Konversi string tanggal lokal (YYYY-MM-DD) ke ISO string (UTC midnight)
 * @param dateStr string tanggal lokal, misal '2023-11-15'
 */
export function convertLocalDateToISOString(dateStr: string): string {
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  if (isNaN(y)) return new Date().toISOString();
  return new Date(y, (m || 1) - 1, d || 1).toISOString();
}
export function calculateNextDueDate(
  currentDueDate: Date,
  value: number,
  unit: 'days' | 'weeks' | 'months' | 'years',
): Date {
  const newDate = new Date(currentDueDate);
  switch (unit) {
    case 'days':
      newDate.setDate(newDate.getDate() + value);
      break;
    case 'weeks':
      newDate.setDate(newDate.getDate() + value * 7);
      break;
    case 'months':
      newDate.setMonth(newDate.getMonth() + value);
      break;
    case 'years':
      newDate.setFullYear(newDate.getFullYear() + value);
      break;
  }
  return newDate;
}

export const formatRupiah = (number: number | string): string => {
  if (typeof number === 'string') {
    number = parseFloat(number.replace(/[^\d]/g, ''));
  }
  if (isNaN(number)) return '';
  return new Intl.NumberFormat('id-ID').format(number);
};

export const parseRupiah = (formattedString: string): number => {
  return parseInt(formattedString.replace(/[^\d]/g, ''), 10) || 0;
};
