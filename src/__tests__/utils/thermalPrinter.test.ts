import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PRINTER_SETTINGS,
  buildReceiptHtml,
  encodeEscPos,
  formatPair,
  loadPrinterSettings,
  renderReceiptText,
  resolveCharsPerLine,
  savePrinterSettings,
  toPrintableAscii,
  wrapText,
  ReceiptLine,
} from '@/utils/thermalPrinter';

describe('thermalPrinter', () => {
  beforeEach(() => localStorage.clear());

  it('menentukan kolom dari lebar kertas', () => {
    expect(resolveCharsPerLine({ paperWidthMm: 58, charsPerLine: 0 })).toBe(32);
    expect(resolveCharsPerLine({ paperWidthMm: 80, charsPerLine: 0 })).toBe(48);
    expect(resolveCharsPerLine({ paperWidthMm: 80, charsPerLine: 42 })).toBe(42);
    expect(resolveCharsPerLine({ paperWidthMm: 70, charsPerLine: 0 })).toBe(40);
  });

  it('mengubah teks non-ASCII menjadi aman untuk printer', () => {
    expect(toPrintableAscii('Café — “oke” …')).toBe('Cafe - "oke" ...');
    expect(toPrintableAscii('Cuci 👕')).toBe('Cuci ');
  });

  it('membungkus teks per kata dan memotong kata yang terlalu panjang', () => {
    expect(wrapText('satu dua tiga empat', 9)).toEqual(['satu dua', 'tiga', 'empat']);
    expect(wrapText('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
  });

  it('meratakan pasangan kiri-kanan tepat selebar kolom', () => {
    const [line] = formatPair('Total', 'Rp 10.000', 32);
    expect(line).toHaveLength(32);
    expect(line.startsWith('Total')).toBe(true);
    expect(line.endsWith('Rp 10.000')).toBe(true);
  });

  it('tidak pernah melebihi lebar kolom', () => {
    const lines: ReceiptLine[] = [
      { type: 'pair', left: 'Nama layanan yang sangat panjang sekali', right: 'Rp 1.250.000' },
      { type: 'text', text: 'Terima kasih telah menggunakan layanan kami.', align: 'center' },
      { type: 'divider' },
    ];
    for (const width of [32, 48]) {
      for (const l of renderReceiptText(lines, width)) expect(l.length).toBeLessThanOrEqual(width);
    }
  });

  it('menghasilkan perintah ESC/POS dasar (init, teks, potong)', () => {
    const bytes = encodeEscPos([{ type: 'text', text: 'Halo' }], DEFAULT_PRINTER_SETTINGS);
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x1b, 0x40]);
    expect(new TextDecoder().decode(bytes)).toContain('Halo\n');
    expect(Array.from(bytes.slice(-4))).toEqual([0x1d, 0x56, 0x42, 0x00]);

    const noCut = encodeEscPos([{ type: 'text', text: 'x' }], {
      ...DEFAULT_PRINTER_SETTINGS,
      autoCut: false,
    });
    expect(Array.from(noCut.slice(-1))).toEqual([0x0a]);
  });

  it('mode pekat & rapat: double-strike dan jarak baris rapat, dimatikan bila opsi off', () => {
    const has = (bytes: Uint8Array, seq: number[]) =>
      Array.from(bytes).join(',').includes(seq.join(','));
    const on = encodeEscPos([{ type: 'text', text: 'x' }], DEFAULT_PRINTER_SETTINGS);
    expect(has(on, [0x1b, 0x47, 1])).toBe(true); // ESC G 1
    expect(has(on, [0x1b, 0x33, 26])).toBe(true); // ESC 3 26

    const off = encodeEscPos([{ type: 'text', text: 'x' }], {
      ...DEFAULT_PRINTER_SETTINGS,
      darkPrint: false,
      compactLines: false,
    });
    expect(has(off, [0x1b, 0x47, 1])).toBe(false);
    expect(has(off, [0x1b, 0x33])).toBe(false);
  });

  it('teks besar memakai jarak baris normal agar tidak bertumpuk', () => {
    const bytes = Array.from(
      encodeEscPos([{ type: 'text', text: 'JUDUL', size: 'large' }], DEFAULT_PRINTER_SETTINGS),
    ).join(',');
    const big = bytes.indexOf([0x1d, 0x21, 0x11].join(','));
    const normalSpacing = bytes.indexOf([0x1b, 0x32].join(','), big);
    const text = bytes.indexOf([74, 85, 68, 85, 76].join(','));
    expect(big).toBeGreaterThan(-1);
    expect(normalSpacing).toBeGreaterThan(big);
    expect(normalSpacing).toBeLessThan(text);
  });

  it('HTML struk memakai lebar kertas & meng-escape isi', () => {
    const html = buildReceiptHtml([{ type: 'text', text: '<b>x</b>' }], {
      ...DEFAULT_PRINTER_SETTINGS,
      paperWidthMm: 80,
    });
    expect(html).toContain('size: 80mm auto');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  it('menyimpan & memuat pengaturan dengan validasi', () => {
    savePrinterSettings({ ...DEFAULT_PRINTER_SETTINGS, method: 'usb', paperWidthMm: 80 });
    expect(loadPrinterSettings()).toMatchObject({ method: 'usb', paperWidthMm: 80 });
    localStorage.setItem('thermalPrinterSettings', '{"method":"fax","paperWidthMm":9999}');
    expect(loadPrinterSettings()).toMatchObject({ method: 'browser', paperWidthMm: 120 });
  });
});
