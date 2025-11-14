import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { User, Store } from '../../types';
import { useStores } from './StoreContext';
import { supabase } from '../../utils/supabaseClient';
import { useToasts } from './ToastContext'; // 1. IMPOR useToasts

interface AppContextType {
  currentUser: User | null;
  signOut: () => Promise<void>;
  stores: Store[];
  selectedStoreId: string; // 'all' or a specific store ID
  setSelectedStoreId: (storeId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);




const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { addToast } = useToasts();

  // signOut dibungkus useCallback agar dependency stabil
  const signOut = useCallback(async () => {
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
  }, [currentUser]);
          } else {
            // Tambahkan log login jika transisi dari logout ke login
            if (currentUser === null) {
              const newLog = {
                timestamp: new Date(),
                user: data.name,
                action: 'Melakukan login.',
                storeId: data.store_id || null
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
                        await signOut(); 
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
              }, [addToast, signOut]);

              // --- LOGIKA AUTO LOGOUT ---
              const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 menit
              const timerId = useRef<NodeJS.Timeout | null>(null);

              // Fungsi yang akan dipanggil saat timer habis
              const handleInactivityLogout = useCallback(() => {
                  if (currentUser) {
                      addToast('Anda telah logout otomatis karena tidak aktif selama 15 menit.', 'info');
                      signOut();
                  }
              }, [currentUser, signOut, addToast]);

              // Fungsi untuk me-reset timer
              const resetTimer = useCallback(() => {
                  if (timerId.current) {
                      clearTimeout(timerId.current);
                  }
                  if (currentUser) {
                      timerId.current = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT);
                  }
              }, [currentUser, handleInactivityLogout, INACTIVITY_TIMEOUT]);

              useEffect(() => {
                  if (!currentUser) {
                      if (timerId.current) {
                          clearTimeout(timerId.current);
                          timerId.current = null;
                      }
                      return;
                  }
                  const events: (keyof WindowEventMap)[] = [
                      'mousemove', 
                      'mousedown', 
                      'keypress', 
                      'touchstart', 
                      'scroll'
                  ];
                  resetTimer();
                  events.forEach(event => {
                      window.addEventListener(event, resetTimer);
                  });
                  return () => {
                      if (timerId.current) {
                          clearTimeout(timerId.current);
                      }
                      events.forEach(event => {
                          window.removeEventListener(event, resetTimer);
                      });
                  };
              }, [currentUser, resetTimer]);
              // --- AKHIR LOGIKA AUTO LOGOUT ---
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};