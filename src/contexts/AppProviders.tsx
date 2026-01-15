import * as React from 'react';
import { CommandPaletteProvider } from '../hooks/useCommandPalette';
import { AppProvider } from './AppContext';
// AppProviders: Only wraps UI/UX providers (Toast, Theme, CommandPalette, etc). Data providers (QueryClientProvider) are set at index.tsx root.
import { ToastProvider } from './ToastContext';
import { EmployeeProvider } from './EmployeeContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <AppProvider>
        <EmployeeProvider>
          <CommandPaletteProvider>{children}</CommandPaletteProvider>
        </EmployeeProvider>
      </AppProvider>
    </ToastProvider>
  );
};
