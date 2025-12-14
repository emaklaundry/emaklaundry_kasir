import React, { useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import AppContext from './AppContextContext';
import { User, Store } from '../types/index';
import { supabase } from '../utils/supabaseClient';
import { useStores } from './StoreContext';
import useToasts from './useToasts'; // 1. IMPOR useToasts

// Konfigurasi waktu timeout (5 menit)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 menit = 300000ms

export interface AppContextType {
  currentUser: User | null;
  signOut: () => Promise<void>;
  stores: Store[];
  selectedStoreId: string; // 'all' or a specific store ID
  setSelectedStoreId: (storeId: string) => void;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { addToast } = useToasts(); // 2. INISIALISASI HOOK

  const prevLoggedInRef = useRef(false);

  // Online/Offline detection dipindahkan ke Header component (persistent indicator)

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (error) {
          console.error('Error fetching profile:', error);
        }
        if (data) {
          if (data.isActive === false) {
            addToast('Akun Anda tidak aktif. Silakan hubungi administrator.', 'error');
            await supabase.auth.signOut();
            setCurrentUser(null);
            prevLoggedInRef.current = false;
          } else {
            // Deteksi transisi dari logout ke login
            if (!prevLoggedInRef.current) {
              const newLog = {
                timestamp: new Date().toISOString(),
                user: data.name ?? null,
                action: 'Melakukan login.',
                storeId: data.store_id ?? null,
              };
              supabase.from('audit_logs').insert([newLog]).then();
            }
            setCurrentUser({
              id: data.id,
              name: data.name,
              role: data.role as import('../types').UserRole,
              storeId: data.store_id ?? undefined,
              createdAt: data.created_at ? new Date(data.created_at) : undefined,
              isActive: data.isActive ?? false,
              canGiveDiscount: data.canGiveDiscount ?? false,
            });
            prevLoggedInRef.current = true;
          }
        } else {
          // Profil tidak ditemukan (bisa karena trigger belum jalan)
          console.warn('User login berhasil, tapi profil tidak ditemukan di database.');
          // Opsi: Logout otomatis atau biarkan null
          // await supabase.auth.signOut();
          setCurrentUser(null);
          prevLoggedInRef.current = false;
        }
      } else {
        setCurrentUser(null);
        prevLoggedInRef.current = false;
      }
    };
    getProfile();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getProfile();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [addToast]);

  // Bungkus signOut dengan useCallback agar stabil di dalam useEffect dependency
  const signOut = useCallback(async () => {
    if (currentUser) {
      const newLog = {
        timestamp: new Date().toISOString(),
        user: currentUser.name ?? null,
        action: 'Melakukan logout.',
        storeId: currentUser.storeId ?? null,
      };
      supabase.from('audit_logs').insert([newLog]).then();
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, [currentUser]);

  // --- LOGIC AUTO LOGOUT ---
  useEffect(() => {
    // Hanya jalankan jika user sedang login
    if (!currentUser) return;

    let timeoutId: NodeJS.Timeout;

    const handleInactivity = () => {
      signOut();
      addToast('Sesi Anda telah berakhir karena tidak ada aktivitas.', 'info');
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
    };

    // Event yang dianggap sebagai aktivitas
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Mulai timer pertama kali
    resetTimer();

    // Cleanup saat unmount atau currentUser berubah (logout)
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser, signOut, addToast]);
  // -------------------------

  // --- AUTO LOGOUT SAAT TUTUP BROWSER/TAB ---
  useEffect(() => {
    if (!currentUser) return;

    // Track jika sedang refresh/reload
    let isRefreshing = false;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Set flag bahwa user sedang refresh/reload
      isRefreshing = true;
      sessionStorage.setItem('isRefreshing', 'true');
    };

    const handleUnload = async () => {
      // Tunggu sebentar untuk cek apakah ini refresh atau close
      await new Promise((resolve) => setTimeout(resolve, 50));

      const wasRefreshing = sessionStorage.getItem('isRefreshing');

      // Jika bukan refresh, logout
      if (!wasRefreshing) {
        await signOut();
      }

      // Clear flag refresh
      sessionStorage.removeItem('isRefreshing');
    };

    const handleVisibilityChange = () => {
      // Clear refresh flag saat page visible lagi (setelah refresh selesai)
      if (!document.hidden) {
        sessionStorage.removeItem('isRefreshing');
      }
    };

    // Clear refresh flag saat component mount (setelah refresh selesai)
    sessionStorage.removeItem('isRefreshing');

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, signOut]);
  // -------------------------

  return (
    <AppContext.Provider
      value={{ currentUser, signOut, stores, selectedStoreId, setSelectedStoreId }}
    >
      {children}
    </AppContext.Provider>
  );
};



