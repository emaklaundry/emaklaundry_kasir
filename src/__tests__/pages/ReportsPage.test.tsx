import { render } from '@testing-library/react';
import ReportsPage from '@/pages/ReportsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import AppContext from '@/contexts/AppContextContext';
import { UserRole } from '@/types';
import { vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastContext';

const queryClient = new QueryClient();

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
  it('renders without crashing', () => {
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
  });
});
