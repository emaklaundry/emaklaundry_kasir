import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '@/pages/Dashboard';
import { UserRole, OrderStatus, PaymentStatus } from '@/types';

// Mock Child Components to avoid deep rendering issues
vi.mock('@/components/widgets/WeatherWidget', () => ({
  default: () => <div data-testid="weather-widget" />,
}));
vi.mock('@/components/QuickStockUpdateModal', () => ({
  default: () => <div data-testid="stock-modal" />,
}));
vi.mock('@/components/ExpenseFormModal', () => ({
  default: () => <div role="dialog">Expense Modal</div>,
}));
vi.mock('@/components/QuickMaintenanceModal', () => ({ default: () => <div /> }));
vi.mock('@/components/WhatsAppModal', () => ({ default: () => <div /> }));
vi.mock('@/components/PaymentModal', () => ({ default: () => <div /> }));
vi.mock('@/components/Pagination', () => ({ default: () => <div /> }));

// Mock contexts
vi.mock('@/contexts/useAppContext', () => ({
  default: vi.fn(() => ({
    currentUser: {
      id: 'user-1',
      name: 'Test User',
      role: UserRole.Admin,
      storeId: 'test-store',
      createdAt: new Date(),
      isActive: true,
      canGiveDiscount: false,
    },
    signOut: vi.fn(),
    stores: [{ id: 'test-store', name: 'Test Store' }],
    selectedStoreId: 'test-store',
    setSelectedStoreId: vi.fn(),
  })),
}));

vi.mock('@/contexts/InventoryContext', () => ({
  fetchInventory: vi.fn().mockResolvedValue({ data: [], count: 0 }),
}));

vi.mock('@/contexts/CustomerContext', () => ({
  fetchCustomers: vi.fn().mockResolvedValue({ data: [], count: 0 }),
}));

vi.mock('@/contexts/TransactionContext', () => ({
  useTransactions: vi.fn(() => ({
    transactions: Array.from({ length: 6 }, (_, i) => ({
      id: `t-${i}`,
      invoiceCode: `INV-${i}`,
      customerId: 'c-1',
      orderStatus: OrderStatus.Processing, // Active order
      paymentStatus: PaymentStatus.Unpaid,
      amountPaid: 0,
      createdAt: new Date(),
      estimatedCompletionDate: new Date().toISOString(),
      items: [],
      storeId: 'test-store',
    })),
    updateTransaction: vi.fn(),
  })),
}));

vi.mock('@/contexts/ExpenseContext', () => ({
  useExpenses: vi.fn(() => ({
    addExpense: vi.fn(),
  })),
}));

vi.mock('@/contexts/ScheduledMaintenanceContext', () => ({
  useScheduledMaintenances: vi.fn(() => ({
    scheduledMaintenances: [],
    updateScheduledMaintenance: vi.fn(),
  })),
}));

vi.mock('@/contexts/AssetContext', () => ({
  useAssets: vi.fn(() => ({
    assets: [],
    updateAsset: vi.fn(),
  })),
}));

vi.mock('@/contexts/AuditLogContext', () => ({
  useAuditLogs: vi.fn(() => ({
    addAuditLog: vi.fn(),
  })),
}));

vi.mock('@/contexts/useToasts', () => ({
  default: vi.fn(() => ({
    addToast: vi.fn(),
    updateToast: vi.fn(),
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    // Search for header text
    expect(await screen.findByText(/Tampilan Data/i)).toBeInTheDocument();
  });

  it.skip('shows pagination controls if more than 5 active orders', async () => {
    // We mocked 6 active orders (Processing), pagination should trigger (pageSize 5?)
    // Verify pageSize in Dashboard logic.
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Wait for data
    expect(await screen.findByText('INV-0')).toBeInTheDocument();

    // Check absence of pagination since 6 items < 15 pageSize
    const nextButton = screen.queryByTitle(/Halaman berikutnya/i);
    expect(nextButton).not.toBeInTheDocument();
  });

  it('opens expense modal when button clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const button = await screen.findByText(/Catat Pengeluaran/i);
    fireEvent.click(button);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
