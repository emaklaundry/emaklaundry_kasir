import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Customer } from '../types';
import { supabase } from '../utils/supabaseClient';

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer | null>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from('customers').select('*');
      if (!error && data) setCustomers(data);
    };
    fetchCustomers();
  }, []);

  const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer | null> => {
    // Optimistic update: buat id sementara
    const tempId = 'temp-' + Date.now();
    const optimisticCustomer = { ...customer, id: tempId } as Customer;
    setCustomers((prev) => [...prev, optimisticCustomer]);
    try {
      const { data, error } = await supabase.from('customers').insert([customer]).select();
      if (!error && data && data[0]) {
        setCustomers((prev) => prev.map(c => c.id === tempId ? data[0] : c));
        return data[0];
      } else {
        // Rollback jika gagal
        setCustomers((prev) => prev.filter(c => c.id !== tempId));
        return null;
      }
    } catch (e) {
      setCustomers((prev) => prev.filter(c => c.id !== tempId));
      return null;
    }
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const { data: updated, error } = await supabase.from('customers').update(data).eq('id', id).select();
    if (!error && updated) setCustomers((prev) => prev.map(c => c.id === id ? { ...c, ...updated[0] } : c));
  };

  const deleteCustomer = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    setCustomers((prev) => prev.filter(c => c.id !== id));
  };

  return (
    <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};