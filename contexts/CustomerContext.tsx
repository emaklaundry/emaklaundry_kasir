import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Customer } from '../types';
import { supabase } from '../utils/supabaseClient';

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
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

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    const { data, error } = await supabase.from('customers').insert([customer]).select();
    if (!error && data) setCustomers((prev) => [...prev, ...data]);
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const { data: updated, error } = await supabase.from('customers').update(data).eq('id', id).select();
    if (!error && updated) setCustomers((prev) => prev.map(c => c.id === id ? { ...c, ...updated[0] } : c));
  };

  return (
    <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer }}>
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