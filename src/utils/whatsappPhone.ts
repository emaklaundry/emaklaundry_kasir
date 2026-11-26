/**
 * Ubah nomor HP Indonesia ke format internasional tanpa "+" untuk wa.me.
 * "0812..", "+62 812..", "62812.." dan "812.." → "62812..". Kosong/terlalu pendek → null.
 */
export function normalizeWhatsAppPhone(raw?: string | null): string | null {
  if (!raw) return null;
  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.substring(1);
  else if (phone.startsWith('8')) phone = '62' + phone;
  return phone.length >= 10 ? phone : null;
}
