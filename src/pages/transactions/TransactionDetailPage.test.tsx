import { render } from '@testing-library/react';
import TransactionDetailPage from './TransactionDetailPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../contexts/AppProviders';

const queryClient = new QueryClient();

describe('TransactionDetailPage', () => {
  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AppProviders>
            <TransactionDetailPage />
          </AppProviders>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
});
