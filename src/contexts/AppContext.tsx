import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { User, Store } from '../types/index';
import { supabase } from '../utils/supabaseClient';
import { useStores } from './StoreContext';
import { useToasts } from './ToastContext'; // 1. IMPOR useToasts

interface AppContextType {
  currentUser: User | null;
  signOut: () => Promise<void>;
  stores: Store[];
  selectedStoreId: string; // 'all' or a specific store ID
  setSelectedStoreId: (storeId: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { addToast } = useToasts(); // 2. INISIALISASI HOOK

  const prevLoggedInRef = useRef(false);

  // Notifikasi Online/Offline
  useEffect(() => {
    const handleOnline = () => {
      addToast('Koneksi internet terhubung kembali.', 'success');
    };
    const handleOffline = () => {
      addToast('Koneksi internet terputus. Anda dalam mode offline.', 'error');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

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
                timestamp: new Date(),
                user: data.name,
                action: 'Melakukan login.',
                storeId: data.store_id || null,
              };
              supabase.from('audit_logs').insert([newLog]).then();
            }
            setCurrentUser({
              id: data.id,
              name: data.name,
              role: data.role,
              storeId: data.store_id,
              createdAt: data.created_at ? new Date(data.created_at) : undefined,
              isActive: data.isActive,
              canGiveDiscount: data.canGiveDiscount,
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

  const signOut = async () => {
    // Tambahkan log logout sebelum currentUser dihapus
    if (currentUser) {
      const newLog = {
        timestamp: new Date(),
        user: currentUser.name,
        action: 'Melakukan logout.',
        storeId: currentUser.storeId || null,
      };
      supabase.from('audit_logs').insert([newLog]).then();
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider
      value={{ currentUser, signOut, stores, selectedStoreId, setSelectedStoreId }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
