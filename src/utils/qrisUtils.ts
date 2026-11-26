/**
 * QRIS Utility Functions
 * Implements EMVCo QR Code specification for Indonesian QRIS
 *
 * Format: TLV (Tag-Length-Value)
 * - Tag 00: Payload Format Indicator (fixed "01")
 * - Tag 01: Point of Initiation ("11" = Static, "12" = Dynamic)
 * - Tag 26-51: Merchant Account Information
 * - Tag 52: Merchant Category Code
 * - Tag 53: Transaction Currency ("360" = IDR)
 * - Tag 54: Transaction Amount (added for dynamic)
 * - Tag 58: Country Code ("ID")
 * - Tag 59: Merchant Name
 * - Tag 60: Merchant City
 * - Tag 63: CRC Checksum
 */

interface QRISData {
  payloadFormatIndicator: string;
  pointOfInitiation: string;
  merchantAccountInfo: string;
  merchantCategoryCode: string;
  transactionCurrency: string;
  transactionAmount?: string;
  countryCode: string;
  merchantName: string;
  merchantCity: string;
  additionalData?: string;
  crc: string;
  rawTags: Map<string, string>;
}

/**
 * Parse TLV (Tag-Length-Value) encoded QRIS string
 */
export function parseQRIS(qrisString: string): QRISData | null {
  try {
    const rawTags = new Map<string, string>();
    let position = 0;

    while (position < qrisString.length - 4) {
      // -4 for CRC at end
      // Get tag (2 characters)
      const tag = qrisString.substring(position, position + 2);
      position += 2;

      // Get length (2 characters)
      const length = parseInt(qrisString.substring(position, position + 2), 10);
      position += 2;

      // Get value
      const value = qrisString.substring(position, position + length);
      position += length;

      rawTags.set(tag, value);
    }

    // Get CRC (last 4 characters of original string)
    const crc = qrisString.substring(qrisString.length - 4);

    return {
      payloadFormatIndicator: rawTags.get('00') || '01',
      pointOfInitiation: rawTags.get('01') || '11',
      merchantAccountInfo: rawTags.get('26') || rawTags.get('51') || '',
      merchantCategoryCode: rawTags.get('52') || '',
      transactionCurrency: rawTags.get('53') || '360',
      transactionAmount: rawTags.get('54'),
      countryCode: rawTags.get('58') || 'ID',
      merchantName: rawTags.get('59') || '',
      merchantCity: rawTags.get('60') || '',
      additionalData: rawTags.get('62'),
      crc,
      rawTags,
    };
  } catch {
    console.error('Failed to parse QRIS string');
    return null;
  }
}

/**
 * Create TLV string from tag and value
 */
function createTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

/**
 * Calculate CRC16-CCITT checksum for QRIS
 * Polynomial: 0x1021 (x^16 + x^12 + x^5 + 1)
 * Initial value: 0xFFFF
 */
export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    crc ^= char << 8;

    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generate Dynamic QRIS from static QRIS with transaction amount.
 *
 * Semua tag dari QRIS statis dipertahankan (termasuk akun merchant 26–51),
 * tag 01 menjadi "12" (dinamis), tag 54 diisi nominal, lalu ditutup tag 63:
 * "6304" + CRC16 yang dihitung atas seluruh isi termasuk "6304".
 */
export function generateDynamicQRIS(staticQRIS: string, amount: number): string {
  const parsed = parseQRIS(staticQRIS);
  if (!parsed) {
    throw new Error('Failed to parse static QRIS');
  }

  const tags = new Map(parsed.rawTags);
  tags.delete('63');
  tags.set('00', '01');
  tags.set('01', '12');
  // Nominal tanpa desimal (Rupiah)
  tags.set('54', Math.round(amount).toString());

  const body =
    [...tags.keys()]
      .sort((a, b) => Number(a) - Number(b))
      .map((tag) => createTLV(tag, tags.get(tag)!))
      .join('') + '6304';

  return body + calculateCRC16(body);
}

/**
 * Validate QRIS string: diakhiri tag 63 ("6304" + 4 digit CRC) dan CRC16
 * atas seluruh isi sebelum 4 digit terakhir cocok.
 */
export function validateQRIS(qrisString: string): boolean {
  if (qrisString.length < 12) return false;
  if (qrisString.slice(-8, -4) !== '6304') return false;
  const providedCRC = qrisString.slice(-4).toUpperCase();
  return calculateCRC16(qrisString.slice(0, -4)) === providedCRC;
}

/**
 * Format amount for display
 */
export function formatQRISAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Check if QRIS is static or dynamic
 */
export function isStaticQRIS(qrisString: string): boolean {
  const parsed = parseQRIS(qrisString);
  return parsed?.pointOfInitiation === '11';
}

/**
 * Get merchant name from QRIS
 */
export function getMerchantName(qrisString: string): string {
  const parsed = parseQRIS(qrisString);
  return parsed?.merchantName || 'Unknown Merchant';
}
