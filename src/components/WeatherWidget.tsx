import React, { useState, useEffect } from 'react';
// Icons imported from local component
import {
  SunIcon,
  CloudIcon,
  CloudRainIcon,
  CloudLightningIcon,
  WindIcon,
  DropletsIcon,
} from './icons';

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
        setDryingRecommendation('⚠️ JANGAN JEMUR DI LUAR. Gunakan mesin pengering.');
      } else if (weatherCode === 0 || weatherCode === 1) {
        if (humidity && humidity > 85) {
          setDryingRecommendation('✅ Cuaca cerah tapi lembab. Keringkan di luar, tapi pantau.');
        } else {
          setDryingRecommendation('☀️ SANGAT BAIK untuk jemur di luar. Hemat listrik!');
        }
      } else if (weatherCode <= 3) {
        setDryingRecommendation('⛅ Berawan. Aman jemur luar, tapi keringnya mungkin lama.');
      } else {
        setDryingRecommendation('☁️ Hati-hati cuaca tidak menentu.');
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

  const getWeatherIcon = (code: number, isDay: boolean, sizeClass: string = 'w-10 h-10') => {
    if (code >= 95) return <CloudLightningIcon className={`${sizeClass} text-purple-600`} />;
    if (code >= 51) return <CloudRainIcon className={`${sizeClass} text-blue-600`} />;
    if (code >= 45) return <WindIcon className={`${sizeClass} text-slate-400`} />;
    if (code <= 1)
      return isDay ? (
        <SunIcon className={`${sizeClass} text-yellow-500`} />
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
      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm animate-pulse h-32"></div>
    );
  if (error || !weather) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-900 dark:to-cyan-900 rounded-xl shadow-lg p-5 text-white relative overflow-hidden">
      {!isLocationSet && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500/90 text-white text-xs font-bold px-4 py-1 text-center z-20 backdrop-blur-sm">
          ⚠️ Lokasi belum diatur. Menampilkan cuaca default.
        </div>
      )}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-20">
        {getWeatherIcon(weather.weatherCode, weather.isDay, 'w-32 h-32')}
      </div>

      <div className="flex justify-between items-start z-10 relative mb-4">
        <div>
          <h3 className="font-semibold text-lg opacity-90 mb-1 flex items-center gap-2">
            📍 {location?.name}
          </h3>
          <div className="flex items-center gap-3 my-2">
            {getWeatherIcon(weather.weatherCode, weather.isDay)}
            <div>
              <p className="text-3xl font-bold">{weather.temperature}°C</p>
              <p className="text-sm font-medium opacity-90">
                {getWeatherDescription(weather.weatherCode)}
              </p>
            </div>
          </div>
        </div>

        <div className="text-right text-sm space-y-1 opacity-90">
          <div className="flex items-center justify-end gap-1">
            <DropletsIcon className="w-4 h-4" />
            <span>{weather.humidity}% Lembab</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <WindIcon className="w-4 h-4" />
            <span>{weather.windSpeed} km/h Angin</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mb-4">
        <p className="text-sm font-bold bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
          💡 Saran: {dryingRecommendation}
        </p>
      </div>

      {/* Hourly Forecast Timeline */}
      {hourlyForecast.length > 0 && (
        <div className="pt-3 border-t border-white/20">
          <p className="text-xs font-semibold opacity-80 mb-2 uppercase tracking-wider">
            📅 Prakiraan Cuaca Buruk (24 Jam ke Depan)
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {hourlyForecast.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center bg-black/20 rounded-lg p-2 min-w-[70px] backdrop-blur-sm"
              >
                <span className="text-xs font-bold mb-1">{item.time}</span>
                {getWeatherIcon(item.code, true, 'w-6 h-6')}
                <span className="text-[10px] mt-1 text-center leading-tight opacity-90">
                  {getWeatherDescription(item.code)}
                </span>
              </div>
            ))}
          </div>
          {hourlyForecast.length === 0 && (
            <p className="text-sm opacity-90 italic">
              ✅ Tidak ada prediksi hujan/mendung dalam 24 jam ke depan.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
