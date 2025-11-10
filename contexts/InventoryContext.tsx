import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { InventoryItem, UserRole } from '../types';
import { mockInventory } from '../data/mockData';
import { useAppContext } from './AppContext';

interface InventoryContextType {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INVENTORY_STORAGE_KEY = 'laundry_inventory_multistore';

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allInventory, setAllInventory] = useState<InventoryItem[]>(() => {
    try {
      const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
      return storedInventory ? JSON.parse(storedInventory) : mockInventory;
    } catch (error) {
      console.error("Error reading inventory from localStorage", error);
      return mockInventory;
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(allInventory));
    } catch (error) {
        console.error("Error saving inventory to localStorage", error);
    }
  }, [allInventory]);

  const { currentUser, selectedStoreId } = useAppContext();

  const inventory = useMemo(() => {
    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') {
        return allInventory;
      }
      return allInventory.filter(i => i.storeId === selectedStoreId);
    }
    return allInventory.filter(i => i.storeId === currentUser.storeId);
  }, [allInventory, currentUser, selectedStoreId]);


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