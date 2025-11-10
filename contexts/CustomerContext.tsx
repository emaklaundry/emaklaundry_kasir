import React, { createContext, useContext, ReactNode } from 'react';
import { Customer } from '../types';
import { mockCustomers } from '../data/mockData';
import { usePersistentState } from '../hooks/usePersistentState';
import { useStoreFilteredData } from '../hooks/useStoreFilteredData';

interface CustomerContextType {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const CUSTOMERS_STORAGE_KEY = 'laundry_customers_multistore';

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allCustomers, setAllCustomers] = usePersistentState<Customer[]>(CUSTOMERS_STORAGE_KEY, mockCustomers);
  const customers = useStoreFilteredData(allCustomers);

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
