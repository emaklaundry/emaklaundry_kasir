import * as React from 'react';
import { AppProvider } from './AppContext';
// Removed unused Provider imports; only hooks are exported from these contexts
import { ToastProvider } from './ToastContext';
import { CommandPaletteProvider } from '../hooks/useCommandPalette';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ToastProvider>
            <AppProvider>
                <CommandPaletteProvider>
                    {children}
                </CommandPaletteProvider>
            </AppProvider>
        </ToastProvider>
    );
};