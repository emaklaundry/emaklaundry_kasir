import * as React from 'react';
import { AppProvider } from './AppContext';
import { InventoryProvider } from './InventoryContext';
import { TransactionProvider } from './TransactionContext';
import { SettingsProvider } from './SettingsContext';
import { CustomerProvider } from './CustomerContext';
import { AssetProvider } from './AssetContext';
import { ExpenseProvider } from './ExpenseContext';
import { StoreProvider } from './StoreContext';
import { ServiceProvider } from './ServiceContext';
import { ScheduledMaintenanceProvider } from './ScheduledMaintenanceContext';
import { AuditLogProvider } from './AuditLogContext';
import { ToastProvider } from './ToastContext';
import { CommandPaletteProvider } from '../hooks/useCommandPalette';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ToastProvider>
            <StoreProvider>
                <AppProvider>
                    <SettingsProvider>
                        <ServiceProvider>
                            <CustomerProvider>
                                <TransactionProvider>
                                    <InventoryProvider>
                                        <AssetProvider>
                                            <ExpenseProvider>
                                                <ScheduledMaintenanceProvider>
                                                    <AuditLogProvider>
                                                        <CommandPaletteProvider>
                                                            {children}
                                                        </CommandPaletteProvider>
                                                    </AuditLogProvider>
                                                </ScheduledMaintenanceProvider>
                                            </ExpenseProvider>
                                        </AssetProvider>
                                    </InventoryProvider>
                                </TransactionProvider>
                            </CustomerProvider>
                        </ServiceProvider>
                    </SettingsProvider>
                </AppProvider>
            </StoreProvider>
        </ToastProvider>
    );
};