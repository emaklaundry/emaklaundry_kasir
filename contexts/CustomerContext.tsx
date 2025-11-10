import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Customer, UserRole } from '../types';
import { mockCustomers } from '../data/mockData';
import { useAppContext } from './AppContext';

interface CustomerContextType {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const CUSTOMERS_STORAGE_KEY = 'laundry_customers_multistore';

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allCustomers, setAllCustomers] = useState<Customer[]>(() => {
    try {
      const storedCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      return storedCustomers ? JSON.parse(storedCustomers) : mockCustomers;
    } catch (error) {
      console.error("Error reading customers from localStorage", error);
      return mockCustomers;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(allCustomers));
    } catch (error) {
      console.error("Error saving customers to localStorage", error);
    }
  }, [allCustomers]);

  const { currentUser, selectedStoreId } = useAppContext();

  const customers = useMemo(() => {
    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') {
        return allCustomers;
      }
      return allCustomers.filter(c => c.storeId === selectedStoreId);
    }
    return allCustomers.filter(c => c.storeId === currentUser.storeId);
  }, [allCustomers, currentUser, selectedStoreId]);

  return (
    <CustomerContext.Provider value={{ customers, setCustomers: setAllCustomers }}>
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