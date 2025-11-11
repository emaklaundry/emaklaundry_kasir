import React, { createContext, useContext, ReactNode } from 'react';
import { Store } from '../types';
import { mockStores } from '../data/mockData';
import { usePersistentState } from '../hooks/usePersistentState';

interface StoreContextType {
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORES_STORAGE_KEY = 'laundry_stores';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stores, setStores] = usePersistentState<Store[]>(STORES_STORAGE_KEY, mockStores);

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
