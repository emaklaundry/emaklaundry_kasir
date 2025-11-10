import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { InventoryItem } from '../types';
import { mockInventory } from '../data/mockData';

interface InventoryContextType {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INVENTORY_STORAGE_KEY = 'laundry_inventory';

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
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
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    } catch (error) {
        console.error("Error saving inventory to localStorage", error);
    }
  }, [inventory]);

  return (
    <InventoryContext.Provider value={{ inventory, setInventory }}>
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