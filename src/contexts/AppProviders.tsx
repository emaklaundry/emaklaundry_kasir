import * as React from 'react';
import { AppProvider } from './AppContext';
// AppProviders: Only wraps UI/UX providers (Toast, Theme, CommandPalette, etc). Data providers (QueryClientProvider) are set at index.tsx root.
import { ToastProvider } from './ToastContext';
import { CommandPaletteProvider } from '../hooks/useCommandPalette';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <AppProvider>
                <CommandPaletteProvider>
                    {children}
                </CommandPaletteProvider>
            </AppProvider>
        </ToastProvider>
    );
}