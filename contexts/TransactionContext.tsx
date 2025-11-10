import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Transaction } from '../types';
import { mockTransactions } from '../data/mockData';

interface TransactionContextType {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const TRANSACTIONS_STORAGE_KEY = 'laundry_transactions';

// Function to revive date objects from JSON
const reviveDates = (key: string, value: any) => {
  const isDate = ['createdAt', 'estimatedCompletionDate', 'purchaseDate', 'date'].includes(key);
  if (isDate && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};


export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
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
        localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
        console.error("Error saving transactions to localStorage", error);
    }
  }, [transactions]);


  return (
    <TransactionContext.Provider value={{ transactions, setTransactions }}>
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