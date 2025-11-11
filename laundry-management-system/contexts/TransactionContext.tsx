import React, { createContext, useContext, ReactNode } from 'react';
import { Transaction } from '../types';
import { mockTransactions } from '../data/mockData';
import { usePersistentState } from '../hooks/usePersistentState';
import { useStoreFilteredData } from '../hooks/useStoreFilteredData';

interface TransactionContextType {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const TRANSACTIONS_STORAGE_KEY = 'laundry_transactions_multistore';

const reviveDates = (key: string, value: any) => {
  const isDate = ['createdAt', 'estimatedCompletionDate'].includes(key);
  if (isDate && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allTransactions, setAllTransactions] = usePersistentState<Transaction[]>(TRANSACTIONS_STORAGE_KEY, mockTransactions, reviveDates);
  const transactions = useStoreFilteredData(allTransactions);

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
