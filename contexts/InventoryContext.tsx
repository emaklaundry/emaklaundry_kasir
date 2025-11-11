import React, { createContext, useContext, ReactNode } from 'react';
import { InventoryItem } from '../types';
import { mockInventory } from '../data/mockData';
import { usePersistentState } from '../hooks/usePersistentState';
import { useStoreFilteredData } from '../hooks/useStoreFilteredData';

interface InventoryContextType {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INVENTORY_STORAGE_KEY = 'laundry_inventory_multistore';

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allInventory, setAllInventory] = usePersistentState<InventoryItem[]>(INVENTORY_STORAGE_KEY, mockInventory);
  const inventory = useStoreFilteredData(allInventory);

  return (
    <InventoryContext.Provider value={{ inventory, setInventory: setAllInventory }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
