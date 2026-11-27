/**
 * Data cuaca untuk widget dashboard.
 *
 * Sumber utama: BMKG (prakiraan resmi per kelurahan/desa, per 3 jam), diakses lewat proxy
 * same-origin `/api/bmkg` karena respons BMKG tidak selalu membawa header CORS.
 * Cadangan: Open-Meteo (model global) bila kode wilayah BMKG belum diisi atau BMKG gagal.
 */

export type WeatherSource = 'BMKG' | 'Open-Meteo';

export type WeatherCategory = 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'storm';

export interface WeatherSlot {
  time: Date;
  code: number;
  category: WeatherCategory;
  description: string;
  /** Curah hujan (mm) — hanya dari BMKG. */
  rainMm?: number;
  /** Peluang hujan (%) — hanya dari Open-Meteo. */
  rainChance?: number;
}

export interface WeatherReport {
  source: WeatherSource;
  temperature: number;
  humidity?: number;
  /** km/jam */
  windSpeed: number;
  isDay: boolean;
  current: WeatherSlot;
  /** Prakiraan 24 jam ke depan, urut waktu. */
  upcoming: WeatherSlot[];
  /** Nama wilayah dari sumber (BMKG mengirim nama desa & kecamatan). */
  locationName?: string;
}

/** Kode wilayah Kemendagri tingkat kelurahan/desa, mis. 32.79.01.1002. */
export const ADM4_PATTERN = /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/;

export const isValidAdm4 = (code: string | null | undefined): code is string =>
  !!code && ADM4_PATTERN.test(code.trim());

/** Lokasi bawaan bila cabang belum diatur: Emak Laundry, Mekarsari, Kota Banjar. */
export const DEFAULT_LOCATION = {
  latitude: -7.372186953412669,
  longitude: 108.53945949758317,
  adm4: '32.79.01.1002',
  name: 'Emak Laundry Banjar',
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Kode BMKG dan kode WMO (Open-Meteo) punya rentang yang sejalan:
 * 0 cerah, 1-2 cerah berawan, 3-4 berawan/mendung, 5-49 kabut/asap/udara kabur,
 * 50-94 gerimis/hujan, 95+ badai petir.
 */
export const categorize = (code: number): WeatherCategory => {
  if (code <= 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code <= 4) return 'cloudy';
  if (code < 50) return 'fog';
  if (code < 95) return 'rain';
  return 'storm';
};

/** Deskripsi kode WMO untuk data Open-Meteo (BMKG sudah mengirim deskripsinya sendiri). */
export const describeWmo = (code: number): string => {
  if (code === 0) return 'Cerah';
  if (code === 1) return 'Cerah Berawan';
  if (code === 2) return 'Berawan';
  if (code === 3) return 'Mendung';
  if (code === 45 || code === 48) return 'Kabut';
  if (code >= 51 && code <= 57) return 'Gerimis';
  if (code === 61 || code === 66 || code === 80) return 'Hujan Ringan';
  if (code === 63 || code === 81) return 'Hujan Sedang';
  if (code === 65 || code === 67 || code === 82) return 'Hujan Lebat';
  if (code >= 71 && code <= 86) return 'Hujan';
  if (code >= 95) return 'Badai Petir';
  return 'Berawan';
};

const isWet = (slot: WeatherSlot) => slot.category === 'rain' || slot.category === 'storm';

const within24h = (slots: WeatherSlot[], now: Date) =>
  slots.filter((s) => s.time > now && s.time.getTime() < now.getTime() + DAY_MS);

// ---------------------------------------------------------------------------
// BMKG — https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=...
// ---------------------------------------------------------------------------

interface BmkgEntry {
  datetime: string; // ISO UTC, mis. 2026-11-28T06:00:00Z
  t: number;
  hu: number;
  ws: number; // km/jam
  tp: number; // mm
  weather: number;
  weather_desc: string;
}

interface BmkgResponse {
  data?: {
    lokasi?: { desa?: string; kecamatan?: string; kotkab?: string };
    cuaca?: BmkgEntry[][];
  }[];
}

export function parseBmkg(json: BmkgResponse, now: Date = new Date()): WeatherReport {
  const item = json.data?.[0];
  const entries = (item?.cuaca ?? []).flat();
  if (!entries.length) throw new Error('Data BMKG kosong');

  const slots = entries
    .map((e) => ({
      entry: e,
      slot: {
        time: new Date(e.datetime),
        code: e.weather,
        category: categorize(e.weather),
        description: e.weather_desc,
        rainMm: e.tp,
      } satisfies WeatherSlot,
    }))
    .filter(({ slot }) => !Number.isNaN(slot.time.getTime()))
    .sort((a, b) => a.slot.time.getTime() - b.slot.time.getTime());
  if (!slots.length) throw new Error('Data BMKG kosong');

  // Slot 3 jam yang sedang berjalan: slot terakhir yang sudah dimulai (atau slot pertama).
  const started = slots.filter(({ slot }) => slot.time <= now);
  const { entry, slot: current } = started.length ? started[started.length - 1] : slots[0];

  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'Asia/Jakarta',
    }).format(now),
  );

  const lokasi = item?.lokasi;
  const locationName = [lokasi?.desa, lokasi?.kecamatan].filter(Boolean).join(', ') || undefined;

  return {
    source: 'BMKG',
    temperature: entry.t,
    humidity: entry.hu,
    windSpeed: entry.ws,
    isDay: hour >= 6 && hour < 18,
    current,
    upcoming: within24h(
      slots.map((s) => s.slot),
      now,
    ),
    locationName,
  };
}

// ---------------------------------------------------------------------------
// Open-Meteo — cadangan
// ---------------------------------------------------------------------------

export const openMeteoUrl = (latitude: number, longitude: number) =>
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${latitude}&longitude=${longitude}` +
  '&current=temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m' +
  '&hourly=weather_code,precipitation_probability' +
  '&timezone=auto&forecast_days=2';

interface OpenMeteoResponse {
  utc_offset_seconds?: number;
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m?: number;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
  };
  hourly?: {
    time: string[];
    weather_code: number[];
    precipitation_probability?: (number | null)[];
  };
}

/** Waktu Open-Meteo berupa jam lokal lokasi tanpa offset; ubah ke waktu absolut. */
const openMeteoTime = (local: string, offsetSeconds: number) =>
  new Date(Date.parse(`${local}Z`) - offsetSeconds * 1000);

export function parseOpenMeteo(json: OpenMeteoResponse, now: Date = new Date()): WeatherReport {
  const c = json.current;
  if (!c) throw new Error('Data Open-Meteo kosong');
  const offset = json.utc_offset_seconds ?? 0;

  const hourly = json.hourly;
  const slots: WeatherSlot[] = (hourly?.time ?? []).map((t, i) => {
    const code = hourly!.weather_code[i];
    const chance = hourly!.precipitation_probability?.[i];
    return {
      time: openMeteoTime(t, offset),
      code,
      category: categorize(code),
      description: describeWmo(code),
      rainChance: chance ?? undefined,
    };
  });

  return {
    source: 'Open-Meteo',
    temperature: c.temperature_2m,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    isDay: c.is_day === 1,
    current: {
      time: openMeteoTime(c.time, offset),
      code: c.weather_code,
      category: categorize(c.weather_code),
      description: describeWmo(c.weather_code),
    },
    upcoming: within24h(slots, now),
  };
}

// ---------------------------------------------------------------------------
// Saran jemur
// ---------------------------------------------------------------------------

const formatHour = (d: Date) =>
  d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

/** Saran jemur dari cuaca sekarang + hujan yang diprediksi dalam 6 jam ke depan. */
export function dryingAdvice(report: WeatherReport, now: Date = new Date()): string {
  const { current, humidity } = report;
  if (isWet(current)) return 'JANGAN JEMUR DI LUAR. Gunakan mesin pengering.';

  const soon = report.upcoming.find(
    (s) => isWet(s) && s.time.getTime() <= now.getTime() + 6 * 60 * 60 * 1000,
  );
  if (soon) {
    return `Diprediksi ${soon.description.toLowerCase()} sekitar jam ${formatHour(soon.time)}. Jemur di luar hanya sebelum itu dan siap angkat.`;
  }

  if (current.category === 'clear' || current.category === 'partly') {
    return humidity !== undefined && humidity > 85
      ? 'Cuaca cerah tapi lembab. Keringkan di luar, tapi pantau.'
      : 'SANGAT BAIK untuk jemur di luar. Hemat listrik!';
  }
  if (current.category === 'cloudy') {
    return 'Berawan. Aman jemur luar, tapi keringnya mungkin lama.';
  }
  return 'Udara berkabut/kabur. Jemuran lambat kering, pantau terus.';
}
