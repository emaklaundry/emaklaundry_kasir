import React, { useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import AppContext from './AppContextContext';
import { User, Store } from '../types/index';
import { supabase } from '../utils/supabaseClient';
import { useStores } from './StoreContext';
import useToasts from './useToasts'; // 1. IMPOR useToasts
import {
  ATTENDANCE_ACTIVITY_EVENTS,
  ATTENDANCE_PING_INTERVAL_MS,
  recordAttendance,
} from '../utils/attendanceTracker';

// Konfigurasi waktu timeout (5 menit)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 menit = 300000ms

const getSessionStorageItem = (key: string): string | null => {
  try {
    return window.sessionStorage.getItem(key);
  } catch (error) {
    console.warn('Session state could not be read:', error);
    return null;
  }
};

const setSessionStorageItem = (key: string, value: string): void => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch (error) {
    console.warn('Session state could not be saved:', error);
  }
};

const removeSessionStorageItem = (key: string): void => {
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.warn('Session state could not be cleared:', error);
  }
};

export interface AppContextType {
  loading: boolean;
  currentUser: User | null;
  signOut: () => Promise<void>;
  stores: Store[];
  selectedStoreId: string; // 'all' or a specific store ID
  setSelectedStoreId: (storeId: string) => void;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { stores } = useStores();
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { addToast } = useToasts(); // 2. INISIALISASI HOOK

  const prevLoggedInRef = useRef(false);

  // Online/Offline detection dipindahkan ke Header component (persistent indicator)

  useEffect(() => {
    const getProfile = async () => {
      try {
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
                employeeId: data.employee_id ?? undefined,
              });

              // Automatically select the store if the user is bound to one
              if (data.store_id) {
                setSelectedStoreId(data.store_id);
              }

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
      } finally {
        setLoading(false);
      }
    };
    getProfile();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'USER_UPDATED' ||
        event === 'PASSWORD_RECOVERY'
      ) {
        getProfile();
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [addToast]);

  // recordClockOut: hanya "Keluar" yang ditekan karyawan yang dihitung jam pulang.
  // Logout otomatis karena tidak aktif tidak dihitung; jam pulangnya = aktivitas terakhir.
  const endSession = useCallback(
    async (recordClockOut: boolean) => {
      if (currentUser) {
        const newLog = {
          timestamp: new Date().toISOString(),
          user: currentUser.name ?? null,
          action: 'Melakukan logout.',
          storeId: currentUser.storeId ?? null,
        };
        supabase.from('audit_logs').insert([newLog]).then();
        if (recordClockOut && currentUser.employeeId) {
          await recordAttendance('logout');
        }
      }
      await supabase.auth.signOut();
      setCurrentUser(null);
    },
    [currentUser],
  );

  // Bungkus signOut dengan useCallback agar stabil di dalam useEffect dependency
  const signOut = useCallback(() => endSession(true), [endSession]);

  // --- ABSENSI OTOMATIS (khusus akun login karyawan) ---
  const employeeId = currentUser?.employeeId;
  useEffect(() => {
    if (!employeeId) return;

    let lastPingAt = 0;
    const ping = () => {
      lastPingAt = Date.now();
      void recordAttendance('activity');
    };
    const onActivity = () => {
      if (Date.now() - lastPingAt >= ATTENDANCE_PING_INTERVAL_MS) ping();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') onActivity();
    };

    // Membuka aplikasi / login = hadir.
    ping();
    ATTENDANCE_ACTIVITY_EVENTS.forEach((event) =>
      document.addEventListener(event, onActivity, { passive: true }),
    );
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      ATTENDANCE_ACTIVITY_EVENTS.forEach((event) =>
        document.removeEventListener(event, onActivity),
      );
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [employeeId]);
  // -------------------------

  // --- LOGIC AUTO LOGOUT ---
  useEffect(() => {
    // Hanya jalankan jika user sedang login
    if (!currentUser) return;

    let timeoutId: NodeJS.Timeout;

    const handleInactivity = () => {
      endSession(false);
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
  }, [currentUser, endSession, addToast]);
  // -------------------------

  // --- AUTO LOGOUT SAAT TUTUP BROWSER/TAB ---
  useEffect(() => {
    if (!currentUser) return;

    const handleBeforeUnload = () => {
      // Set flag bahwa user sedang refresh/reload
      setSessionStorageItem('isRefreshing', 'true');
    };

    const handleVisibilityChange = () => {
      // Alternative to unload: use visibilitychange
      if (document.visibilityState === 'hidden') {
        const wasRefreshing = getSessionStorageItem('isRefreshing');
        if (!wasRefreshing) {
          // User potentially closing tab/browser
          setSessionStorageItem('maybeClosing', 'true');
        }
      } else if (document.visibilityState === 'visible') {
        // User came back, clear the flag
        removeSessionStorageItem('maybeClosing');
        removeSessionStorageItem('isRefreshing');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Clean up flags
      removeSessionStorageItem('isRefreshing');
      removeSessionStorageItem('maybeClosing');
    };
  }, [currentUser]);
  // -------------------------

  return (
    <AppContext.Provider
      value={{ loading, currentUser, signOut, stores, selectedStoreId, setSelectedStoreId }}
    >
      {children}
    </AppContext.Provider>
  );
};
