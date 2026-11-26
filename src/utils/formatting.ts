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
  try {
    const newDate = new Date(currentDueDate);

    if (isNaN(newDate.getTime())) {
      throw new Error('Invalid date');
    }

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
      default:
        throw new Error(`Invalid unit: ${unit}`);
    }

    return newDate;
  } catch (error) {
    console.error('Error calculating next due date:', error);
    // Return 30 days from now as fallback
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 30);
    return fallback;
  }
}

export const formatRupiah = (number: number | string): string => {
  try {
    if (typeof number === 'string') {
      number = parseFloat(number.replace(/[^\d.-]/g, ''));
    }
    if (isNaN(number) || number === null || number === undefined) return '0';
    return new Intl.NumberFormat('id-ID').format(number);
  } catch (error) {
    console.error('Error formatting Rupiah:', error);
    return '0';
  }
};

export const parseRupiah = (formattedString: string): number => {
  try {
    if (!formattedString || typeof formattedString !== 'string') return 0;
    const cleaned = formattedString.replace(/[^\d]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error('Error parsing Rupiah:', error);
    return 0;
  }
};
