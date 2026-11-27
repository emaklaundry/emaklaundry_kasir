/**
 * Jumlah minimum layanan dibaca dari nama layanan, mis. "Cuci dan lipat (min. 3 kg) - 1 hari".
 * Pola yang dikenali: "min 3", "min. 3", "minimal 2,5", "minimum 3 kg".
 * Mengembalikan 0 bila nama tidak menyebut minimum.
 */
const MIN_PATTERN = /\bmin(?:imal|imum)?\.?\s*(\d+(?:[.,]\d+)?)/i;

export const getServiceMinQuantity = (serviceName: string | null | undefined): number => {
  if (!serviceName) return 0;
  const match = MIN_PATTERN.exec(serviceName);
  if (!match) return 0;
  const value = parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : 0;
};

/**
 * Minimum yang berlaku untuk sebuah layanan: kolom `minQuantity` di database.
 * Nama layanan hanya dipakai bila datanya tidak punya kolom itu (mis. layanan belum dimuat).
 */
export const resolveMinQuantity = (
  service: { name?: string; minQuantity?: number | null } | null | undefined,
  fallbackName?: string,
): number => {
  if (service && typeof service.minQuantity === 'number') {
    return service.minQuantity > 0 ? service.minQuantity : 0;
  }
  return getServiceMinQuantity(service?.name ?? fallbackName);
};

/** Format angka minimum untuk pesan, mis. 2.5 -> "2,5". */
export const formatMinQuantity = (value: number): string =>
  value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
