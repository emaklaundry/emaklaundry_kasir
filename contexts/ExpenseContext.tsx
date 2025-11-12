import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Expense } from '../types';
import { supabase } from '../utils/supabaseClient';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      const { data, error } = await supabase.from('expenses').select('*');
      if (!error && data) setExpenses(data);
    };
    fetchExpenses();
  }, []);

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const { data, error } = await supabase.from('expenses').insert([expense]).select();
    if (error) throw error;
    if (data) setExpenses((prev) => [...prev, ...data]);
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    const { data: updated, error } = await supabase.from('expenses').update(data).eq('id', id).select();
    if (error) throw error;
    if (updated) setExpenses((prev) => prev.map(e => e.id === id ? { ...e, ...updated[0] } : e));
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    setExpenses((prev) => prev.filter(e => e.id !== id));
  };

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, updateExpense, deleteExpense }}>
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
