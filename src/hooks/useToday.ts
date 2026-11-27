// src/hooks/useToday.ts
import { useEffect, useState } from 'react';
import { toYmd } from '../utils/reportDates';

/**
 * Tanggal hari ini ('YYYY-MM-DD', waktu lokal) yang ikut berganti saat lewat
 * tengah malam atau saat aplikasi dibuka lagi (tab kembali aktif). Mencegah
 * halaman yang dibiarkan terbuka semalaman tetap menampilkan "hari ini" kemarin.
 */
export default function useToday(): string {
  const [today, setToday] = useState(() => toYmd(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => setToday(toYmd(new Date()));
    const schedule = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, next.getTime() - now.getTime());
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return today;
}
