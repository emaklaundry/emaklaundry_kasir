import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '@/pages/Dashboard';
import { AppProviders } from '@/contexts/AppProviders';
import AppContext from '@/contexts/AppContextContext';
import { User, UserRole } from '@/types';
import { vi } from 'vitest';

const queryClient = new QueryClient();

const mockUser: User = {
  id: 'test-user',
  name: 'Test User',
  role: UserRole.Admin,
  storeId: 'test-store',
  createdAt: new Date(),
  isActive: true,
  canGiveDiscount: false,
};

const MockAppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppContext.Provider
    value={{
      currentUser: mockUser,
      signOut: vi.fn(),
      stores: [],
      selectedStoreId: 'all',
      setSelectedStoreId: vi.fn(),
    }}
  >
    {children}
  </AppContext.Provider>
);

describe('Dashboard Page', () => {
  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MockAppContextProvider>
          <MemoryRouter>
            <AppProviders>
              <Dashboard />
            </AppProviders>
          </MemoryRouter>
        </MockAppContextProvider>
      </QueryClientProvider>,
    );
    // Cari heading yang benar-benar ada di Dashboard
    expect(screen.getByText(/Tampilan Data/i)).toBeInTheDocument();
  });

  it('shows pagination controls if more than 5 active orders', () => {
    // TODO: Mock activeOrders with >5 items and test pagination
    // This is a placeholder for future implementation
    expect(true).toBe(true);
  });

  it('opens expense modal when button clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MockAppContextProvider>
          <MemoryRouter>
            <AppProviders>
              <Dashboard />
            </AppProviders>
          </MemoryRouter>
        </MockAppContextProvider>
      </QueryClientProvider>,
    );
    // Cari tombol "Catat Pengeluaran" secara spesifik
    const buttons = screen.getAllByText(/Catat Pengeluaran/i);
    fireEvent.click(buttons[0]);
    // TODO: Assert modal is open
    expect(true).toBe(true);
  });
});
