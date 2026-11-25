import { describe, expect, it } from 'vitest';
import {
  getLocalDateString,
  getMonthPeriod,
  getOutstandingMonthlyTemplates,
} from '@/utils/monthlyExpenses';

describe('monthly expense helpers', () => {
  it('uses the local calendar month without UTC date shifts', () => {
    expect(getMonthPeriod(new Date(2026, 0, 31, 23, 30))).toBe('2026-01-01');
    expect(getLocalDateString(new Date(2026, 1, 1, 0, 15))).toBe('2026-02-01');
  });

  it('returns only active templates for the store and month that have not been saved', () => {
    const templates = [
      {
        id: 'electricity',
        storeId: 'store-a',
        name: 'Listrik',
        category: 'Listrik',
        isActive: true,
        sortOrder: 1,
      },
      {
        id: 'water',
        storeId: 'store-a',
        name: 'Air',
        category: 'Air',
        isActive: true,
        sortOrder: 2,
      },
      {
        id: 'wifi',
        storeId: 'store-a',
        name: 'Wi-Fi',
        category: 'Operasional',
        isActive: false,
        sortOrder: 3,
      },
      {
        id: 'other-store',
        storeId: 'store-b',
        name: 'Air',
        category: 'Air',
        isActive: true,
        sortOrder: 1,
      },
    ];
    const records = [
      { storeId: 'store-a', templateId: 'electricity', period: '2026-02-01' },
      { storeId: 'store-a', templateId: 'water', period: '2026-01-01' },
      { storeId: 'store-b', templateId: 'other-store', period: '2026-02-01' },
    ];

    expect(getOutstandingMonthlyTemplates(templates, records, 'store-a', '2026-02-01')).toEqual([
      templates[1],
    ]);
  });
});
