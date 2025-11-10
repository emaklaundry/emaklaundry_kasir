import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './contexts/AppContext';
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
import StoresPage from './pages/management/StoresPage';
import { useTheme } from './hooks/useTheme';
import { AppProviders } from './contexts/AppProviders';
import CommandPalette from './components/CommandPalette';


const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppContext();
  const isAdmin = currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.BranchAdmin;
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppContext();
  return currentUser.role === UserRole.SuperAdmin ? <>{children}</> : <Navigate to="/" />;
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
            <Route path="/management/assets" element={<AdminRoute><AssetsPage /></AdminRoute>} />
            <Route path="/management/expenses" element={<AdminRoute><ExpensesPage /></AdminRoute>} />
            <Route path="/management/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
            <Route path="/audit-log" element={<AdminRoute><AuditLogPage /></AdminRoute>} />
            <Route path="/settings" element={<AdminRoute><SettingsPage/></AdminRoute>} />

            {/* Super Admin Routes */}
            <Route path="/management/stores" element={<SuperAdminRoute><StoresPage /></SuperAdminRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <CommandPalette />
    </Layout>
);


const App: React.FC = () => {
  useTheme(); // Initialize and apply theme
  return (
    <AppProviders>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    </AppProviders>
  );
};

export default App;