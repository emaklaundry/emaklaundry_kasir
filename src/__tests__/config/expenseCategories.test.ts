import { describe, it, expect } from 'vitest';
import {
  EXPENSE_CATEGORIES,
  LEGACY_EXPENSE_CATEGORIES,
  COST_LINE_LABELS,
  costLineFor,
  normalizeExpenseCategory,
  type CostLine,
} from '@/config/expenseCategories';

const EXPECTED: Record<string, CostLine> = {
  'Bahan Baku': 'hpp',
  Perlengkapan: 'hpp',
  Gaji: 'salary',
  'Sewa Tempat': 'rent',
  Listrik: 'utilities',
  Air: 'utilities',
  'Marketing & Promosi': 'marketing',
  Pemeliharaan: 'marketing',
  'Pemeliharaan Aset': 'marketing',
  'Perawatan Aset': 'marketing',
  'Aset / Inventaris': 'capex',
  'Pembelian Aset': 'capex',
  Operasional: 'other',
  Lainnya: 'other',
};

describe('expenseCategories', () => {
  it('urutan kategori form sesuai spesifikasi', () => {
    expect([...EXPENSE_CATEGORIES]).toEqual([
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
    ]);
    expect([...LEGACY_EXPENSE_CATEGORIES]).toEqual(['Perlengkapan', 'Perawatan Aset']);
  });

  it('tidak ada duplikat', () => {
    expect(new Set(EXPENSE_CATEGORIES).size).toBe(EXPENSE_CATEGORIES.length);
  });

  it('setiap kategori dipetakan sesuai tabel', () => {
    for (const cat of [...EXPENSE_CATEGORIES, ...LEGACY_EXPENSE_CATEGORIES]) {
      expect(costLineFor(cat), cat).toBe(EXPECTED[cat]);
    }
    expect(costLineFor('Pembelian Aset')).toBe('capex');
    expect(costLineFor('Pemeliharaan Aset')).toBe('marketing');
    expect(costLineFor('Perawatan Aset')).toBe('marketing'); // Quick Maintenance
  });

  it('kategori tak dikenal / kosong menjadi other', () => {
    expect(costLineFor('Wi-Fi')).toBe('other');
    expect(costLineFor(undefined)).toBe('other');
    expect(costLineFor(null)).toBe('other');
  });

  it('label baris biaya lengkap', () => {
    expect(COST_LINE_LABELS).toEqual({
      hpp: 'HPP / Bahan',
      salary: 'Gaji',
      rent: 'Sewa',
      utilities: 'Listrik & Air',
      marketing: 'Marketing & Pemeliharaan',
      capex: 'Belanja modal',
      other: 'Biaya lain',
    });
  });
});

describe('normalizeExpenseCategory', () => {
  it.each([
    ['Gaji Karyawan', 'Gaji'],
    ['Pembelian Bahan', 'Bahan Baku'],
    ['Listrik & Air', 'Listrik'],
    ['Maintenance', 'Pemeliharaan'],
    ['  gaji karyawan  ', 'Gaji'],
    ['MAINTENANCE', 'Pemeliharaan'],
  ])('memetakan alias %s ke %s', (input, expected) => {
    expect(normalizeExpenseCategory(input)).toBe(expected);
  });

  it('kategori tak dikenal dikembalikan apa adanya', () => {
    expect(normalizeExpenseCategory('Kategori Baru')).toBe('Kategori Baru');
    expect(normalizeExpenseCategory('Bahan Baku')).toBe('Bahan Baku');
  });
});
