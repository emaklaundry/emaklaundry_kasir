import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Customer } from '../types';
import { mockCustomers } from '../data/mockData';

interface CustomerContextType {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const CUSTOMERS_STORAGE_KEY = 'laundry_customers';

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
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
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    } catch (error) {
      console.error("Error saving customers to localStorage", error);
    }
  }, [customers]);

  return (
    <CustomerContext.Provider value={{ customers, setCustomers }}>
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