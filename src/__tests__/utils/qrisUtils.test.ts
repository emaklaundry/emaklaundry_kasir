import { describe, expect, it } from 'vitest';
import {
  calculateCRC16,
  generateDynamicQRIS,
  isStaticQRIS,
  parseQRIS,
  validateQRIS,
} from '@/utils/qrisUtils';

const tlv = (tag: string, value: string) =>
  `${tag}${String(value.length).padStart(2, '0')}${value}`;

/** QRIS statis contoh, termasuk tag akun merchant 26 dan 51 serta tag 62. */
const buildStaticQris = () => {
  const body =
    tlv('00', '01') +
    tlv('01', '11') +
    tlv('26', tlv('00', 'ID.CO.EXAMPLE.WWW') + tlv('01', '936009180000000001')) +
    tlv('51', tlv('00', 'ID.CO.QRIS.WWW') + tlv('02', 'ID1023123456789')) +
    tlv('52', '5812') +
    tlv('53', '360') +
    tlv('58', 'ID') +
    tlv('59', 'EMAK LAUNDRY') +
    tlv('60', 'BANJAR') +
    tlv('62', tlv('07', 'KASIR01')) +
    '6304';
  return body + calculateCRC16(body);
};

describe('validateQRIS', () => {
  it('menerima QRIS dengan CRC benar', () => {
    expect(validateQRIS(buildStaticQris())).toBe(true);
  });

  it('menolak CRC salah, isi diubah, atau tanpa tag 63', () => {
    const qris = buildStaticQris();
    const badCrc = qris.slice(0, -1) + (qris.endsWith('0') ? '1' : '0');
    expect(validateQRIS(badCrc)).toBe(false);
    expect(validateQRIS(qris.replace('BANJAR', 'BANJAX'))).toBe(false);
    expect(validateQRIS(qris.slice(0, -8))).toBe(false);
    expect(validateQRIS('000201')).toBe(false);
  });

  it('isStaticQRIS membaca tag 01', () => {
    expect(isStaticQRIS(buildStaticQris())).toBe(true);
  });
});

describe('generateDynamicQRIS', () => {
  it('menghasilkan QRIS dinamis yang valid dengan nominal', () => {
    const dynamic = generateDynamicQRIS(buildStaticQris(), 25500);
    expect(validateQRIS(dynamic)).toBe(true);
    const tags = parseQRIS(dynamic)!.rawTags;
    expect(tags.get('01')).toBe('12');
    expect(tags.get('54')).toBe('25500');
    expect(dynamic.slice(-8, -4)).toBe('6304');
  });

  it('mempertahankan semua tag asli (akun merchant & data tambahan)', () => {
    const staticTags = parseQRIS(buildStaticQris())!.rawTags;
    const dynamicTags = parseQRIS(generateDynamicQRIS(buildStaticQris(), 1000))!.rawTags;
    for (const tag of ['26', '51', '52', '53', '58', '59', '60', '62']) {
      expect(dynamicTags.get(tag)).toBe(staticTags.get(tag));
    }
  });

  it('nominal dibulatkan ke Rupiah', () => {
    const tags = parseQRIS(generateDynamicQRIS(buildStaticQris(), 1234.6))!.rawTags;
    expect(tags.get('54')).toBe('1235');
  });
});
