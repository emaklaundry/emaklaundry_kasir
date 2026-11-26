/**
 * Backup Utility Functions
 * Export and import application data in JSON format.
 *
 * Catatan penting tentang database (dicek terhadap skema live):
 * - Supabase membatasi satu SELECT ke 1.000 baris, jadi semua pembacaan memakai paginasi.
 * - `settings.id` dan `audit_logs.id` adalah IDENTITY ALWAYS: id dari backup tidak bisa
 *   di-insert, sehingga settings dipulihkan per cabang (update jika ada, insert jika belum).
 * - Trigger `set_invoice_code` selalu membuat kode invoice baru saat INSERT, dan pada
 *   upsert nilai itu ikut ke klausa UPDATE. Karena itu `invoiceCode` tidak dikirim saat
 *   restore supaya kode invoice transaksi yang sudah ada tidak berubah.
 * - Trigger `prevent_immutable_transaction_update` melarang selain Super Admin mengubah
 *   total/items/customerId/storeId transaksi, jadi Admin hanya bisa menambah transaksi
 *   yang belum ada.
 */

import { supabase } from '@/utils/supabaseClient';

export type BackupRow = Record<string, unknown>;

export interface BackupData {
  version: string;
  exportedAt: string;
  /** Cabang yang di-backup; null berarti semua cabang. */
  storeId?: string | null;
  /** Tabel yang tidak ada di database saat backup dibuat. */
  skippedTables?: string[];
  data: Record<string, unknown[]>;
}

type RestoreMode = 'upsert' | 'settings' | 'skip';

export interface BackupTableSpec {
  name: string;
  label: string;
  /** Kolom cabang pada tabel ini, untuk backup/restore per cabang. */
  storeColumn?: 'storeId' | 'store_id';
  /** Tabel anak tanpa kolom cabang: disaring lewat baris induknya. */
  parent?: { table: string; column: string };
  /** Tabel yang belum tentu ada di setiap database. */
  optional?: boolean;
  /** Wajib ada di file backup agar file dianggap valid. */
  required?: boolean;
  restore: RestoreMode;
}

/**
 * Urutan ini juga urutan restore, disusun mengikuti foreign key
 * (induk selalu sebelum anak).
 */
export const BACKUP_TABLES: BackupTableSpec[] = [
  { name: 'stores', label: 'Cabang', restore: 'upsert', required: true },
  {
    name: 'settings',
    label: 'Pengaturan',
    storeColumn: 'storeId',
    restore: 'settings',
    required: true,
  },
  {
    name: 'customers',
    label: 'Pelanggan',
    storeColumn: 'storeId',
    restore: 'upsert',
    required: true,
  },
  {
    name: 'services',
    label: 'Layanan',
    storeColumn: 'storeId',
    restore: 'upsert',
    required: true,
  },
  {
    name: 'inventory_items',
    label: 'Inventori',
    storeColumn: 'storeId',
    restore: 'upsert',
    required: true,
  },
  { name: 'assets', label: 'Aset', storeColumn: 'storeId', restore: 'upsert', required: true },
  {
    name: 'scheduled_maintenances',
    label: 'Jadwal Perawatan',
    parent: { table: 'assets', column: 'assetId' },
    restore: 'upsert',
  },
  {
    name: 'monthly_expense_templates',
    label: 'Template Biaya Bulanan',
    storeColumn: 'store_id',
    restore: 'upsert',
  },
  {
    name: 'expenses',
    label: 'Pengeluaran',
    storeColumn: 'storeId',
    restore: 'upsert',
    required: true,
  },
  {
    name: 'transactions',
    label: 'Transaksi',
    storeColumn: 'storeId',
    restore: 'upsert',
    required: true,
  },
  { name: 'employees', label: 'Karyawan', storeColumn: 'store_id', restore: 'upsert' },
  {
    name: 'attendance',
    label: 'Absensi',
    parent: { table: 'employees', column: 'employee_id' },
    restore: 'upsert',
  },
  {
    name: 'advances',
    label: 'Kasbon',
    parent: { table: 'employees', column: 'employee_id' },
    restore: 'upsert',
  },
  {
    name: 'payroll',
    label: 'Penggajian',
    parent: { table: 'employees', column: 'employee_id' },
    restore: 'upsert',
  },
  {
    name: 'inventory_recipes',
    label: 'Resep Inventori',
    storeColumn: 'store_id',
    restore: 'upsert',
    optional: true,
  },
  {
    name: 'stock_opname',
    label: 'Stock Opname',
    storeColumn: 'store_id',
    restore: 'upsert',
    optional: true,
  },
  {
    name: 'inventory_usage_log',
    label: 'Log Pemakaian Inventori',
    storeColumn: 'store_id',
    restore: 'upsert',
    optional: true,
  },
  { name: 'standard_operating_procedures', label: 'SOP', restore: 'upsert', optional: true },
  // Hanya untuk arsip: akun terikat ke Supabase Auth dan log audit bersifat append-only.
  { name: 'profiles', label: 'Akun Login (arsip)', storeColumn: 'store_id', restore: 'skip' },
  { name: 'audit_logs', label: 'Log Audit (arsip)', storeColumn: 'storeId', restore: 'skip' },
];

const PAGE_SIZE = 1000;
const UPSERT_BATCH_SIZE = 500;
const ID_FILTER_CHUNK = 150;
const MAX_ERRORS_PER_TABLE = 5;

// ============================================
// Loosely typed Supabase access (nama tabel dinamis)
// ============================================

interface PgError {
  code?: string;
  message: string;
  details?: string | null;
}
interface LooseResult {
  data: BackupRow[] | null;
  error: PgError | null;
}
interface LooseQuery extends PromiseLike<LooseResult> {
  eq(column: string, value: unknown): LooseQuery;
  is(column: string, value: null): LooseQuery;
  in(column: string, values: unknown[]): LooseQuery;
  order(column: string, options?: { ascending?: boolean }): LooseQuery;
  range(from: number, to: number): LooseQuery;
  limit(count: number): LooseQuery;
  select(columns?: string): LooseQuery;
}
interface LooseTable {
  select(columns?: string): LooseQuery;
  upsert(
    rows: BackupRow[] | BackupRow,
    options?: { onConflict?: string; ignoreDuplicates?: boolean },
  ): LooseQuery;
  insert(rows: BackupRow[] | BackupRow): LooseQuery;
  update(row: BackupRow): LooseQuery;
}

const table = (name: string): LooseTable =>
  (supabase as unknown as { from(name: string): LooseTable }).from(name);

export function isMissingTableError(error: PgError | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    /could not find the table|does not exist/i.test(error.message)
  );
}

class MissingTableError extends Error {}

type RowFilter =
  | { column: string; value: string }
  | { column: string; values: string[] }
  | undefined;

/**
 * Ambil semua baris sebuah tabel dengan paginasi (melewati batas 1.000 baris Supabase).
 * Melempar error bila query gagal, supaya backup tidak diam-diam kosong.
 */
export async function fetchAllRows(
  tableName: string,
  options: { filter?: RowFilter; columns?: string; orderBy?: string } = {},
): Promise<BackupRow[]> {
  const { filter, columns = '*', orderBy = 'id' } = options;

  if (filter && 'values' in filter) {
    // Daftar id dipecah supaya URL request tidak terlalu panjang.
    const rows: BackupRow[] = [];
    for (let i = 0; i < filter.values.length; i += ID_FILTER_CHUNK) {
      const chunk = filter.values.slice(i, i + ID_FILTER_CHUNK);
      rows.push(
        ...(await fetchPaged(tableName, columns, orderBy, (q) => q.in(filter.column, chunk))),
      );
    }
    return rows;
  }

  return fetchPaged(tableName, columns, orderBy, (q) =>
    filter ? q.eq(filter.column, filter.value) : q,
  );
}

async function fetchPaged(
  tableName: string,
  columns: string,
  orderBy: string,
  applyFilter: (query: LooseQuery) => LooseQuery,
): Promise<BackupRow[]> {
  const rows: BackupRow[] = [];
  for (let page = 0; ; page++) {
    let query = applyFilter(table(tableName).select(columns));
    query = query.order(orderBy, { ascending: true });
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) throw new MissingTableError(tableName);
      throw new Error(`Gagal membaca ${tableName}: ${error.message}`);
    }
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return rows;
}

const normalizeStoreId = (storeId?: string | null): string | null =>
  storeId && storeId !== 'all' ? storeId : null;

/**
 * Export data dari Supabase ke format JSON.
 * @param options.storeId cabang yang di-backup; kosong/'all' = semua cabang.
 */
export async function exportBackup(
  options: {
    storeId?: string | null;
    onProgress?: (label: string, percent: number) => void;
  } = {},
): Promise<BackupData> {
  const storeId = normalizeStoreId(options.storeId);
  const data: Record<string, unknown[]> = {};
  const skippedTables: string[] = [];

  for (const [index, spec] of BACKUP_TABLES.entries()) {
    options.onProgress?.(spec.label, Math.round((index / BACKUP_TABLES.length) * 100));

    let filter: RowFilter;
    if (storeId) {
      if (spec.name === 'stores') filter = { column: 'id', value: storeId };
      else if (spec.storeColumn) filter = { column: spec.storeColumn, value: storeId };
      else if (spec.parent) {
        const parentIds = ((data[spec.parent.table] ?? []) as BackupRow[]).map((r) =>
          String(r.id),
        );
        filter = { column: spec.parent.column, values: parentIds };
      }
    }

    try {
      data[spec.name] = await fetchAllRows(spec.name, { filter });
    } catch (error) {
      if (error instanceof MissingTableError && (spec.optional || !spec.required)) {
        skippedTables.push(spec.name);
        continue;
      }
      if (error instanceof MissingTableError) {
        throw new Error(`Tabel ${spec.name} tidak ditemukan di database.`);
      }
      throw error;
    }
  }

  options.onProgress?.('Selesai', 100);

  return {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    storeId,
    skippedTables,
    data,
  };
}

/**
 * Download backup as JSON file
 */
export function downloadBackup(backup: BackupData, filename?: string): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const defaultFilename = `backup_emaklaundry_${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const isPlainObject = (value: unknown): value is BackupRow =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Validate backup file structure
 */
export function validateBackup(data: unknown): data is BackupData {
  if (!isPlainObject(data)) return false;
  const backup = data as unknown as BackupData;

  if (typeof backup.version !== 'string' || typeof backup.exportedAt !== 'string') return false;
  if (Number.isNaN(new Date(backup.exportedAt).getTime())) return false;
  if (!isPlainObject(backup.data)) return false;

  for (const spec of BACKUP_TABLES) {
    const rows = backup.data[spec.name];
    if (rows === undefined) {
      if (spec.required) return false;
      continue;
    }
    if (!Array.isArray(rows) || !rows.every(isPlainObject)) return false;
  }

  return true;
}

// ============================================
// Restore
// ============================================

export interface UpsertResult {
  saved: number;
  failed: number;
  errors: string[];
}

/**
 * Upsert dalam batch. Jika satu batch gagal, baris di batch itu dicoba satu per satu
 * supaya satu baris bermasalah tidak menggagalkan ratusan baris lainnya.
 */
export async function upsertInBatches(
  tableName: string,
  rows: BackupRow[],
  options: { ignoreDuplicates?: boolean; onConflict?: string } = {},
): Promise<UpsertResult> {
  const { ignoreDuplicates = false, onConflict = 'id' } = options;
  const result: UpsertResult = { saved: 0, failed: 0, errors: [] };

  const pushError = (message: string) => {
    if (result.errors.length < MAX_ERRORS_PER_TABLE) result.errors.push(message);
  };

  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const { error } = await table(tableName).upsert(batch, { onConflict, ignoreDuplicates });
    if (!error) {
      result.saved += batch.length;
      continue;
    }

    for (const row of batch) {
      const { error: rowError } = await table(tableName).upsert(row, {
        onConflict,
        ignoreDuplicates,
      });
      if (rowError) {
        result.failed++;
        pushError(`${String(row.id ?? '?')}: ${rowError.message}`);
      } else {
        result.saved++;
      }
    }
  }

  return result;
}

/** Hilangkan duplikat id (Postgres menolak upsert yang menyentuh baris sama dua kali). */
export function dedupeById(rows: BackupRow[]): BackupRow[] {
  const map = new Map<string, BackupRow>();
  rows.forEach((row, index) => map.set(row.id != null ? String(row.id) : `__noid_${index}`, row));
  return Array.from(map.values());
}

/** Ambil id profil yang ada, untuk mengosongkan referensi user yang tidak ada lagi. */
export async function fetchExistingProfileIds(): Promise<Set<string>> {
  const rows = await fetchAllRows('profiles', { columns: 'id' });
  return new Set(rows.map((r) => String(r.id)));
}

export interface ImportOptions {
  /** Batasi restore ke satu cabang (wajib untuk selain Super Admin). */
  restrictToStoreId?: string | null;
  /** Hanya Super Admin yang boleh menimpa transaksi yang sudah ada (dijaga trigger DB). */
  canOverwriteTransactions?: boolean;
  /** Hanya Super Admin yang boleh menulis tabel cabang (dijaga RLS). */
  canRestoreStores?: boolean;
  onProgress?: (label: string, percent: number) => void;
}

export interface ImportResult {
  success: boolean;
  errors: string[];
  /** Jumlah baris yang tersimpan per tabel. */
  restored: Record<string, number>;
  /** Tabel yang sengaja tidak dipulihkan, beserta alasannya. */
  skipped: string[];
}

/** Pilih baris backup yang boleh dipulihkan sesuai cakupan cabang. */
export function selectRowsForRestore(
  backup: BackupData,
  restrictToStoreId: string | null,
): Record<string, BackupRow[]> {
  const selected: Record<string, BackupRow[]> = {};
  for (const spec of BACKUP_TABLES) {
    const rows = ((backup.data[spec.name] ?? []) as unknown[]).filter(isPlainObject);
    if (!restrictToStoreId) {
      selected[spec.name] = rows;
    } else if (spec.name === 'stores') {
      selected[spec.name] = rows.filter((r) => r.id === restrictToStoreId);
    } else if (spec.storeColumn) {
      const column = spec.storeColumn;
      selected[spec.name] = rows.filter((r) => r[column] === restrictToStoreId);
    } else if (spec.parent) {
      const parentIds = new Set((selected[spec.parent.table] ?? []).map((r) => String(r.id)));
      const column = spec.parent.column;
      selected[spec.name] = rows.filter((r) => parentIds.has(String(r[column])));
    } else {
      selected[spec.name] = rows;
    }
  }
  return selected;
}

async function restoreSettings(rows: BackupRow[]): Promise<UpsertResult> {
  const result: UpsertResult = { saved: 0, failed: 0, errors: [] };
  for (const row of rows) {
    // `id` adalah IDENTITY ALWAYS, jadi tidak boleh dikirim.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...values } = row;
    const storeId = (values.storeId as string | null | undefined) ?? null;

    let lookup = table('settings').select('id');
    lookup = storeId ? lookup.eq('storeId', storeId) : lookup.is('storeId', null);
    const { data: existing, error: lookupError } = await lookup.limit(1);

    let error: PgError | null = lookupError;
    if (!error) {
      const existingId = existing?.[0]?.id;
      ({ error } =
        existingId != null
          ? await table('settings').update(values).eq('id', existingId)
          : await table('settings').insert(values));
    }

    if (error) {
      result.failed++;
      if (result.errors.length < MAX_ERRORS_PER_TABLE) {
        result.errors.push(`cabang ${storeId ?? '-'}: ${error.message}`);
      }
    } else {
      result.saved++;
    }
  }
  return result;
}

/**
 * Template biaya bulanan dibuat otomatis saat cabang dibuat dan unik per (cabang, nama).
 * Template backup yang namanya sudah ada di cabang tersebut dipetakan ke id yang ada,
 * dan referensinya di pengeluaran ikut diganti.
 */
async function remapMonthlyTemplates(
  templates: BackupRow[],
): Promise<{ toUpsert: BackupRow[]; idMap: Map<string, string> }> {
  const idMap = new Map<string, string>();
  const storeIds = Array.from(new Set(templates.map((t) => String(t.store_id))));
  if (storeIds.length === 0) return { toUpsert: templates, idMap };

  const existing = await fetchAllRows('monthly_expense_templates', {
    columns: 'id,store_id,name',
    filter: { column: 'store_id', values: storeIds },
  });
  const byKey = new Map(
    existing.map((t) => [`${t.store_id}|${String(t.name).trim().toLowerCase()}`, String(t.id)]),
  );

  const toUpsert: BackupRow[] = [];
  for (const template of templates) {
    const key = `${template.store_id}|${String(template.name).trim().toLowerCase()}`;
    const existingId = byKey.get(key);
    if (existingId && existingId !== String(template.id)) {
      idMap.set(String(template.id), existingId);
      toUpsert.push({ ...template, id: existingId });
    } else {
      toUpsert.push(template);
    }
  }
  return { toUpsert, idMap };
}

/**
 * Import backup data ke Supabase.
 * Data dengan id yang sama DITIMPA dengan isi backup (kecuali transaksi untuk non Super Admin).
 */
export async function importBackup(
  backup: BackupData,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const restrictToStoreId = normalizeStoreId(options.restrictToStoreId);
  const { canOverwriteTransactions = false, canRestoreStores = false, onProgress } = options;

  const errors: string[] = [];
  const restored: Record<string, number> = {};
  const skipped: string[] = [];
  const selected = selectRowsForRestore(backup, restrictToStoreId);

  let templateIdMap = new Map<string, string>();
  let profileIds: Set<string> | null = null;

  const specs = BACKUP_TABLES.filter((spec) => {
    if (spec.restore === 'skip') {
      if ((selected[spec.name] ?? []).length > 0) {
        skipped.push(`${spec.label}: hanya arsip, tidak dipulihkan`);
      }
      return false;
    }
    if (spec.name === 'stores' && !canRestoreStores) {
      if ((selected.stores ?? []).length > 0) {
        skipped.push('Cabang: hanya Super Admin yang dapat memulihkan data cabang');
      }
      return false;
    }
    return true;
  });

  for (const [index, spec] of specs.entries()) {
    onProgress?.(spec.label, Math.round((index / specs.length) * 100));
    let rows = dedupeById(selected[spec.name] ?? []);
    if (rows.length === 0) continue;

    try {
      let result: UpsertResult;

      if (spec.restore === 'settings') {
        result = await restoreSettings(rows);
      } else {
        let ignoreDuplicates = false;

        if (spec.name === 'monthly_expense_templates') {
          const remapped = await remapMonthlyTemplates(rows);
          rows = remapped.toUpsert;
          templateIdMap = remapped.idMap;
        }

        if (spec.name === 'expenses' && templateIdMap.size > 0) {
          rows = rows.map((r) => {
            const templateId = r.recurringTemplateId as string | null | undefined;
            return templateId && templateIdMap.has(templateId)
              ? { ...r, recurringTemplateId: templateIdMap.get(templateId) }
              : r;
          });
        }

        if (spec.name === 'transactions') {
          profileIds ??= await fetchExistingProfileIds();
          const known = profileIds;
          rows = rows.map((r) => {
            // invoiceCode & supervisorApprovalId sengaja tidak dikirim (lihat catatan di atas).
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { invoiceCode: _code, supervisorApprovalId: _approval, ...rest } = r;
            return {
              ...rest,
              createdByUserId:
                rest.createdByUserId && known.has(String(rest.createdByUserId))
                  ? rest.createdByUserId
                  : null,
              updatedByUserId:
                rest.updatedByUserId && known.has(String(rest.updatedByUserId))
                  ? rest.updatedByUserId
                  : null,
            };
          });
          ignoreDuplicates = !canOverwriteTransactions;
          if (ignoreDuplicates) {
            skipped.push(
              'Transaksi: transaksi yang sudah ada tidak ditimpa (hanya Super Admin yang boleh)',
            );
          }
        }

        result = await upsertInBatches(spec.name, rows, { ignoreDuplicates });
      }

      restored[spec.name] = result.saved;
      if (result.failed > 0) {
        errors.push(
          `${spec.label}: ${result.failed} baris gagal — ${result.errors.join('; ')}` +
            (result.failed > result.errors.length ? ' …' : ''),
        );
      }
    } catch (err) {
      errors.push(`${spec.label}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  onProgress?.('Selesai', 100);

  return { success: errors.length === 0, errors, restored, skipped };
}

/**
 * Read JSON file and parse
 */
export function readBackupFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        resolve(data);
      } catch {
        reject(new Error('File bukan format JSON yang valid'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Get backup statistics
 */
export function getBackupStats(backup: BackupData): Record<string, number> {
  const stats: Record<string, number> = {};

  for (const [key, value] of Object.entries(backup.data)) {
    if (Array.isArray(value)) {
      stats[key] = value.length;
    }
  }

  return stats;
}
