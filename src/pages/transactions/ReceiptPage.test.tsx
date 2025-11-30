
import { render } from '@testing-library/react';
import ReceiptPage from './ReceiptPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../contexts/AppProviders';

const queryClient = new QueryClient();

describe('ReceiptPage', () => {
  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AppProviders>
            <ReceiptPage />
          </AppProviders>
        </MemoryRouter>
      </QueryClientProvider>
    );
  });
});
