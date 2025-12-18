import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from './types';
import useAppContext from './contexts/useAppContext';
import Layout from './components/layout/Layout';
import MaintenanceMode from './components/MaintenanceMode';
import { useSettings } from './contexts/SettingsContext';
import PWAUpdatePrompt from './components/widgets/PWAUpdatePrompt';

import useTheme from './hooks/useTheme';
import { AppProviders } from './contexts/AppProviders';
import CommandPalette from './components/CommandPalette';
import QuickActionsPage from './pages/QuickActionsPage';

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
const BackupRestorePage = lazy(() => import('./pages/management/BackupRestorePage'));
const CustomersPage = lazy(() => import('./pages/management/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/management/CustomerDetailPage'));
const ReceiptPage = lazy(() => import('./pages/transactions/ReceiptPage'));
const TransactionDetailPage = lazy(() => import('./pages/transactions/TransactionDetailPage'));
const StoresPage = lazy(() => import('./pages/management/StoresPage'));

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

const LoginPage = lazy(() => import('./pages/LoginPage'));

// Versi aplikasi otomatis dari package.json
// Pastikan resolveJsonModule diaktifkan di tsconfig.json
import pkg from '../package.json';
const APP_VERSION = `v${pkg.version}`;

const AppRoutes: React.FC = () => {
  const { currentUser, signOut } = useAppContext();
  const { settings, isLoading: isLoadingSettings } = useSettings();
  const [isAuthChecking, setIsAuthChecking] = React.useState(true);

  // Tunggu auth check selesai
  React.useEffect(() => {
    const checkAuth = async () => {
      // Beri waktu untuk auth check selesai
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  // Handler untuk logout dari maintenance mode
  const handleMaintenanceLogout = React.useCallback(async () => {
    await signOut();
    window.location.href = '/login';
  }, [signOut]);

  // Tampilkan loader saat checking auth ATAU loading settings
  if (isAuthChecking || isLoadingSettings) {
    return <PageLoader />;
  }

  // Jika belum login, tampilkan halaman login (jangan cek maintenance mode)
  if (currentUser === null) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/settings" element={<Navigate to="/management/settings" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    );
  }

  // Setelah login, cek maintenance mode (kecuali Super Admin)
  const isMaintenanceMode =
    settings?.isMaintenanceMode && currentUser?.role !== UserRole.SuperAdmin;

  if (isMaintenanceMode) {
    return (
      <MaintenanceMode message={settings?.maintenanceMessage} onLogout={handleMaintenanceLogout} />
    );
  }

  return (
    <>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/settings" element={<Navigate to="/management/settings" replace />} />
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
                <SuperAdminRoute>
                  <StoresPage />
                </SuperAdminRoute>
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
              path="/management/backup"
              element={
                <AdminRoute>
                  <BackupRestorePage />
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
            <Route
              path="/audit-log"
              element={
                <AdminRoute>
                  <AuditLogPage />
                </AdminRoute>
              }
            />
            {/* Tambahkan catch-all route di bawah ini */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <CommandPalette />
        {/* Tampilkan versi aplikasi di pojok kanan bawah */}
        <div
          style={{
            position: 'fixed',
            right: 12,
            bottom: 8,
            zIndex: 50,
            fontSize: 12,
            color: '#64748b',
            opacity: 0.7,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {APP_VERSION}
        </div>
      </Layout>
      <PWAUpdatePrompt />
    </>
  );
};

const App: React.FC = () => {
  useTheme(); // Initialize and apply theme
  return (
    <AppProviders>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AppProviders>
  );
};

export default App;
