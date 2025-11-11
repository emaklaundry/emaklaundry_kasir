import React, { createContext, useContext, ReactNode } from 'react';
import { Expense } from '../types';
import { mockExpenses } from '../data/mockData';
import { usePersistentState } from '../hooks/usePersistentState';
import { useStoreFilteredData } from '../hooks/useStoreFilteredData';

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
  const [allExpenses, setAllExpenses] = usePersistentState<Expense[]>(EXPENSES_STORAGE_KEY, mockExpenses, reviveDates);
  const expenses = useStoreFilteredData(allExpenses);

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
