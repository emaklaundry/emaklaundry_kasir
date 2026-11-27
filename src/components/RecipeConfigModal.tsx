import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from './Modal';
import { EditIcon, Trash2Icon, PlusIcon, BoltIcon } from './icons';
import { InventoryRecipe, InventoryRecipeBasis } from '../types';
import { fetchInventory } from '../contexts/InventoryContext';
import { useRecipes, useRecipeMutations, RecipeInput } from '../contexts/InventoryRecipeContext';
import { useServices } from '../contexts/ServiceContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useToasts from '../contexts/useToasts';
import { formatQty } from '../utils/inventoryFormat';
import InventorySettingsPanel from './InventorySettingsPanel';

interface RecipeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

type FormState = {
  id?: string;
  inventoryItemId: string;
  serviceId: string; // '' = semua layanan
  basis: InventoryRecipeBasis;
  amount: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  inventoryItemId: '',
  serviceId: '',
  basis: 'per_unit',
  amount: '',
  isActive: true,
};

/**
 * Atur bahan yang dipotong otomatis setiap nota dibuat.
 * Perhitungan dijalankan oleh database, jadi berlaku untuk semua kasir & perangkat.
 */
const RecipeConfigModal: React.FC<RecipeConfigModalProps> = ({ isOpen, onClose, storeId }) => {
  const { data: recipes = [], isLoading: loadingRecipes } = useRecipes(storeId);
  const { saveRecipe, deleteRecipe, isLoading: saving } = useRecipeMutations();
  const { services } = useServices();
  const { addAuditLog } = useAuditLogs();
  const { addToast } = useToasts();
  // Semua item cabang, bukan hanya halaman tabel yang sedang tampil.
  const { data: inventoryResult } = useQuery({
    queryKey: ['inventory', { page: 1, pageSize: 1000, storeId }],
    queryFn: () => fetchInventory({ page: 1, pageSize: 1000, storeId }),
    enabled: isOpen,
  });
  const inventoryItems = useMemo(() => inventoryResult?.data ?? [], [inventoryResult]);

  const [form, setForm] = useState<FormState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const storeServices = useMemo(
    () =>
      services
        .filter((s) => !s.storeId || s.storeId === storeId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [services, storeId],
  );
  const itemById = useMemo(
    () => new Map(inventoryItems.map((i) => [i.id, i] as const)),
    [inventoryItems],
  );
  const serviceById = useMemo(
    () => new Map(storeServices.map((s) => [s.id, s] as const)),
    [storeServices],
  );

  const describeScope = (serviceId: string | null) =>
    serviceId ? (serviceById.get(serviceId)?.name ?? 'Layanan terhapus') : 'Semua layanan';

  const describeRule = (
    r: Pick<InventoryRecipe, 'amount' | 'basis' | 'serviceId' | 'inventoryItemId'>,
  ) => {
    const unit = itemById.get(r.inventoryItemId)?.unit;
    const serviceUnit = r.serviceId ? serviceById.get(r.serviceId)?.unit : undefined;
    const per = r.basis === 'per_unit' ? `per ${serviceUnit || 'kg/pcs'}` : 'per nota';
    return `${formatQty(r.amount)} ${unit ?? ''} ${per}`.replace(/\s+/g, ' ');
  };

  const sortedRecipes = useMemo(
    () =>
      [...recipes].sort((a, b) =>
        (itemById.get(a.inventoryItemId)?.name ?? '').localeCompare(
          itemById.get(b.inventoryItemId)?.name ?? '',
        ),
      ),
    [recipes, itemById],
  );

  const startEdit = (r: InventoryRecipe) => {
    setConfirmDeleteId(null);
    setForm({
      id: r.id,
      inventoryItemId: r.inventoryItemId,
      serviceId: r.serviceId ?? '',
      basis: r.basis,
      amount: String(r.amount),
      isActive: r.isActive,
    });
  };

  const amountValue = form ? parseFloat(form.amount.replace(',', '.')) : NaN;
  const formItem = form ? itemById.get(form.inventoryItemId) : undefined;
  const formService = form?.serviceId ? serviceById.get(form.serviceId) : undefined;
  const preview = (() => {
    if (!form || !formItem || !(amountValue > 0)) return null;
    if (form.basis === 'per_transaksi') {
      return `Setiap nota${formService ? ` berisi "${formService.name}"` : ''}, stok ${formItem.name} berkurang ${formatQty(amountValue)} ${formItem.unit}.`;
    }
    const exampleQty =
      formService?.minQuantity && formService.minQuantity > 0 ? formService.minQuantity : 3;
    const unit = formService?.unit || 'kg';
    return `Contoh: nota ${formatQty(exampleQty)} ${unit}${formService ? ` "${formService.name}"` : ''} → stok ${formItem.name} berkurang ${formatQty(amountValue * exampleQty)} ${formItem.unit}.`;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.inventoryItemId) {
      addToast('Pilih bahan yang akan dipotong.', 'warning');
      return;
    }
    if (!(amountValue > 0)) {
      addToast('Takaran harus lebih dari 0.', 'warning');
      return;
    }
    const input: RecipeInput = {
      id: form.id,
      inventoryItemId: form.inventoryItemId,
      serviceId: form.serviceId || null,
      basis: form.basis,
      amount: Math.round(amountValue * 1000) / 1000,
      isActive: form.isActive,
    };
    try {
      await saveRecipe(input);
      addAuditLog(
        `${form.id ? 'Mengubah' : 'Menambah'} aturan potong stok otomatis: ${formItem?.name} ${describeRule(input)} (${describeScope(input.serviceId)}).`,
        storeId,
      );
      addToast('Aturan potong stok tersimpan.', 'success');
      setForm(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Gagal menyimpan aturan.', 'error');
    }
  };

  const handleToggle = async (r: InventoryRecipe) => {
    try {
      await saveRecipe({ ...r, isActive: !r.isActive });
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Gagal mengubah status.', 'error');
    }
  };

  const handleDelete = async (r: InventoryRecipe) => {
    try {
      await deleteRecipe(r.id);
      addAuditLog(
        `Menghapus aturan potong stok otomatis: ${itemById.get(r.inventoryItemId)?.name ?? 'item'} (${describeScope(r.serviceId)}).`,
        storeId,
      );
      addToast('Aturan dihapus.', 'success');
    } catch {
      addToast('Gagal menghapus aturan.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Potong Stok Otomatis"
      footer={
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Tutup
        </button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Nota otomatis mengurangi stok bahan sesuai aturan di bawah, pada waktu yang Anda pilih.
          Bila item nota diubah atau nota dihapus, stok ikut dikoreksi. Semua potongan tercatat
          di <strong>Riwayat</strong> tiap item.
        </p>

        <InventorySettingsPanel storeId={storeId} />

        {form ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
          >
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              {form.id ? 'Ubah Aturan' : 'Aturan Baru'}
            </h3>
            <div>
              <label htmlFor="recipe-item" className="form-label">
                Bahan yang dipotong
              </label>
              <select
                id="recipe-item"
                className="form-input"
                value={form.inventoryItemId}
                onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })}
                required
              >
                <option value="">— Pilih bahan —</option>
                {inventoryItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="recipe-service" className="form-label">
                Berlaku untuk layanan
              </label>
              <select
                id="recipe-service"
                className="form-input"
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              >
                <option value="">Semua layanan</option>
                {storeServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.unit})
                  </option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="form-label">Dasar hitung</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['per_unit', 'Per kg / pcs', 'Dikali jumlah di nota'],
                    ['per_transaksi', 'Per nota', 'Sekali tiap nota'],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-lg border p-2 text-sm ${
                      form.basis === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recipe-basis"
                      value={value}
                      checked={form.basis === value}
                      onChange={() => setForm({ ...form, basis: value })}
                      className="sr-only"
                    />
                    <span className="block font-medium text-slate-800 dark:text-slate-100">
                      {label}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="recipe-amount" className="form-label">
                Takaran
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="recipe-amount"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className="form-input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="mis. 0,5"
                  required
                />
                <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {formItem?.unit ?? 'satuan'}{' '}
                  {form.basis === 'per_unit' ? `/ ${formService?.unit || 'kg'}` : '/ nota'}
                </span>
              </div>
            </div>
            {preview && (
              <p className="text-xs rounded bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-2">
                {preview}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setForm(null)}
              >
                Batal
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan Aturan'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm w-full"
            onClick={() => setForm(EMPTY_FORM)}
            disabled={inventoryItems.length === 0}
          >
            <PlusIcon className="w-4 h-4" /> Tambah Aturan
          </button>
        )}

        {loadingRecipes ? (
          <p className="text-center py-6 text-slate-500">Memuat aturan…</p>
        ) : sortedRecipes.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
            <BoltIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            Belum ada aturan. Contoh: <em>Sabun 1 sachet per 3 kg</em> → takaran 0,333 per kg, atau{' '}
            <em>Plastik packing 1 lembar per nota</em>.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {sortedRecipes.map((r) => {
              const item = itemById.get(r.inventoryItemId);
              return (
                <li key={r.id} className={`py-3 ${r.isActive ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                        {item?.name ?? 'Item terhapus'}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {describeRule(r)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {describeScope(r.serviceId)}
                        {!r.isActive && ' · nonaktif'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <label className="flex items-center gap-1 text-xs text-slate-500 mr-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.isActive}
                          onChange={() => handleToggle(r)}
                          disabled={saving}
                          aria-label={`Aktifkan aturan ${item?.name ?? ''}`}
                        />
                        Aktif
                      </label>
                      <button
                        type="button"
                        aria-label={`Ubah aturan ${item?.name ?? ''}`}
                        className="btn btn-ghost btn-icon"
                        onClick={() => startEdit(r)}
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus aturan ${item?.name ?? ''}`}
                        className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
                        onClick={() => setConfirmDeleteId(r.id)}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {confirmDeleteId === r.id && (
                    <div className="mt-2 flex items-center justify-end gap-2 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Hapus aturan ini?</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(r)}
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default RecipeConfigModal;
