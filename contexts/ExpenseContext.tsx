import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Expense, UserRole } from '../types';
import { mockExpenses } from '../data/mockData';
import { useAppContext } from './AppContext';

interface ExpenseContextType {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const EXPENSES_STORAGE_KEY = 'laundry_expenses_multistore';

const reviveDates = (key: string, value: any) => {
  if (key === 'date' && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

export const ExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allExpenses, setAllExpenses] = useState<Expense[]>(() => {
    try {
      const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (storedExpenses) {
        return JSON.parse(storedExpenses, reviveDates);
      }
      return mockExpenses;
    } catch (error) {
      console.error("Error reading expenses from localStorage", error);
      return mockExpenses;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(allExpenses));
    } catch (error) {
      console.error("Error saving expenses to localStorage", error);
    }
  }, [allExpenses]);

  const { currentUser, selectedStoreId } = useAppContext();

  const expenses = useMemo(() => {
    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') {
        return allExpenses;
      }
      return allExpenses.filter(e => e.storeId === selectedStoreId);
    }
    return allExpenses.filter(e => e.storeId === currentUser.storeId);
  }, [allExpenses, currentUser, selectedStoreId]);

  return (
    <ExpenseContext.Provider value={{ expenses, setExpenses: setAllExpenses }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};