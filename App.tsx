// ...existing code...
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './src/contexts/AppContext';
import { UserRole } from '@/types';
import Layout from './src/components/Layout';

import { useTheme } from './src/hooks/useTheme';
import { AppProviders } from './src/contexts/AppProviders';
import CommandPalette from './src/components/CommandPalette';
import QuickActionsPage from './src/pages/QuickActionsPage';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./src/pages/Dashboard'));
const TransactionPage = lazy(() => import('./src/pages/transactions/TransactionPage'));
const NewTransactionPage = lazy(() => import('./src/pages/transactions/NewTransactionPage'));
const ServicesPage = lazy(() => import('./src/pages/management/ServicesPage'));
const InventoryPage = lazy(() => import('./src/pages/management/InventoryPage'));
const AssetsPage = lazy(() => import('./src/pages/management/AssetsPage'));
const ExpensesPage = lazy(() => import('./src/pages/management/ExpensesPage'));
const UsersPage = lazy(() => import('./src/pages/management/UsersPage'));
const ReportsPage = lazy(() => import('./src/pages/ReportsPage'));
const AuditLogPage = lazy(() => import('./src/pages/AuditLogPage'));
const SettingsPage = lazy(() => import('./src/pages/management/SettingsPage'));
const CustomersPage = lazy(() => import('./src/pages/management/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./src/pages/management/CustomerDetailPage'));
const ReceiptPage = lazy(() => import('./src/pages/transactions/ReceiptPage'));
const TransactionDetailPage = lazy(() => import('./src/pages/transactions/TransactionDetailPage'));
const StoresPage = lazy(() => import('./src/pages/management/StoresPage'));

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/login" />;
  const isAdmin = currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin;
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/login" />;
  return currentUser.role === UserRole.SuperAdmin ? <>{children}</> : <Navigate to="/" />;
};

const PageLoader: React.FC = () => (
  <div className="flex justify-center items-center w-full h-96">
    <div
      className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-blue-500"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

const LoginPage = lazy(() => import('./src/pages/LoginPage'));

const AppRoutes: React.FC = () => {
  const { currentUser } = useAppContext();
  if (currentUser === null) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    );
  }
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/quick-actions" element={<QuickActionsPage />} />
          <Route path="/transactions" element={<TransactionPage />} />
          <Route path="/transactions/new" element={<NewTransactionPage />} />
          <Route path="/transactions/:id/receipt" element={<ReceiptPage />} />
          <Route path="/transactions/:id/details" element={<TransactionDetailPage />} />
          {/* Admin Routes */}
          <Route
            path="/management/customers"
            element={
              <AdminRoute>
                <CustomersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/management/customers/:id"
            element={
              <AdminRoute>
                <CustomerDetailPage />
              </AdminRoute>
            }
          />
          <Route
            path="/management/assets"
            element={
              <AdminRoute>
                <AssetsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/management/inventory"
            element={
              <AdminRoute>
                <InventoryPage />
              </AdminRoute>
            }
          />
          <Route
            path="/management/services"
            element={
              <AdminRoute>
                <ServicesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/management/expenses"
            element={
              <AdminRoute>
                <ExpensesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/management/stores"
            element={
              <AdminRoute>
                <StoresPage />
              </AdminRoute>
            }
          />
          <Route
            path="/management/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/management/settings"
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            }
          />
        </Routes>
      </Suspense>
      <CommandPalette />
    </Layout>
  );
};

const App: React.FC = () => {
  useTheme(); // Initialize and apply theme
  return (
    <AppProviders>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
