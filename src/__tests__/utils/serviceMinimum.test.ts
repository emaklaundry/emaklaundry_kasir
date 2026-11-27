import { describe, it, expect } from 'vitest';
import { getServiceMinQuantity, formatMinQuantity, resolveMinQuantity } from '../../utils/serviceMinimum';

describe('getServiceMinQuantity', () => {
  it('membaca minimum dari nama layanan', () => {
    expect(getServiceMinQuantity('Cuci dan lipat (min. 3 kg) - 1 hari')).toBe(3);
    expect(getServiceMinQuantity('Cuci dan setrika (min. 2 kg) - 6 jam (ekspres)')).toBe(2);
    expect(getServiceMinQuantity('Setrika saja (min. 3 kg)')).toBe(3);
    expect(getServiceMinQuantity('Cuci kering minimal 2,5 kg')).toBe(2.5);
    expect(getServiceMinQuantity('Bedcover MIN 2 pcs')).toBe(2);
  });

  it('mengembalikan 0 bila tidak ada minimum', () => {
    expect(getServiceMinQuantity('Cuci ekspres - 3 jam')).toBe(0);
    expect(getServiceMinQuantity('Menghilangkan noda (tinta, darah, minyak)')).toBe(0);
    expect(getServiceMinQuantity('')).toBe(0);
    expect(getServiceMinQuantity(undefined)).toBe(0);
  });
});

describe('resolveMinQuantity', () => {
  it('mengutamakan kolom minQuantity dari database', () => {
    expect(resolveMinQuantity({ name: 'Cuci (min. 3 kg)', minQuantity: 5 })).toBe(5);
    expect(resolveMinQuantity({ name: 'Cuci (min. 3 kg)', minQuantity: 0 })).toBe(0);
  });

  it('memakai nama layanan bila kolom tidak ada', () => {
    expect(resolveMinQuantity({ name: 'Cuci (min. 3 kg)' })).toBe(3);
    expect(resolveMinQuantity(undefined, 'Setrika saja (min. 3 kg)')).toBe(3);
    expect(resolveMinQuantity(undefined)).toBe(0);
  });
});

describe('formatMinQuantity', () => {
  it('memakai koma desimal', () => {
    expect(formatMinQuantity(2.5)).toBe('2,5');
    expect(formatMinQuantity(3)).toBe('3');
  });
});
