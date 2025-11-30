import { render } from '@testing-library/react';
import AuditLogPage from './AuditLogPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import AppContext from '../contexts/AppContextContext';
import { ToastProvider } from '../contexts/ToastContext';
import { UserRole } from '../types';
import { vi } from 'vitest';

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

describe('AuditLogPage', () => {
  it('renders without crashing', () => {
    const mockContext = {
      currentUser: {
        id: 'test-user',
        name: 'Test User',
        role: UserRole.SuperAdmin,
        storeId: 'test-store',
        createdAt: new Date(),
        isActive: true,
        canGiveDiscount: false,
      },
      signOut: vi.fn(),
      stores: mockStores,
      selectedStoreId: 'all',
      setSelectedStoreId: vi.fn(),
    };
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <AppContext.Provider value={mockContext}>
              <AuditLogPage />
            </AppContext.Provider>
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
});
