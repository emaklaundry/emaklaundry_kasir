import { render, screen } from '@testing-library/react';
import ReportsPage from '@/pages/ReportsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import AppContext from '@/contexts/AppContextContext';
import { OrderStatus, PaymentStatus, UserRole } from '@/types';
import { vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastContext';

const mockUser = {
  id: 'test-user',
  name: 'Test User',
  role: UserRole.SuperAdmin,
  storeId: 'test-store',
  createdAt: new Date(),
  isActive: true,
  canGiveDiscount: false,
};

const mockStores = [{ id: 'test-store', name: 'Test Store', address: 'Jl. Test', isActive: true }];

describe('ReportsPage', () => {
  it('renders separate rows for cashiers with the same fallback name', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { enabled: false } },
    });
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    queryClient.setQueryData(
      ['report-transactions', 'all', startDate, endDate],
      [
        {
          id: 'transaction-1',
          customerId: 'customer-1',
          items: [],
          subtotal: 100,
          discount: 0,
          tax: 0,
          total: 100,
          paymentStatus: PaymentStatus.Paid,
          orderStatus: OrderStatus.Completed,
          createdAt: now,
          estimatedCompletionDate: '',
          amountPaid: 100,
          change: 0,
          createdByUserId: 'missing-user-1',
          storeId: 'test-store',
        },
        {
          id: 'transaction-2',
          customerId: 'customer-2',
          items: [],
          subtotal: 200,
          discount: 0,
          tax: 0,
          total: 200,
          paymentStatus: PaymentStatus.Paid,
          orderStatus: OrderStatus.Completed,
          createdAt: now,
          estimatedCompletionDate: '',
          amountPaid: 200,
          change: 0,
          createdByUserId: 'missing-user-2',
          storeId: 'test-store',
        },
      ],
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <AppContext.Provider
              value={{
                currentUser: mockUser,
                signOut: vi.fn(),
                stores: mockStores,
                selectedStoreId: 'all',
                setSelectedStoreId: vi.fn(),
                loading: false,
              }}
            >
              <ReportsPage />
            </AppContext.Provider>
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findAllByText('Unknown User')).toHaveLength(2);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
