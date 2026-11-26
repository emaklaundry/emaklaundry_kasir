/**
 * Menyeragamkan nomor HP pelanggan ke format lokal "08xxxxxxxxxx".
 * Semua data pelanggan di database memakai format ini, dan indeks unik
 * (phone, storeId) membandingkan string apa adanya, jadi format harus sama.
 * Contoh: "+62 812-3456-7890" / "6281234567890" / "81234567890" -> "081234567890".
 */
export function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  if (digits.startsWith('8')) return '0' + digits;
  return digits;
}
