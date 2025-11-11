import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Store } from '../types';
import { supabase } from '../utils/supabaseClient';

interface StoreContextType {
  stores: Store[];
  addStore: (store: Omit<Store, 'id'>) => Promise<void>;
  updateStore: (id: string, data: Partial<Store>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const fetchStores = async () => {
      const { data, error } = await supabase.from('stores').select('*');
      if (!error && data) setStores(data);
    };
    fetchStores();
  }, []);

  const addStore = async (store: Omit<Store, 'id'>) => {
    const { data, error } = await supabase.from('stores').insert([store]).select();
    if (!error && data) setStores((prev) => [...prev, ...data]);
  };

  const updateStore = async (id: string, data: Partial<Store>) => {
    const { data: updated, error } = await supabase.from('stores').update(data).eq('id', id).select();
    if (!error && updated) setStores((prev) => prev.map(s => s.id === id ? { ...s, ...updated[0] } : s));
  };

  return (
    <StoreContext.Provider value={{ stores, addStore, updateStore }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStores = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  return context;
};
