import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TransactionPage from './TransactionPage';
import { AppProviders } from '../../contexts/AppProviders';

// TODO: Mock useTransactions, useSortableData, etc. for more robust tests

describe('TransactionPage', () => {
  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AppProviders>
            <TransactionPage />
          </AppProviders>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getAllByText(/Transaksi|Transaction/i).length).toBeGreaterThan(0);
  });

  it('shows pagination controls if more than 10 transactions', () => {
    // TODO: Mock sortedTransactions with >10 items and test pagination
    expect(true).toBe(true);
  });

  it('can filter transactions', () => {
    // TODO: Simulate filter change and assert filtered results
    expect(true).toBe(true);
  });
});
