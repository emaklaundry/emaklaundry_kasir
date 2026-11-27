/**
 * Cetak struk ke printer thermal (universal).
 *
 * Dua jalur:
 *  1. `browser`  — dialog cetak sistem lewat iframe terisolasi. Bekerja untuk SEMUA printer
 *                  yang punya driver di OS (Windows/macOS/Linux/Android print service/RawBT).
 *  2. `bluetooth` | `usb` | `serial` — kirim perintah ESC/POS mentah langsung ke printer
 *                  (tanpa driver). ESC/POS dipahami hampir semua printer thermal
 *                  (Epson, Xprinter, Zjiang, Goojprt, Panda, Iware, POS-58/80, dll).
 *
 * Lebar kertas bisa 58mm / 80mm / kustom; jumlah karakter per baris ikut menyesuaikan.
 */

/* ------------------------------------------------------------------ */
/* Pengaturan                                                          */
/* ------------------------------------------------------------------ */

export type PrintMethod = 'browser' | 'bluetooth' | 'usb' | 'serial';

export interface PrinterSettings {
  method: PrintMethod;
  /** Lebar kertas dalam mm (58, 80, atau kustom). */
  paperWidthMm: number;
  /** Karakter per baris untuk mode ESC/POS. 0 = otomatis dari lebar kertas. */
  charsPerLine: number;
  /** Baud rate untuk printer serial/COM. */
  baudRate: number;
  /** Kirim perintah potong kertas (diabaikan printer tanpa cutter). */
  autoCut: boolean;
  /** Baris kosong sebelum potong supaya teks terakhir keluar dari kepala printer. */
  feedLines: number;
  /** ESC/POS: cetak dua kali per baris (double-strike) supaya huruf lebih pekat. */
  darkPrint: boolean;
  /** ESC/POS: jarak antarbaris rapat supaya struk lebih pendek. */
  compactLines: boolean;
}

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  method: 'browser',
  paperWidthMm: 58,
  charsPerLine: 0,
  baudRate: 9600,
  autoCut: true,
  feedLines: 4,
  darkPrint: true,
  compactLines: true,
};

const STORAGE_KEY = 'thermalPrinterSettings';

/** Pengaturan disimpan per perangkat (printer melekat ke komputer/HP kasir, bukan ke akun). */
export function loadPrinterSettings(): PrinterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PRINTER_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<PrinterSettings>;
    return sanitizeSettings({ ...DEFAULT_PRINTER_SETTINGS, ...parsed });
  } catch {
    return { ...DEFAULT_PRINTER_SETTINGS };
  }
}

export function savePrinterSettings(settings: PrinterSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
  } catch {
    /* storage penuh / mode privat — abaikan */
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeSettings(s: PrinterSettings): PrinterSettings {
  const methods: PrintMethod[] = ['browser', 'bluetooth', 'usb', 'serial'];
  return {
    method: methods.includes(s.method) ? s.method : 'browser',
    paperWidthMm: clampInt(s.paperWidthMm, 40, 120, 58),
    charsPerLine: s.charsPerLine ? clampInt(s.charsPerLine, 16, 80, 0) : 0,
    baudRate: clampInt(s.baudRate, 1200, 921600, 9600),
    autoCut: s.autoCut !== false,
    feedLines: clampInt(s.feedLines, 0, 10, 4),
    darkPrint: s.darkPrint !== false,
    compactLines: s.compactLines !== false,
  };
}

/**
 * Karakter per baris (Font A 12x24). 58mm → 32 kolom, 80mm → 48 kolom.
 * Lebar area cetak kira-kira lebar kertas − 10mm, 8 dot/mm, 12 dot/karakter.
 */
export function resolveCharsPerLine(
  settings: Pick<PrinterSettings, 'paperWidthMm' | 'charsPerLine'>,
): number {
  if (settings.charsPerLine > 0) return settings.charsPerLine;
  if (settings.paperWidthMm <= 58) return 32;
  if (settings.paperWidthMm >= 80) return 48;
  return Math.max(16, Math.floor(((settings.paperWidthMm - 10) * 8) / 12));
}

/* ------------------------------------------------------------------ */
/* Model struk & format teks                                           */
/* ------------------------------------------------------------------ */

export type ReceiptLine =
  | {
      type: 'text';
      text: string;
      align?: 'left' | 'center' | 'right';
      bold?: boolean;
      size?: 'normal' | 'large';
    }
  | { type: 'pair'; left: string; right: string; bold?: boolean }
  | { type: 'divider' }
  | { type: 'blank' };

/** Ganti karakter non-ASCII (é, —, “ ”, emoji) supaya aman di semua codepage printer. */
export function toPrintableAscii(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\t\u00A0]/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '');
}

/** Pecah teks menjadi baris dengan lebar maksimal `width`, memotong per kata bila bisa. */
export function wrapText(text: string, width: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push('');
      continue;
    }
    let line = '';
    for (let word of words) {
      while (word.length > width) {
        if (line) {
          out.push(line);
          line = '';
        }
        out.push(word.slice(0, width));
        word = word.slice(width);
      }
      if (!word) continue;
      if (!line) line = word;
      else if (line.length + 1 + word.length <= width) line += ' ' + word;
      else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function align(text: string, width: number, mode: 'left' | 'center' | 'right'): string {
  if (text.length >= width) return text;
  if (mode === 'right') return ' '.repeat(width - text.length) + text;
  if (mode === 'center') return ' '.repeat(Math.floor((width - text.length) / 2)) + text;
  return text;
}

/** Baris "kiri ..... kanan". Bila tidak muat, kiri dibungkus dan kanan rata kanan di baris akhir. */
export function formatPair(left: string, right: string, width: number): string[] {
  if (left.length + 1 + right.length <= width) {
    return [left + ' '.repeat(width - left.length - right.length) + right];
  }
  const rightText = right.length > width ? right.slice(0, width) : right;
  const leftLines = wrapText(left, width);
  const last = leftLines[leftLines.length - 1] ?? '';
  if (last.length + 1 + rightText.length <= width) {
    leftLines[leftLines.length - 1] =
      last + ' '.repeat(width - last.length - rightText.length) + rightText;
    return leftLines;
  }
  return [...leftLines, align(rightText, width, 'right')];
}

/** Render struk menjadi teks polos (untuk ESC/POS & pratinjau). */
export function renderReceiptText(lines: ReceiptLine[], width: number): string[] {
  const out: string[] = [];
  for (const line of lines) {
    switch (line.type) {
      case 'blank':
        out.push('');
        break;
      case 'divider':
        out.push('-'.repeat(width));
        break;
      case 'pair':
        out.push(...formatPair(toPrintableAscii(line.left), toPrintableAscii(line.right), width));
        break;
      case 'text': {
        const w = line.size === 'large' ? Math.floor(width / 2) : width;
        for (const l of wrapText(toPrintableAscii(line.text), w)) {
          out.push(align(l, w, line.align ?? 'left'));
        }
        break;
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Encoder ESC/POS                                                     */
/* ------------------------------------------------------------------ */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
/** Jarak baris rapat (dot). Font A tingginya 24 dot; bawaan printer ~30 dot. */
const COMPACT_LINE_SPACING = 26;

/** Ubah struk menjadi byte ESC/POS. Hanya memakai perintah dasar yang didukung semua printer. */
export function encodeEscPos(lines: ReceiptLine[], settings: PrinterSettings): Uint8Array {
  const width = resolveCharsPerLine(settings);
  const bytes: number[] = [];
  const push = (...b: number[]) => bytes.push(...b);
  const pushText = (s: string) => {
    for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i) & 0x7f);
  };

  push(ESC, 0x40); // ESC @  — inisialisasi
  push(ESC, 0x74, 0x00); // ESC t 0 — codepage PC437 (ASCII aman)
  const setSpacing = (compact: boolean) =>
    compact ? push(ESC, 0x33, COMPACT_LINE_SPACING) : push(ESC, 0x32); // ESC 3 n / ESC 2
  setSpacing(settings.compactLines);
  if (settings.darkPrint) push(ESC, 0x47, 1); // ESC G 1 — double-strike (lebih pekat)

  for (const line of lines) {
    const isText = line.type === 'text';
    const bold = (line.type === 'text' || line.type === 'pair') && !!line.bold;
    const large = isText && line.size === 'large';
    const alignMode = isText ? (line.align ?? 'left') : 'left';

    push(ESC, 0x61, alignMode === 'center' ? 1 : alignMode === 'right' ? 2 : 0); // ESC a n
    if (bold) push(ESC, 0x45, 1); // ESC E 1
    if (large) {
      push(GS, 0x21, 0x11); // GS ! — lebar & tinggi ganda
      // Teks tinggi ganda tidak boleh memakai jarak rapat, nanti barisnya bertumpuk.
      if (settings.compactLines) setSpacing(false);
    }

    if (isText) {
      // Perataan ditangani printer (ESC a), jadi kirim teks yang hanya dibungkus.
      const w = large ? Math.floor(width / 2) : width;
      for (const l of wrapText(toPrintableAscii(line.text), w)) {
        pushText(l);
        push(LF);
      }
    } else {
      for (const l of renderReceiptText([line], width)) {
        pushText(l);
        push(LF);
      }
    }

    if (large) {
      push(GS, 0x21, 0x00);
      if (settings.compactLines) setSpacing(true);
    }
    if (bold) push(ESC, 0x45, 0);
  }

  push(ESC, 0x61, 0);
  if (settings.darkPrint) push(ESC, 0x47, 0);
  // Baris kosong akhir memakai jarak normal supaya teks terakhir benar-benar keluar dari kepala printer.
  if (settings.compactLines) setSpacing(false);
  for (let i = 0; i < settings.feedLines; i++) push(LF);
  if (settings.autoCut) push(GS, 0x56, 0x42, 0x00); // GS V 66 0 — feed & potong (parsial)

  return new Uint8Array(bytes);
}

/* ------------------------------------------------------------------ */
/* Jalur 1: dialog cetak sistem (driver)                               */
/* ------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** HTML mandiri untuk struk. Lebar halaman = lebar kertas, tinggi otomatis (kertas roll). */
export function buildReceiptHtml(lines: ReceiptLine[], settings: PrinterSettings): string {
  const width = resolveCharsPerLine(settings);
  const paper = settings.paperWidthMm;
  // Area cetak efektif ~ lebar kertas − 2×3mm margin; ukuran font menyesuaikan jumlah kolom.
  const printable = Math.max(30, paper - 6);
  const fontPt = Math.min(11, Math.max(6.5, ((printable / width) * 72) / 25.4 / 0.6)).toFixed(2);

  const body = lines
    .map((line) => {
      if (line.type === 'blank') return '<div class="sp"></div>';
      if (line.type === 'divider') return '<div class="d"></div>';
      if (line.type === 'pair') {
        return `<div class="p${line.bold ? ' b' : ''}"><span>${escapeHtml(line.left)}</span><span class="r">${escapeHtml(line.right)}</span></div>`;
      }
      const cls = ['l', line.bold ? 'b' : '', line.size === 'large' ? 'lg' : '']
        .filter(Boolean)
        .join(' ');
      return `<div class="${cls}" style="text-align:${line.align ?? 'left'}">${escapeHtml(line.text)}</div>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Struk</title><style>
@page { size: ${paper}mm auto; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${paper}mm; background: #fff; color: #000; }
body { padding: 1mm 3mm; font-family: Consolas, 'Lucida Console', 'DejaVu Sans Mono', 'Droid Sans Mono', 'Courier New', monospace;
  font-size: ${fontPt}pt; line-height: 1.12; font-weight: 700;
  /* Thermal mencetak 1-bit: pertebal goresan agar huruf tidak pudar/putus-putus. */
  -webkit-text-stroke: 0.25px #000; -webkit-font-smoothing: none;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.l { white-space: pre-wrap; word-break: break-word; }
.b { font-weight: 900; }
.lg { font-size: 1.35em; line-height: 1.1; }
.sp { height: 1mm; }
.p { display: flex; justify-content: space-between; gap: 2mm; }
.p span:first-child { min-width: 0; white-space: pre-wrap; word-break: break-word; }
.p .r { white-space: nowrap; text-align: right; }
.d { border-top: 1.5px dashed #000; margin: 0.8mm 0; }
</style></head><body>${body}</body></html>`;
}

/** Cetak lewat iframe tersembunyi agar tata letak aplikasi tidak ikut tercetak. */
/**
 * Chrome Android / iOS mengabaikan print() dari iframe dan mencetak seluruh halaman induk,
 * jadi di mobile cetak halaman langsung — CSS @media print di index.css menyembunyikan UI
 * dan hanya menampilkan `.receipt-print` selebar `--receipt-width`. Jalur ini yang dipakai
 * print service Android seperti "Open ESC/POS print service" atau RawBT.
 */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function printViaBrowser(lines: ReceiptLine[], settings: PrinterSettings): Promise<void> {
  if (isMobileBrowser()) {
    return new Promise((resolve, reject) => {
      try {
        window.print();
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(iframe);

    const cleanup = () => setTimeout(() => iframe.remove(), 1000);
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument ?? win?.document;
    if (!win || !doc) {
      iframe.remove();
      reject(new Error('Browser tidak mendukung pencetakan dari halaman ini.'));
      return;
    }

    doc.open();
    doc.write(buildReceiptHtml(lines, settings));
    doc.close();

    // Beri waktu layout/font sebelum memanggil print (Safari/Android butuh jeda).
    setTimeout(() => {
      try {
        win.focus();
        win.print();
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        cleanup();
      }
    }, 250);
  });
}

/* ------------------------------------------------------------------ */
/* Jalur 2: ESC/POS langsung (Bluetooth / USB / Serial)                */
/* ------------------------------------------------------------------ */

/* Tipe minimal Web Bluetooth / WebUSB / Web Serial (tidak ada di lib DOM bawaan TS). */
interface BtCharacteristic {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValue(data: BufferSource): Promise<void>;
  writeValueWithoutResponse?(data: BufferSource): Promise<void>;
}
interface BtService {
  getCharacteristics(): Promise<BtCharacteristic[]>;
}
interface BtServer {
  connected: boolean;
  getPrimaryServices(): Promise<BtService[]>;
}
interface BtDevice {
  name?: string;
  gatt?: { connected: boolean; connect(): Promise<BtServer> };
}
interface UsbEndpoint {
  endpointNumber: number;
  direction: 'in' | 'out';
  type: 'bulk' | 'interrupt' | 'isochronous';
}
interface UsbInterface {
  interfaceNumber: number;
  alternate: { interfaceClass: number; endpoints: UsbEndpoint[] };
}
interface UsbDevice {
  productName?: string;
  opened: boolean;
  configuration: { interfaces: UsbInterface[] } | null;
  open(): Promise<void>;
  selectConfiguration(n: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  transferOut(ep: number, data: BufferSource): Promise<unknown>;
}
interface SerialPortLike {
  readable: unknown;
  writable: WritableStream<Uint8Array> | null;
  open(opts: { baudRate: number }): Promise<void>;
  getInfo?(): { usbVendorId?: number; usbProductId?: number };
}
interface NavigatorWithDevices {
  bluetooth?: {
    requestDevice(opts: {
      acceptAllDevices: boolean;
      optionalServices: string[];
    }): Promise<BtDevice>;
  };
  usb?: {
    getDevices(): Promise<UsbDevice[]>;
    requestDevice(opts: { filters: unknown[] }): Promise<UsbDevice>;
  };
  serial?: {
    getPorts(): Promise<SerialPortLike[]>;
    requestPort(): Promise<SerialPortLike>;
  };
}

const nav = (): NavigatorWithDevices =>
  (typeof navigator !== 'undefined' ? navigator : {}) as unknown as NavigatorWithDevices;

export function isMethodSupported(method: PrintMethod): boolean {
  if (method === 'browser') return typeof window !== 'undefined';
  if (typeof window !== 'undefined' && !window.isSecureContext) return false;
  const n = nav();
  if (method === 'bluetooth') return !!n.bluetooth;
  if (method === 'usb') return !!n.usb;
  return !!n.serial;
}

/** UUID layanan BLE yang dipakai printer thermal murah/umum di pasaran. */
const BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // mayoritas printer BLE generik (Zjiang, Goojprt, POS-58)
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Xprinter / Rongta / Panda
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC/Microchip transparent UART
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / JDY UART
  '0000fee7-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb', // printer mini (Peripage/Cat-style dengan ESC/POS)
  '0000ff12-0000-1000-8000-00805f9b34fb',
];

/* Koneksi disimpan selama sesi supaya cetak berikutnya tidak perlu pilih perangkat lagi. */
let btCharacteristic: BtCharacteristic | null = null;
let btDevice: BtDevice | null = null;
let usbTarget: { device: UsbDevice; endpoint: number } | null = null;
let serialPort: SerialPortLike | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function findWritableCharacteristic(server: BtServer): Promise<BtCharacteristic> {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    const chars = await service.getCharacteristics();
    const c = chars.find((ch) => ch.properties.writeWithoutResponse || ch.properties.write);
    if (c) return c;
  }
  throw new Error('Printer Bluetooth tidak punya karakteristik tulis yang dikenali.');
}

async function connectBluetooth(forceChoose: boolean): Promise<BtCharacteristic> {
  if (!forceChoose && btCharacteristic && btDevice?.gatt?.connected) return btCharacteristic;
  const bt = nav().bluetooth;
  if (!bt) throw new Error('Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome/Edge.');

  let device = forceChoose ? null : btDevice;
  if (!device) {
    device = await bt.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_PRINTER_SERVICES,
    });
  }
  if (!device.gatt) throw new Error('Perangkat Bluetooth tidak mendukung GATT.');
  const server = await device.gatt.connect();
  btCharacteristic = await findWritableCharacteristic(server);
  btDevice = device;
  return btCharacteristic;
}

async function writeBluetooth(data: Uint8Array, forceChoose: boolean): Promise<void> {
  const ch = await connectBluetooth(forceChoose);
  const useNoResponse = ch.properties.writeWithoutResponse && !!ch.writeValueWithoutResponse;
  // BLE MTU printer murah sering 20 byte; paket kecil + jeda = paling kompatibel.
  const chunkSize = useNoResponse ? 100 : 180;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (useNoResponse) {
      await ch.writeValueWithoutResponse!(chunk);
      await sleep(20);
    } else {
      await ch.writeValue(chunk);
    }
  }
}

function pickUsbEndpoint(device: UsbDevice): { iface: number; endpoint: number } | null {
  const ifaces = device.configuration?.interfaces ?? [];
  // Utamakan interface kelas Printer (7), lalu interface apa pun dengan bulk OUT.
  const sorted = [...ifaces].sort(
    (a, b) => Number(b.alternate.interfaceClass === 7) - Number(a.alternate.interfaceClass === 7),
  );
  for (const iface of sorted) {
    const ep = iface.alternate.endpoints.find((e) => e.direction === 'out' && e.type === 'bulk');
    if (ep) return { iface: iface.interfaceNumber, endpoint: ep.endpointNumber };
  }
  return null;
}

async function connectUsb(forceChoose: boolean): Promise<{ device: UsbDevice; endpoint: number }> {
  if (!forceChoose && usbTarget?.device.opened) return usbTarget;
  const usb = nav().usb;
  if (!usb) throw new Error('Browser ini tidak mendukung WebUSB. Gunakan Chrome/Edge.');

  let device: UsbDevice | undefined;
  if (!forceChoose) [device] = await usb.getDevices();
  if (!device) device = await usb.requestDevice({ filters: [] });

  if (!device.opened) await device.open();
  if (!device.configuration) await device.selectConfiguration(1);
  const target = pickUsbEndpoint(device);
  if (!target) throw new Error('Perangkat USB ini tidak memiliki jalur keluaran printer.');
  try {
    await device.claimInterface(target.iface);
  } catch {
    throw new Error(
      'Printer USB sedang dipakai driver sistem. Pilih metode "Driver Sistem", atau di Windows ganti driver ke WinUSB (Zadig).',
    );
  }
  usbTarget = { device, endpoint: target.endpoint };
  return usbTarget;
}

async function writeUsb(data: Uint8Array, forceChoose: boolean): Promise<void> {
  const { device, endpoint } = await connectUsb(forceChoose);
  const chunkSize = 4096;
  for (let i = 0; i < data.length; i += chunkSize) {
    await device.transferOut(endpoint, data.slice(i, i + chunkSize));
  }
}

async function writeSerial(
  data: Uint8Array,
  settings: PrinterSettings,
  forceChoose: boolean,
): Promise<void> {
  const serial = nav().serial;
  if (!serial)
    throw new Error('Browser ini tidak mendukung Web Serial. Gunakan Chrome/Edge di komputer.');

  let port: SerialPortLike | null = forceChoose ? null : serialPort;
  if (!port && !forceChoose) port = (await serial.getPorts())[0] ?? null;
  if (!port) port = await serial.requestPort();

  if (!port.writable) await port.open({ baudRate: settings.baudRate });
  serialPort = port;
  const writer = port.writable!.getWriter();
  try {
    await writer.write(data);
  } finally {
    writer.releaseLock();
  }
}

/** Lupakan perangkat yang tersimpan di sesi ini (mis. ganti printer). */
export function resetPrinterConnection(): void {
  btCharacteristic = null;
  btDevice = null;
  usbTarget = null;
  serialPort = null;
}

export function getConnectedPrinterName(method: PrintMethod): string | null {
  if (method === 'bluetooth' && btDevice?.gatt?.connected)
    return btDevice.name || 'Printer Bluetooth';
  if (method === 'usb' && usbTarget?.device.opened)
    return usbTarget.device.productName || 'Printer USB';
  if (method === 'serial' && serialPort?.writable) return 'Printer Serial/COM';
  return null;
}

/**
 * Cetak struk dengan metode yang dipilih.
 * @param chooseDevice paksa dialog pilih perangkat (untuk ganti printer).
 */
export async function printReceipt(
  lines: ReceiptLine[],
  settings: PrinterSettings,
  chooseDevice = false,
): Promise<void> {
  if (settings.method === 'browser') return printViaBrowser(lines, settings);

  if (!isMethodSupported(settings.method)) {
    throw new Error(
      'Metode cetak ini tidak didukung di browser/perangkat ini. Gunakan "Driver Sistem".',
    );
  }
  const data = encodeEscPos(lines, settings);
  try {
    if (settings.method === 'bluetooth') return await writeBluetooth(data, chooseDevice);
    if (settings.method === 'usb') return await writeUsb(data, chooseDevice);
    return await writeSerial(data, settings, chooseDevice);
  } catch (err) {
    // Koneksi putus/basi → coba sekali lagi dengan koneksi baru (tanpa dialog bila perangkat diingat).
    const name = err instanceof Error ? err.name : '';
    if (name === 'NotFoundError' || name === 'SecurityError' || chooseDevice) throw err;
    if (settings.method === 'bluetooth') btCharacteristic = null;
    if (settings.method === 'usb') usbTarget = null;
    if (settings.method === 'serial') serialPort = null;
    if (settings.method === 'bluetooth') return writeBluetooth(data, false);
    if (settings.method === 'usb') return writeUsb(data, false);
    return writeSerial(data, settings, false);
  }
}

/** Pesan error yang ramah untuk kasir. */
export function describePrintError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'NotFoundError') return 'Tidak ada printer yang dipilih.';
    if (err.name === 'SecurityError') return 'Izin akses printer ditolak browser.';
    if (err.name === 'NetworkError')
      return 'Koneksi ke printer terputus. Nyalakan printer lalu coba lagi.';
    return err.message;
  }
  return 'Gagal mencetak struk.';
}

/** Struk uji untuk mengecek lebar kertas & koneksi. */
export function buildTestReceipt(settings: PrinterSettings): ReceiptLine[] {
  const width = resolveCharsPerLine(settings);
  return [
    { type: 'text', text: 'TES PRINTER', align: 'center', bold: true, size: 'large' },
    { type: 'text', text: `Kertas ${settings.paperWidthMm}mm - ${width} kolom`, align: 'center' },
    { type: 'divider' },
    { type: 'text', text: '1234567890'.repeat(Math.ceil(width / 10)).slice(0, width) },
    { type: 'pair', left: 'Kiri', right: 'Kanan' },
    { type: 'pair', left: 'Total', right: 'Rp 123.456', bold: true },
    { type: 'divider' },
    {
      type: 'text',
      text: 'Bila baris angka di atas pas satu baris, pengaturan sudah benar.',
      align: 'center',
    },
  ];
}
