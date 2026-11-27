import * as React from 'react';
import {
  PrinterSettings,
  PrintMethod,
  isMethodSupported,
  resolveCharsPerLine,
  sanitizeSettings,
} from '@/utils/thermalPrinter';

interface Props {
  settings: PrinterSettings;
  onChange: (next: PrinterSettings) => void;
  onTestPrint: () => void;
  onChooseDevice: () => void;
  connectedName: string | null;
  busy?: boolean;
  /** Ganti pembungkus (mis. tanpa border saat sudah di dalam kartu). */
  className?: string;
}

const METHODS: { value: PrintMethod; label: string; hint: string }[] = [
  {
    value: 'browser',
    label: 'Driver Sistem (semua printer)',
    hint: 'Pakai dialog cetak bawaan. Cocok untuk printer USB/LAN/Bluetooth yang sudah terpasang driver-nya, atau Android dengan aplikasi print service seperti "Open ESC/POS print service" atau RawBT (pilih printernya di dialog cetak, samakan lebar kertas di aplikasi tersebut).',
  },
  {
    value: 'bluetooth',
    label: 'Bluetooth langsung (ESC/POS)',
    hint: 'Tanpa driver. Untuk printer thermal Bluetooth (BLE). Chrome/Edge di Android, Windows, atau macOS.',
  },
  {
    value: 'usb',
    label: 'USB langsung (ESC/POS)',
    hint: 'Tanpa driver. Chrome/Edge. Di Windows, printer yang sudah memakai driver sistem tidak bisa diakses — gunakan Driver Sistem.',
  },
  {
    value: 'serial',
    label: 'Serial / COM / Bluetooth klasik (ESC/POS)',
    hint: 'Untuk printer port COM, USB-to-Serial, atau Bluetooth klasik yang sudah di-pair sebagai port COM. Chrome/Edge di komputer.',
  },
];

const PAPER_PRESETS = [58, 80];

const PrinterSettingsPanel: React.FC<Props> = ({
  settings,
  onChange,
  onTestPrint,
  onChooseDevice,
  connectedName,
  busy,
  className = 'mt-6 space-y-4 rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-700',
}) => {
  const update = (patch: Partial<PrinterSettings>) =>
    onChange(sanitizeSettings({ ...settings, ...patch }));
  const isCustomPaper = !PAPER_PRESETS.includes(settings.paperWidthMm);
  const selected = METHODS.find((m) => m.value === settings.method) ?? METHODS[0];
  const isDirect = settings.method !== 'browser';

  return (
    <div className={`${className} print-hide`}>
      <div>
        <label htmlFor="printer-method" className="form-label">
          Metode cetak
        </label>
        <select
          id="printer-method"
          className="form-input"
          value={settings.method}
          onChange={(e) => update({ method: e.target.value as PrintMethod })}
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value} disabled={!isMethodSupported(m.value)}>
              {m.label}
              {isMethodSupported(m.value) ? '' : ' — tidak didukung browser ini'}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selected.hint}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="printer-paper" className="form-label">
            Lebar kertas
          </label>
          <select
            id="printer-paper"
            className="form-input"
            value={isCustomPaper ? 'custom' : String(settings.paperWidthMm)}
            onChange={(e) =>
              update({
                paperWidthMm: e.target.value === 'custom' ? 76 : Number(e.target.value),
                charsPerLine: 0,
              })
            }
          >
            <option value="58">58 mm</option>
            <option value="80">80 mm</option>
            <option value="custom">Lainnya…</option>
          </select>
        </div>
        {isCustomPaper ? (
          <div>
            <label htmlFor="printer-paper-custom" className="form-label">
              Lebar (mm)
            </label>
            <input
              id="printer-paper-custom"
              type="number"
              min={40}
              max={120}
              className="form-input"
              value={settings.paperWidthMm}
              onChange={(e) => update({ paperWidthMm: Number(e.target.value) || 58 })}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="printer-cols" className="form-label">
              Karakter/baris
            </label>
            <input
              id="printer-cols"
              type="number"
              min={16}
              max={80}
              className="form-input"
              placeholder={`Otomatis (${resolveCharsPerLine({ ...settings, charsPerLine: 0 })})`}
              value={settings.charsPerLine || ''}
              onChange={(e) => update({ charsPerLine: Number(e.target.value) || 0 })}
            />
          </div>
        )}
      </div>

      {isDirect && (
        <div className="grid grid-cols-2 gap-3">
          {settings.method === 'serial' && (
            <div>
              <label htmlFor="printer-baud" className="form-label">
                Baud rate
              </label>
              <select
                id="printer-baud"
                className="form-input"
                value={settings.baudRate}
                onChange={(e) => update({ baudRate: Number(e.target.value) })}
              >
                {[9600, 19200, 38400, 57600, 115200].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="printer-feed" className="form-label">
              Baris kosong akhir
            </label>
            <input
              id="printer-feed"
              type="number"
              min={0}
              max={10}
              className="form-input"
              value={settings.feedLines}
              onChange={(e) => update({ feedLines: Number(e.target.value) })}
            />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={settings.autoCut}
              onChange={(e) => update({ autoCut: e.target.checked })}
            />
            Potong kertas otomatis (jika printer punya cutter)
          </label>
          <label className="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={settings.darkPrint}
              onChange={(e) => update({ darkPrint: e.target.checked })}
            />
            Cetak pekat (huruf lebih hitam, sedikit lebih lambat)
          </label>
          <label className="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={settings.compactLines}
              onChange={(e) => update({ compactLines: e.target.checked })}
            />
            Jarak baris rapat (struk lebih pendek)
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onTestPrint}
          disabled={busy}
        >
          Tes cetak
        </button>
        {isDirect && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onChooseDevice}
            disabled={busy}
          >
            {connectedName ? 'Ganti printer' : 'Pilih printer'}
          </button>
        )}
        {isDirect && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {connectedName ? `Terhubung: ${connectedName}` : 'Belum terhubung'}
          </span>
        )}
      </div>
    </div>
  );
};

export default PrinterSettingsPanel;
