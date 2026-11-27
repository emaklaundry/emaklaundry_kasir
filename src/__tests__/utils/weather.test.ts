import { describe, it, expect } from 'vitest';
import {
  categorize,
  describeWmo,
  dryingAdvice,
  isValidAdm4,
  parseBmkg,
  parseOpenMeteo,
} from '@/utils/weather';

const bmkgEntry = (datetime: string, weather: number, desc: string, extra = {}) => ({
  datetime,
  t: 28,
  hu: 75,
  ws: 4.8,
  tp: 0,
  weather,
  weather_desc: desc,
  ...extra,
});

const bmkgSample = {
  data: [
    {
      lokasi: { desa: 'Mekarsari', kecamatan: 'Banjar', kotkab: 'Kota Banjar' },
      cuaca: [
        [
          bmkgEntry('2026-11-28T00:00:00Z', 3, 'Berawan', { t: 24 }),
          bmkgEntry('2026-11-28T03:00:00Z', 1, 'Cerah Berawan', { t: 28, hu: 70 }),
        ],
        [
          bmkgEntry('2026-11-28T06:00:00Z', 61, 'Hujan Ringan', { tp: 4.3 }),
          bmkgEntry('2026-11-29T06:00:00Z', 95, 'Hujan Petir'),
        ],
      ],
    },
  ],
};

describe('isValidAdm4', () => {
  it('menerima kode kelurahan lengkap', () => {
    expect(isValidAdm4('32.79.01.1002')).toBe(true);
    expect(isValidAdm4(' 32.79.01.1002 ')).toBe(true);
  });
  it('menolak kode kecamatan atau format salah', () => {
    expect(isValidAdm4('32.79.01')).toBe(false);
    expect(isValidAdm4('3279011002')).toBe(false);
    expect(isValidAdm4('')).toBe(false);
    expect(isValidAdm4(null)).toBe(false);
  });
});

describe('categorize', () => {
  it('memetakan kode BMKG dan WMO', () => {
    expect(categorize(0)).toBe('clear');
    expect(categorize(2)).toBe('partly');
    expect(categorize(4)).toBe('cloudy');
    expect(categorize(45)).toBe('fog');
    expect(categorize(10)).toBe('fog');
    expect(categorize(60)).toBe('rain');
    expect(categorize(80)).toBe('rain');
    expect(categorize(97)).toBe('storm');
  });
});

describe('describeWmo', () => {
  it('tidak lagi melabeli kabut dan hujan lebat sebagai berawan', () => {
    expect(describeWmo(45)).toBe('Kabut');
    expect(describeWmo(65)).toBe('Hujan Lebat');
    expect(describeWmo(82)).toBe('Hujan Lebat');
  });
});

describe('parseBmkg', () => {
  // 10:30 WIB
  const now = new Date('2026-11-28T03:30:00Z');

  it('memakai slot 3 jam yang sedang berjalan sebagai cuaca sekarang', () => {
    const r = parseBmkg(bmkgSample, now);
    expect(r.source).toBe('BMKG');
    expect(r.temperature).toBe(28);
    expect(r.humidity).toBe(70);
    expect(r.current.description).toBe('Cerah Berawan');
    expect(r.isDay).toBe(true);
    expect(r.locationName).toBe('Mekarsari, Banjar');
  });

  it('prakiraan hanya berisi slot dalam 24 jam ke depan', () => {
    const r = parseBmkg(bmkgSample, now);
    expect(r.upcoming.map((s) => s.description)).toEqual(['Hujan Ringan']);
    expect(r.upcoming[0].rainMm).toBe(4.3);
  });

  it('melempar error bila data kosong', () => {
    expect(() => parseBmkg({ data: [] }, now)).toThrow();
  });
});

describe('parseOpenMeteo', () => {
  it('mengubah jam lokal ke waktu absolut memakai utc_offset_seconds', () => {
    const now = new Date('2026-11-28T03:30:00Z');
    const r = parseOpenMeteo(
      {
        utc_offset_seconds: 7 * 3600,
        current: {
          time: '2026-11-28T10:30',
          temperature_2m: 29,
          relative_humidity_2m: 72,
          weather_code: 2,
          is_day: 1,
          wind_speed_10m: 6,
        },
        hourly: {
          time: ['2026-11-28T10:00', '2026-11-28T13:00', '2026-11-29T13:00'],
          weather_code: [2, 63, 3],
          precipitation_probability: [10, 80, 20],
        },
      },
      now,
    );
    expect(r.source).toBe('Open-Meteo');
    expect(r.upcoming).toHaveLength(1);
    expect(r.upcoming[0].time.toISOString()).toBe('2026-11-28T06:00:00.000Z');
    expect(r.upcoming[0].rainChance).toBe(80);
    expect(r.upcoming[0].description).toBe('Hujan Sedang');
  });
});

describe('dryingAdvice', () => {
  const now = new Date('2026-11-28T03:30:00Z');

  it('memperingatkan hujan yang diprediksi dalam 6 jam', () => {
    const advice = dryingAdvice(parseBmkg(bmkgSample, now), now);
    expect(advice).toContain('hujan ringan');
    expect(advice).toContain('13.00');
  });

  it('melarang jemur saat sedang hujan', () => {
    const rainingNow = new Date('2026-11-28T07:00:00Z');
    expect(dryingAdvice(parseBmkg(bmkgSample, rainingNow), rainingNow)).toContain('JANGAN');
  });

  it('menyarankan jemur saat cerah tanpa hujan dekat', () => {
    const r = parseBmkg(bmkgSample, now);
    expect(dryingAdvice({ ...r, upcoming: [] }, now)).toContain('SANGAT BAIK');
  });
});
