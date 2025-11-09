import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
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

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </Layout>
);


const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
};

export default App;