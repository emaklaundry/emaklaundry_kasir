import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Store } from '../../types';
import { useStores } from './StoreContext';
import { supabase } from '@/utils/supabaseClient';
import { useToasts } from './ToastContext'; // 1. IMPOR useToasts

interface AppContextType {
  currentUser: User | null;
  signOut: () => Promise<void>;
  stores: Store[];
  selectedStoreId: string; // 'all' or a specific store ID
  setSelectedStoreId: (storeId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);



export function AppProvider({ children }: { children: ReactNode }) {
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { addToast } = useToasts(); // 2. INISIALISASI HOOK

  useEffect(() => {
    // Definisikan getProfile di dalam useEffect agar closure addToast selalu fresh
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (!error && data) {
          if (data.isActive === false) {
            addToast('Akun Anda tidak aktif. Silakan hubungi administrator.', 'error');
            await supabase.auth.signOut();
            setCurrentUser(null);
          } else {
            // Tambahkan log login jika transisi dari logout ke login
            if (currentUser === null) {
              const newLog = {
                timestamp: new Date(),
                user: data.name,
                action: 'Melakukan login.',
                storeId: data.store_id || null
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
  }, []);

  const signOut = async () => {
    // Tambahkan log logout sebelum currentUser dihapus
    if (currentUser) {
      const newLog = {
        timestamp: new Date(),
        user: currentUser.name,
        action: 'Melakukan logout.',
        storeId: currentUser.storeId || null
      };
      supabase.from('audit_logs').insert([newLog]).then();
    }
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
}