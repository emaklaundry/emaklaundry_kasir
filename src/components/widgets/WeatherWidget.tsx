import React, { useState, useEffect } from 'react';
// Icons imported from local component
import {
  SunIcon,
  CloudIcon,
  CloudRainIcon,
  CloudLightningIcon,
  WindIcon,
  DropletsIcon,
  AlertTriangleIcon,
} from '../icons';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  windSpeed: number;
  humidity?: number; // Not always available in basic current_weather, might need hourly
}

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

interface WidgetLocation {
  latitude: number;
  longitude: number;
  name: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ latitude, longitude, locationName }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<WidgetLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dryingRecommendation, setDryingRecommendation] = useState<string>('');
  const [hourlyForecast, setHourlyForecast] = useState<{ time: string; code: number }[]>([]);

  useEffect(() => {
    // Default fallback (Emak Laundry Banjar)
    const defaultLat = -7.372186953412669;
    const defaultLng = 108.53945949758317;
    const defaultName = 'Emak Laundry Banjar';

    const targetLocation = {
      latitude: latitude || defaultLat,
      longitude: longitude || defaultLng,
      name: locationName || defaultName,
    };

    // Set location to target immediately (will be updated by reverse geo if successful)
    setLocation(targetLocation);

    const determineRecommendation = (data: WeatherData) => {
      const { weatherCode, humidity } = data;

      if (weatherCode >= 51) {
        setDryingRecommendation('JANGAN JEMUR DI LUAR. Gunakan mesin pengering.');
      } else if (weatherCode === 0 || weatherCode === 1) {
        if (humidity && humidity > 85) {
          setDryingRecommendation('Cuaca cerah tapi lembab. Keringkan di luar, tapi pantau.');
        } else {
          setDryingRecommendation('SANGAT BAIK untuk jemur di luar. Hemat listrik!');
        }
      } else if (weatherCode <= 3) {
        setDryingRecommendation('Berawan. Aman jemur luar, tapi keringnya mungkin lama.');
      } else {
        setDryingRecommendation('Hati-hati cuaca tidak menentu.');
      }
    };

    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Using Open-Meteo API
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${targetLocation.latitude}&longitude=${targetLocation.longitude}&current_weather=true&hourly=relativehumidity_2m,weathercode&timezone=auto`,
        );
        const data = await response.json();

        if (data.current_weather) {
          const currentHour = new Date().getHours();
          const humidity = data.hourly?.relativehumidity_2m?.[currentHour] || 0;

          const weatherData: WeatherData = {
            temperature: data.current_weather.temperature,
            weatherCode: data.current_weather.weathercode,
            isDay: data.current_weather.is_day === 1,
            windSpeed: data.current_weather.windspeed,
            humidity,
          };
          setWeather(weatherData);
          determineRecommendation(weatherData);

          // Process Hourly Forecast (Next 24h)
          if (data.hourly && data.hourly.time && data.hourly.weathercode) {
            const next24h: { time: string; code: number }[] = [];
            const now = new Date();

            data.hourly.time.forEach((timeStr: string, index: number) => {
              const forecastTime = new Date(timeStr);
              // Filter for future times within next 24h
              if (
                forecastTime > now &&
                forecastTime < new Date(now.getTime() + 24 * 60 * 60 * 1000)
              ) {
                const code = data.hourly.weathercode[index];
                // Only interest in: Cloudy (3), Fog (45,48), Drizzle (51+), Rain (61+), Thunder (95+)
                if (code >= 3) {
                  next24h.push({
                    time: forecastTime.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    code: code,
                  });
                }
              }
            });
            setHourlyForecast(next24h);
          }
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
        setError('Gagal memuat data cuaca');
      } finally {
        setLoading(false);
      }
    };

    // Fetch Location Name (Reverse Geocoding)
    const fetchLocationName = async () => {
      try {
        // Check if coordinates actully exist and valid (not default 0,0 from empty state)
        if (!targetLocation.latitude || !targetLocation.longitude) return;

        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${targetLocation.latitude}&longitude=${targetLocation.longitude}&localityLanguage=id`,
        );
        const data = await res.json();
        // Prioritize: Locality (Kecamatan) -> City (Kota/Kab) -> PrincipalSubdivision (Provinsi)
        const realName = data.locality || data.city || data.principalSubdivision;

        if (realName) {
          setLocation((prev) => (prev ? { ...prev, name: realName } : null));
        }
      } catch (err) {
        console.warn('Failed to reverse geocode:', err);
        // Fallback to existing name (store name) silently
      }
    };

    fetchWeather();
    fetchLocationName();

    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [latitude, longitude, locationName]);

  const getWeatherIcon = (code: number, isDay: boolean, sizeClass: string = 'w-8 h-8') => {
    if (code >= 95) return <CloudLightningIcon className={`${sizeClass} text-amber-500`} />;
    if (code >= 51) return <CloudRainIcon className={`${sizeClass} text-blue-600`} />;
    if (code >= 45) return <WindIcon className={`${sizeClass} text-slate-400`} />;
    if (code <= 1)
      return isDay ? (
        <SunIcon className={`${sizeClass} text-amber-500`} />
      ) : (
        <SunIcon className={`${sizeClass} text-slate-400`} />
      );
    return <CloudIcon className={`${sizeClass} text-slate-500`} />;
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return 'Cerah';
    if (code === 1) return 'Cerah Berawan';
    if (code === 2) return 'Berawan';
    if (code === 3) return 'Mendung';
    if (code >= 51 && code <= 55) return 'Gerimis';
    if (code >= 61 && code <= 65) return 'Hujan';
    if (code >= 80 && code <= 82) return 'Hujan Deras';
    if (code >= 95) return 'Badai Petir';
    return 'Berawan';
  };

  const isLocationSet = latitude && longitude && latitude !== 0 && longitude !== 0;

  if (loading)
    return (
      <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
    );
  if (error || !weather) return null;

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
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">{location?.name}</h3>
            <div className="mt-2 flex items-center gap-3">
              {getWeatherIcon(weather.weatherCode, weather.isDay)}
              <div>
                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {weather.temperature}°C
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {getWeatherDescription(weather.weatherCode)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <p className="flex items-center gap-1.5">
              <DropletsIcon className="h-4 w-4 text-slate-400" />
              {weather.humidity}% Lembab
            </p>
            <p className="flex items-center gap-1.5">
              <WindIcon className="h-4 w-4 text-slate-400" />
              {weather.windSpeed} km/h Angin
            </p>
          </div>
        </div>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
          <span className="font-semibold">Saran:</span> {dryingRecommendation}
        </p>

        <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Prakiraan Cuaca Buruk (24 Jam ke Depan)
          </p>
          {hourlyForecast.length > 0 ? (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {hourlyForecast.map((item) => (
                <li
                  key={item.time}
                  className="flex min-w-[72px] flex-col items-center rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                >
                  <span className="mb-1 text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {item.time}
                  </span>
                  {getWeatherIcon(item.code, true, 'h-6 w-6')}
                  <span className="mt-1 text-center text-xs leading-tight text-slate-600 dark:text-slate-400">
                    {getWeatherDescription(item.code)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tidak ada prediksi hujan/mendung dalam 24 jam ke depan.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default WeatherWidget;
