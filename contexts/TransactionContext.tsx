import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Transaction, UserRole } from '../types';
import { mockTransactions } from '../data/mockData';
import { useAppContext } from './AppContext';

interface TransactionContextType {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const TRANSACTIONS_STORAGE_KEY = 'laundry_transactions_multistore';

const reviveDates = (key: string, value: any) => {
  const isDate = ['createdAt', 'estimatedCompletionDate', 'purchaseDate', 'date'].includes(key);
  if (isDate && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() => {
    try {
      const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (storedTransactions) {
        return JSON.parse(storedTransactions, reviveDates);
      }
      return mockTransactions;
    } catch (error) {
      console.error("Error reading transactions from localStorage", error);
      return mockTransactions;
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(allTransactions));
    } catch (error) {
        console.error("Error saving transactions to localStorage", error);
    }
  }, [allTransactions]);

  const { currentUser, selectedStoreId } = useAppContext();

  const transactions = useMemo(() => {
    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') {
        return allTransactions;
      }
      return allTransactions.filter(t => t.storeId === selectedStoreId);
    }
    return allTransactions.filter(t => t.storeId === currentUser.storeId);
  }, [allTransactions, currentUser, selectedStoreId]);

  return (
    <TransactionContext.Provider value={{ transactions, setTransactions: setAllTransactions }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};