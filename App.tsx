import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { AssetProvider } from './contexts/AssetContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { UserRole } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TransactionPage from './pages/transactions/TransactionPage';
import NewTransactionPage from './pages/transactions/NewTransactionPage';
import ServicesPage from './pages/management/ServicesPage';
import InventoryPage from './pages/management/InventoryPage';
import AssetsPage from './pages/management/AssetsPage';
import ExpensesPage from './pages/management/ExpensesPage';
import UsersPage from './pages/management/UsersPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/management/SettingsPage';
import CustomersPage from './pages/management/CustomersPage';
import CustomerDetailPage from './pages/management/CustomerDetailPage';
import ReceiptPage from './pages/transactions/ReceiptPage';
import TransactionDetailPage from './pages/transactions/TransactionDetailPage';


const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userRole } = useAppContext();
  return userRole === UserRole.Admin ? <>{children}</> : <Navigate to="/" />;
};

const AppRoutes: React.FC = () => (
    <Layout>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionPage />} />
            <Route path="/transactions/new" element={<NewTransactionPage />} />
            <Route path="/transactions/:id/receipt" element={<ReceiptPage />} />
            <Route path="/transactions/:id/details" element={<TransactionDetailPage />} />
            
            {/* Admin Routes */}
            <Route path="/management/customers" element={<AdminRoute><CustomersPage /></AdminRoute>} />
            <Route path="/management/customers/:id" element={<AdminRoute><CustomerDetailPage /></AdminRoute>} />
            <Route path="/management/services" element={<AdminRoute><ServicesPage /></AdminRoute>} />
            <Route path="/management/inventory" element={<AdminRoute><InventoryPage /></AdminRoute>} />
            <Route path="/management/assets" element={<AssetsPage />} />
            <Route path="/management/expenses" element={<ExpensesPage />} />
            <Route path="/management/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
            <Route path="/audit-log" element={<AdminRoute><AuditLogPage /></AdminRoute>} />
            <Route path="/settings" element={<AdminRoute><SettingsPage/></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </Layout>
);


const App: React.FC = () => {
  return (
    <AppProvider>
      <SettingsProvider>
        <InventoryProvider>
          <CustomerProvider>
            <TransactionProvider>
              <AssetProvider>
                <ExpenseProvider>
                  <HashRouter>
                    <AppRoutes />
                  </HashRouter>
                </ExpenseProvider>
              </AssetProvider>
            </TransactionProvider>
          </CustomerProvider>
        </InventoryProvider>
      </SettingsProvider>
    </AppProvider>
  );
};

export default App;
