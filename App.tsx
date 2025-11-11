import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './contexts/AppContext';
import { UserRole } from './types';
import Layout from './components/Layout';
import { useTheme } from './hooks/useTheme';
import { AppProviders } from './contexts/AppProviders';
import CommandPalette from './components/CommandPalette';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TransactionPage = lazy(() => import('./pages/transactions/TransactionPage'));
const NewTransactionPage = lazy(() => import('./pages/transactions/NewTransactionPage'));
const ServicesPage = lazy(() => import('./pages/management/ServicesPage'));
const InventoryPage = lazy(() => import('./pages/management/InventoryPage'));
const AssetsPage = lazy(() => import('./pages/management/AssetsPage'));
const ExpensesPage = lazy(() => import('./pages/management/ExpensesPage'));
const UsersPage = lazy(() => import('./pages/management/UsersPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const SettingsPage = lazy(() => import('./pages/management/SettingsPage'));
const CustomersPage = lazy(() => import('./pages/management/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/management/CustomerDetailPage'));
const ReceiptPage = lazy(() => import('./pages/transactions/ReceiptPage'));
const TransactionDetailPage = lazy(() => import('./pages/transactions/TransactionDetailPage'));
const StoresPage = lazy(() => import('./pages/management/StoresPage'));


const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppContext();
  const isAdmin = currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.BranchAdmin;
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppContext();
  return currentUser.role === UserRole.SuperAdmin ? <>{children}</> : <Navigate to="/" />;
};

const PageLoader: React.FC = () => (
    <div className="flex justify-center items-center w-full h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-blue-500" role="status">
            <span className="sr-only">Loading...</span>
        </div>
    </div>
);

const AppRoutes: React.FC = () => (
    <Layout>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
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