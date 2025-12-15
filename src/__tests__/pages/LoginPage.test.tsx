import { render } from '@testing-library/react';
import LoginPage from '@/pages/LoginPage';
import { AppProvider } from '@/contexts/AppContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppProvider>{children}</AppProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('LoginPage', () => {
  it('renders without crashing', () => {
    render(<LoginPage />, { wrapper: Wrapper });
  });
});
