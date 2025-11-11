import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { InventoryItem } from '../types';
import { supabase } from '../utils/supabaseClient';

interface InventoryContextType {
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase.from('inventory_items').select('*');
      if (!error && data) setInventory(data);
    };
    fetchInventory();
  }, []);

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    const { data, error } = await supabase.from('inventory_items').insert([item]).select();
    if (!error && data) setInventory((prev) => [...prev, ...data]);
  };

  const updateInventoryItem = async (id: string, data: Partial<InventoryItem>) => {
    const { data: updated, error } = await supabase.from('inventory_items').update(data).eq('id', id).select();
    if (!error && updated) setInventory((prev) => prev.map(i => i.id === id ? { ...i, ...updated[0] } : i));
  };

  const deleteInventoryItem = async (id: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
    setInventory((prev) => prev.filter(i => i.id !== id));
  };

  return (
    <InventoryContext.Provider value={{ inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem }}>
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
