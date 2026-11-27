import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

/**
 * ID user dari sesi Supabase (null jika belum login), ikut berubah saat login/logout.
 *
 * Dipakai untuk query yang dipasang SEBELUM login (provider/root). RLS mengembalikan []
 * TANPA error untuk pengguna anonim, jadi query semacam itu harus `enabled: !!userId` dan
 * di-key per user; kalau tidak, hasil kosong dari halaman login ikut ter-cache.
 */
export function useSessionUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const auth = supabase.auth;
    if (!auth) return;
    let active = true;
    void auth.getSession().then(({ data }) => {
      if (active) setUserId(data.session?.user?.id ?? null);
    });
    const { data } = auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return userId;
}
