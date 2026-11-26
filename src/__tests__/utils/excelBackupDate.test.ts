import { describe, expect, it } from 'vitest';
import { parseBackupDate } from '@/utils/excelUtils';

describe('parseBackupDate', () => {
  it('reads ISO timestamps exactly', () => {
    expect(parseBackupDate('2026-11-26T07:30:00.000Z')?.toISOString()).toBe(
      '2026-11-26T07:30:00.000Z',
    );
  });

  it('reads the legacy id-ID format as local time (old backups)', () => {
    const date = parseBackupDate('26/11/2026, 14.30.00');
    expect(date).toBeDefined();
    expect([date!.getFullYear(), date!.getMonth(), date!.getDate()]).toEqual([2026, 10, 26]);
    expect([date!.getHours(), date!.getMinutes(), date!.getSeconds()]).toEqual([14, 30, 0]);
  });

  it('passes through Date cells and rejects empty or invalid values', () => {
    const d = new Date(2026, 0, 2);
    expect(parseBackupDate(d)).toBe(d);
    expect(parseBackupDate('')).toBeUndefined();
    expect(parseBackupDate('-')).toBeUndefined();
    expect(parseBackupDate('bukan tanggal')).toBeUndefined();
    expect(parseBackupDate(new Date(NaN))).toBeUndefined();
  });
});
