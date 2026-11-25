import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNavBar from '@/components/layout/BottomNavBar';

vi.mock('@/contexts/useAppContext', () => ({
  default: () => ({ currentUser: { role: 'Kasir' } }),
}));

describe('BottomNavBar', () => {
  it('exposes the mobile links as a named navigation landmark', () => {
    render(
      <MemoryRouter>
        <BottomNavBar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });
});
