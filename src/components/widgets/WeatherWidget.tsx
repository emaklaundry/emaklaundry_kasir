import React, { useState, useEffect } from 'react';
import {
  SunIcon,
  CloudIcon,
  CloudRainIcon,
  CloudLightningIcon,
  WindIcon,
  DropletsIcon,
  AlertTriangleIcon,
} from '../icons';
import {
  DEFAULT_LOCATION,
  dryingAdvice,
  isValidAdm4,
  openMeteoUrl,
  parseBmkg,
  parseOpenMeteo,
  type WeatherCategory,
  type WeatherReport,
  type WeatherSlot,
} from '../../utils/weather';

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
  /** Kode wilayah kelurahan/desa BMKG (adm4), mis. 32.79.01.1002. */
  bmkgAdm4?: string | null;
  locationName?: string;
}

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  latitude,
  longitude,
  bmkgAdm4,
  locationName,
}) => {
  const [report, setReport] = useState<WeatherReport | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasCoords = !!latitude && !!longitude;
  const adm4 = isValidAdm4(bmkgAdm4) ? bmkgAdm4.trim() : null;
  const isLocationSet = hasCoords || !!adm4;

  useEffect(() => {
    // Belum ada lokasi sama sekali → pakai lokasi bawaan (BMKG + koordinat bawaan).
    const target = isLocationSet
      ? { latitude, longitude, adm4 }
      : {
          latitude: DEFAULT_LOCATION.latitude,
          longitude: DEFAULT_LOCATION.longitude,
          adm4: DEFAULT_LOCATION.adm4,
        };
    let cancelled = false;

    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const data = await fetchJson(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`,
        );
        const name = data.locality || data.city || data.principalSubdivision;
        if (name && !cancelled) setPlaceName(name);
      } catch {
        // Tetap pakai nama cabang.
      }
    };

    const load = async () => {
      setLoading(true);
      let result: WeatherReport | null = null;

      if (target.adm4) {
        try {
          result = parseBmkg(
            await fetchJson(`/api/bmkg/prakiraan-cuaca?adm4=${encodeURIComponent(target.adm4)}`),
          );
        } catch (err) {
          console.warn('BMKG gagal, beralih ke Open-Meteo:', err);
        }
      }

      if (!result && target.latitude && target.longitude) {
        try {
          result = parseOpenMeteo(await fetchJson(openMeteoUrl(target.latitude, target.longitude)));
        } catch (err) {
          console.error('Failed to fetch weather:', err);
        }
      }

      if (cancelled) return;
      if (result) {
        setReport(result);
        setPlaceName(result.locationName ?? null);
        setError(null);
        if (!result.locationName && target.latitude && target.longitude) {
          reverseGeocode(target.latitude, target.longitude);
        }
      } else {
        setError('Gagal memuat data cuaca');
      }
      setLoading(false);
    };

    load();

    // BMKG memperbarui prakiraan beberapa kali sehari; refresh tiap 30 menit sudah cukup.
    const interval = setInterval(load, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [latitude, longitude, adm4, locationName, isLocationSet]);

  const getWeatherIcon = (
    category: WeatherCategory,
    isDay: boolean,
    sizeClass: string = 'w-8 h-8',
  ) => {
    if (category === 'storm')
      return <CloudLightningIcon className={`${sizeClass} text-amber-500`} />;
    if (category === 'rain') return <CloudRainIcon className={`${sizeClass} text-blue-600`} />;
    if (category === 'fog') return <WindIcon className={`${sizeClass} text-slate-400`} />;
    if (category === 'clear' || category === 'partly')
      return <SunIcon className={`${sizeClass} ${isDay ? 'text-amber-500' : 'text-slate-400'}`} />;
    return <CloudIcon className={`${sizeClass} text-slate-500`} />;
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const slotDetail = (slot: WeatherSlot) => {
    if (slot.rainChance !== undefined) return `${slot.rainChance}%`;
    if (slot.rainMm) return `${slot.rainMm} mm`;
    return null;
  };

  if (loading && !report)
    return (
      <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
    );
  if (error || !report) return null;

  // Tampilkan hanya cuaca yang mengganggu jemuran: berawan tebal, kabut, hujan, badai.
  const badWeather = report.upcoming.filter((s) => s.code >= 3);

  return (
    <section
      aria-label="Cuaca"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
    >
      {!isLocationSet && (
        <p className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-200">
          <AlertTriangleIcon className="h-4 w-4 flex-shrink-0" />
          Lokasi belum diatur. Menampilkan cuaca default.
        </p>
      )}

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">
              {placeName || locationName || DEFAULT_LOCATION.name}
            </h3>
            <div className="mt-2 flex items-center gap-3">
              {getWeatherIcon(report.current.category, report.isDay)}
              <div>
                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {report.temperature}°C
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {report.current.description}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {report.humidity !== undefined && (
              <p className="flex items-center gap-1.5">
                <DropletsIcon className="h-4 w-4 text-slate-400" />
                {report.humidity}% Lembab
              </p>
            )}
            <p className="flex items-center gap-1.5">
              <WindIcon className="h-4 w-4 text-slate-400" />
              {report.windSpeed} km/h Angin
            </p>
          </div>
        </div>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
          <span className="font-semibold">Saran:</span> {dryingAdvice(report)}
        </p>

        <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Prakiraan Cuaca Buruk (24 Jam ke Depan)
          </p>
          {badWeather.length > 0 ? (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {badWeather.map((slot) => (
                <li
                  key={slot.time.toISOString()}
                  className="flex min-w-[72px] flex-col items-center rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                >
                  <span className="mb-1 text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {formatTime(slot.time)}
                  </span>
                  {getWeatherIcon(slot.category, true, 'h-6 w-6')}
                  <span className="mt-1 text-center text-xs leading-tight text-slate-600 dark:text-slate-400">
                    {slot.description}
                  </span>
                  {slotDetail(slot) && (
                    <span className="text-xs tabular-nums text-blue-700 dark:text-blue-300">
                      {slotDetail(slot)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tidak ada prediksi hujan/mendung dalam 24 jam ke depan.
            </p>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sumber data:{' '}
          {report.source === 'BMKG'
            ? 'BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)'
            : adm4
              ? 'Open-Meteo (BMKG sedang tidak tersedia)'
              : 'Open-Meteo. Isi Kode Wilayah BMKG di Pengaturan agar prakiraan lebih akurat.'}
        </p>
      </div>
    </section>
  );
};

export default WeatherWidget;
