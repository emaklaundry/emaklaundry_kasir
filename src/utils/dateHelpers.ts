/**
 * Date Helper Utilities
 * Menangani konversi tanggal dengan timezone lokal yang konsisten
 */

/**
 * Mendapatkan string tanggal lokal dalam format YYYY-MM-DD
 * @param date - Date object, string ISO, atau undefined
 * @returns String tanggal dalam format YYYY-MM-DD
 */
export const getLocalDateString = (date?: string | Date): string => {
  if (!date) {
    const now = new Date();
    return formatDateToYMD(now);
  }

  if (typeof date === 'string') {
    // Jika sudah dalam format YYYY-MM-DD, return langsung
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Jika ISO string, extract bagian tanggal
    return date.split('T')[0];
  }

  return formatDateToYMD(date);
};

/**
 * Format Date object ke YYYY-MM-DD
 * @param date - Date object
 * @returns String dalam format YYYY-MM-DD
 */
const formatDateToYMD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse string tanggal YYYY-MM-DD ke Date object dengan timezone lokal
 * @param dateStr - String tanggal dalam format YYYY-MM-DD
 * @returns Date object dengan timezone lokal
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Mendapatkan awal hari (00:00:00.000) untuk tanggal tertentu
 * @param date - String atau Date object
 * @returns Date object pada awal hari
 */
export const getStartOfDay = (date: string | Date): Date => {
  const d = typeof date === 'string' ? parseLocalDate(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Mendapatkan akhir hari (23:59:59.999) untuk tanggal tertentu
 * @param date - String atau Date object
 * @returns Date object pada akhir hari
 */
export const getEndOfDay = (date: string | Date): Date => {
  const d = typeof date === 'string' ? parseLocalDate(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Validasi apakah string adalah format tanggal yang valid (YYYY-MM-DD)
 * @param dateStr - String untuk divalidasi
 * @returns true jika valid
 */
export const isValidDateString = (dateStr: string): boolean => {
  // Check format first
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  // Parse and validate date components
  const [year, month, day] = dateStr.split('-').map(Number);

  // Validate ranges
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Create date and verify it matches input (catches invalid dates like Feb 30)
  const date = new Date(year, month - 1, day);

  if (isNaN(date.getTime())) return false;

  // Verify the date components match (catches rollover like Feb 30 -> Mar 2)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

/**
 * Format tanggal untuk display (DD/MM/YYYY)
 * @param date - String atau Date object
 * @returns String dalam format DD/MM/YYYY
 */
export const formatDateDisplay = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
