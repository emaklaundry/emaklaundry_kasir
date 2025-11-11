import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Transaction } from '../types';
import { supabase } from '../utils/supabaseClient';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase.from('transactions').select('*');
      if (!error && data) setTransactions(data);
    };
    fetchTransactions();
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const { data, error } = await supabase.from('transactions').insert([transaction]).select();
    if (!error && data) setTransactions((prev) => [...prev, ...data]);
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    const { data: updated, error } = await supabase.from('transactions').update(data).eq('id', id).select();
    if (!error && updated) setTransactions((prev) => prev.map(t => t.id === id ? { ...t, ...updated[0] } : t));
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, updateTransaction }}>
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
