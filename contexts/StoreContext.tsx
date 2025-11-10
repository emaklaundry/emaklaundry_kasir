import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Store } from '../types';
import { mockStores } from '../data/mockData';

interface StoreContextType {
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORES_STORAGE_KEY = 'laundry_stores';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<Store[]>(() => {
    try {
      const storedStores = localStorage.getItem(STORES_STORAGE_KEY);
      return storedStores ? JSON.parse(storedStores) : mockStores;
    } catch (error) {
      console.error("Error reading stores from localStorage", error);
      return mockStores;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores));
    } catch (error) {
      console.error("Error saving stores to localStorage", error);
    }
  }, [stores]);

  return (
    <StoreContext.Provider value={{ stores, setStores }}>
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
