import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const mocks = vi.hoisted(() => ({
  fetchCustomers: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/contexts/CustomerContext', () => ({
  fetchCustomers: mocks.fetchCustomers,
}));

vi.mock('@/components/features/Tutorial', () => ({ default: () => null }));
vi.mock('@/components/ToastContainer', () => ({ default: () => null }));
vi.mock('@/components/layout/Header', () => ({ default: () => null }));
vi.mock('@/components/layout/Sidebar', () => ({ default: () => null }));
vi.mock('@/components/layout/BottomNavBar', () => ({ default: () => null }));

describe('Layout', () => {
  it('provides a skip link to the focusable main content', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Layout>
            <h1>Dashboard</h1>
          </Layout>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Lewati ke konten utama' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });
});
