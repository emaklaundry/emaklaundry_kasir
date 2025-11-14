/* global document */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCustomers } from '../contexts/CustomerContext';
import { Customer } from '../types';

interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  customers: Customer[];
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export const CommandPaletteProvider = ({ children }: CommandPaletteProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { customers } = useCustomers();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === 'K' && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', down);
      return () => document.removeEventListener('keydown', down);
    }
    return undefined;
  }, []);

  const value = {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    customers: customers || [],
  };

  return React.createElement(CommandPaletteContext.Provider, { value: value }, children);
};

export const useCommandPalette = (): CommandPaletteContextType => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
};
