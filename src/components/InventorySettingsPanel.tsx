import React from 'react';
import { InventoryDeductAt, InventorySettings, InventoryStockGuard } from '../types';
import {
  DEDUCT_AT_LABELS,
  STOCK_GUARD_LABELS,
  useInventorySettings,
  useInventorySettingsMutation,
} from '../contexts/InventoryRecipeContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useToasts from '../contexts/useToasts';

interface InventorySettingsPanelProps {
  storeId: string;
}

const DEDUCT_AT_OPTIONS: [InventoryDeductAt, string][] = [
  ['dibuat', 'Langsung saat kasir menyimpan nota'],
  ['siap_diambil', 'Saat cucian ditandai siap diambil'],
  ['selesai', 'Saat nota diserahkan / selesai'],
];

const STOCK_GUARD_OPTIONS: [InventoryStockGuard, string][] = [
  ['bebas', 'Stok tetap dipotong walau jadi minus'],
  ['peringatan', 'Kasir diberi peringatan, nota tetap bisa disimpan'],
  ['tahan', 'Nota / status ditolak sampai stok ditambah'],
];

/** Saklar utama, waktu pemotongan, dan aturan stok kurang untuk satu cabang. */
const InventorySettingsPanel: React.FC<InventorySettingsPanelProps> = ({ storeId }) => {
  const { data: settings, isLoading, isError } = useInventorySettings(storeId);
  const { saveSettings, isSaving } = useInventorySettingsMutation();
  const { addAuditLog } = useAuditLogs();
  const { addToast } = useToasts();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Memuat pengaturan…</p>;
  }
  if (isError || !settings) {
    return (
      <p className="text-sm rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2">
        Pengaturan potong stok belum bisa dimuat. Pastikan pembaruan database terbaru sudah
        dijalankan.
      </p>
    );
  }

  const update = async (patch: Partial<InventorySettings>, description: string) => {
    try {
      await saveSettings({ ...settings, ...patch });
      addAuditLog(`Mengubah pengaturan potong stok otomatis: ${description}.`, storeId);
      addToast('Pengaturan potong stok tersimpan.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan.', 'error');
    }
  };

  const disabled = isSaving || !settings.autoDeductEnabled;

  return (
    <section
      aria-label="Pengaturan potong stok cabang"
      className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
    >
      <label className="flex items-start justify-between gap-3 cursor-pointer">
        <span>
          <span className="block font-semibold text-slate-800 dark:text-slate-100">
            Potong stok otomatis
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {settings.autoDeductEnabled
              ? 'Aktif untuk cabang ini.'
              : 'Mati: nota tidak memotong stok. Potongan yang sudah terjadi tidak diubah.'}
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="mt-1 h-5 w-5 flex-shrink-0"
          checked={settings.autoDeductEnabled}
          disabled={isSaving}
          onChange={(e) =>
            update(
              { autoDeductEnabled: e.target.checked },
              e.target.checked ? 'diaktifkan' : 'dimatikan',
            )
          }
        />
      </label>

      <fieldset disabled={disabled} className={disabled ? 'opacity-60' : ''}>
        <legend className="form-label">Waktu pemotongan</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {DEDUCT_AT_OPTIONS.map(([value, hint]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-lg border p-2 text-sm ${
                settings.deductAt === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="inventory-deduct-at"
                value={value}
                checked={settings.deductAt === value}
                onChange={() =>
                  update({ deductAt: value }, `waktu potong ${DEDUCT_AT_LABELS[value]}`)
                }
                className="sr-only"
              />
              <span className="block font-medium text-slate-800 dark:text-slate-100">
                {DEDUCT_AT_LABELS[value]}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={disabled} className={disabled ? 'opacity-60' : ''}>
        <legend className="form-label">Bila stok bahan kurang</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {STOCK_GUARD_OPTIONS.map(([value, hint]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-lg border p-2 text-sm ${
                settings.stockGuard === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="inventory-stock-guard"
                value={value}
                checked={settings.stockGuard === value}
                onChange={() =>
                  update({ stockGuard: value }, `bila stok kurang: ${STOCK_GUARD_LABELS[value]}`)
                }
                className="sr-only"
              />
              <span className="block font-medium text-slate-800 dark:text-slate-100">
                {STOCK_GUARD_LABELS[value]}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {settings.autoDeductEnabled && settings.deductAt !== 'dibuat' && (
        <p className="text-xs rounded bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-2">
          Nota yang mundur ke status sebelumnya akan mengembalikan stoknya. Nota yang sudah
          terpotong sebelum pengaturan ini diubah tidak dipotong dua kali.
        </p>
      )}
    </section>
  );
};

export default InventorySettingsPanel;
