export type CostLine = 'hpp' | 'salary' | 'rent' | 'utilities' | 'marketing' | 'capex' | 'other';

/** Kategori yang tampil di form pengeluaran (urutan tampilan). */
export const EXPENSE_CATEGORIES: readonly string[] = [
  'Bahan Baku',
  'Gaji',
  'Sewa Tempat',
  'Listrik',
  'Air',
  'Marketing & Promosi',
  'Pemeliharaan',
  'Operasional',
  'Aset / Inventaris',
  'Lainnya',
];

/** Kategori lama: tidak muncul di form, tetap muncul di filter. */
export const LEGACY_EXPENSE_CATEGORIES: readonly string[] = ['Perlengkapan', 'Perawatan Aset'];

const COST_LINE_BY_CATEGORY: Readonly<Record<string, CostLine>> = {
  'Bahan Baku': 'hpp',
  Perlengkapan: 'hpp',
  Gaji: 'salary',
  'Sewa Tempat': 'rent',
  Listrik: 'utilities',
  Air: 'utilities',
  'Marketing & Promosi': 'marketing',
  Pemeliharaan: 'marketing',
  'Pemeliharaan Aset': 'marketing',
  'Perawatan Aset': 'marketing', // dicatat Quick Maintenance
  'Aset / Inventaris': 'capex',
  'Pembelian Aset': 'capex',
};

/** Cermin public.target_cost_line() di SQL. */
export function costLineFor(category: string | null | undefined): CostLine {
  if (category && Object.prototype.hasOwnProperty.call(COST_LINE_BY_CATEGORY, category)) {
    return COST_LINE_BY_CATEGORY[category];
  }
  return 'other';
}

export const COST_LINE_LABELS: Record<CostLine, string> = {
  hpp: 'HPP / Bahan',
  salary: 'Gaji',
  rent: 'Sewa',
  utilities: 'Listrik & Air',
  marketing: 'Marketing & Pemeliharaan',
  capex: 'Belanja modal',
  other: 'Biaya lain',
};

/** Alias nama kategori lama/template Excel lama -> kategori resmi (kunci huruf kecil). */
const CATEGORY_ALIASES: ReadonlyMap<string, string> = new Map([
  ['gaji karyawan', 'Gaji'],
  ['pembelian bahan', 'Bahan Baku'],
  ['listrik & air', 'Listrik'],
  ['maintenance', 'Pemeliharaan'],
]);

/** Petakan alias kategori ke kategori resmi (tanpa peduli huruf besar/kecil & spasi tepi). Tak dikenal: tidak berubah. */
export function normalizeExpenseCategory(name: string): string {
  const alias = CATEGORY_ALIASES.get(name.trim().toLowerCase());
  return alias ?? name;
}
