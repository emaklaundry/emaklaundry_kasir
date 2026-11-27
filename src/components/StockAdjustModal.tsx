import React, { useState } from 'react';
import Modal from './Modal';
import { InventoryItem, StockAdjustMode } from '../types';
import { useStockAdjust } from '../contexts/InventoryRecipeContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useToasts from '../contexts/useToasts';
import { formatQty, formatQtyDelta } from '../utils/inventoryFormat';

interface StockAdjustModalProps {
  item: InventoryItem;
  onClose: () => void;
  /** Mode awal, mis. 'tambah' dari tombol Restok. */
  initialMode?: StockAdjustMode;
}

const MODES: { value: StockAdjustMode; label: string; hint: string }[] = [
  { value: 'tambah', label: 'Restok', hint: 'Barang masuk' },
  { value: 'kurang', label: 'Kurangi', hint: 'Rusak / terpakai' },
  { value: 'set', label: 'Atur', hint: 'Jadi angka ini' },
];

/** Penyesuaian stok manual yang tercatat di riwayat (RPC adjust_inventory_stock). */
const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  item,
  onClose,
  initialMode = 'tambah',
}) => {
  const { adjustStock, isLoading } = useStockAdjust();
  const { addAuditLog } = useAuditLogs();
  const { addToast } = useToasts();
  const [mode, setMode] = useState<StockAdjustMode>(initialMode);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');

  const parsed = parseFloat(value.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed >= 0 && (mode === 'set' || parsed > 0);
  const nextStock = !valid
    ? item.stock
    : mode === 'tambah'
      ? item.stock + parsed
      : mode === 'kurang'
        ? item.stock - parsed
        : parsed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      addToast('Masukkan jumlah yang valid.', 'warning');
      return;
    }
    try {
      const result = await adjustStock({
        itemId: item.id,
        mode,
        value: Math.round(parsed * 1000) / 1000,
        note: note.trim() || undefined,
      });
      addAuditLog(
        `${MODES.find((m) => m.value === mode)?.label} stok "${item.name}": ${formatQty(item.stock)} → ${formatQty(result)} ${item.unit}${note.trim() ? ` (${note.trim()})` : ''}.`,
        item.storeId,
      );
      addToast(`Stok ${item.name} sekarang ${formatQty(result)} ${item.unit}.`, 'success');
      onClose();
    } catch (error) {
      addToast(
        `Gagal menyesuaikan stok: ${error instanceof Error ? error.message : 'coba lagi'}`,
        'error',
      );
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Sesuaikan Stok · ${item.name}`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            type="submit"
            form="stock-adjust-form"
            className="btn btn-primary"
            disabled={isLoading || !valid}
          >
            {isLoading ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <form id="stock-adjust-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Jenis penyesuaian">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => setMode(m.value)}
              className={`rounded-lg border p-2 text-left text-sm ${
                mode === m.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <span className="block font-medium text-slate-800 dark:text-slate-100">
                {m.label}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{m.hint}</span>
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="stock-adjust-value" className="form-label">
            {mode === 'set' ? 'Stok baru' : 'Jumlah'} ({item.unit})
          </label>
          <input
            id="stock-adjust-value"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            autoFocus
            className="form-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="stock-adjust-note" className="form-label">
            Catatan (opsional)
          </label>
          <input
            id="stock-adjust-note"
            type="text"
            className="form-input"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === 'tambah' ? 'mis. Beli di toko A' : 'mis. Kemasan bocor'}
          />
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 text-sm flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">
            {formatQty(item.stock)} →{' '}
            <strong className="text-slate-900 dark:text-white">{formatQty(nextStock)}</strong>{' '}
            {item.unit}
          </span>
          {valid && (
            <span
              className={
                nextStock - item.stock >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }
            >
              {formatQtyDelta(nextStock - item.stock)}
            </span>
          )}
        </div>
        {nextStock < 0 && (
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Stok akan minus. Sebaiknya lakukan stock opname untuk mencocokkan stok fisik.
          </p>
        )}
      </form>
    </Modal>
  );
};

export default StockAdjustModal;
