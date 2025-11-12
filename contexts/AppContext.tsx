import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Store } from '../types';
import { useStores } from './StoreContext';
import { supabase } from '../utils/supabaseClient';
import { useToasts } from './ToastContext'; // 1. IMPOR useToasts

interface AppContextType {
  currentUser: User | null;
  signOut: () => Promise<void>;
  stores: Store[];
  selectedStoreId: string; // 'all' or a specific store ID
  setSelectedStoreId: (storeId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);



export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { addToast } = useToasts(); // 2. INISIALISASI HOOK

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (!error && data) {
          // 3. TAMBAHKAN LOGIKA PENGECEKAN DI SINI
          if (data.isActive === false) {
            // Jika user tidak aktif
            addToast('Akun Anda tidak aktif. Silakan hubungi administrator.', 'error');
            await supabase.auth.signOut(); // Langsung logout kembali
            setCurrentUser(null);
          } else {
            // Jika user aktif, lanjutkan seperti biasa
            setCurrentUser({
              id: data.id,
              name: data.name,
              role: data.role,
              storeId: data.store_id,
              createdAt: data.created_at ? new Date(data.created_at) : undefined,
              isActive: data.isActive,
              canGiveDiscount: data.canGiveDiscount
            });
          }
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };
    getProfile();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getProfile();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [addToast]); // 4. Tambahkan addToast ke dependency array

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider value={{ currentUser, signOut, stores, selectedStoreId, setSelectedStoreId }}>
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