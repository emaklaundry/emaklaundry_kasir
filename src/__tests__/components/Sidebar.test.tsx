import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

vi.mock('@/contexts/useAppContext', () => ({
  default: () => ({ currentUser: { role: 'Admin' } }),
}));

vi.mock('@/hooks/useTutorial', () => ({
  useTutorial: () => ({ startTour: vi.fn() }),
}));

describe('Sidebar', () => {
  it('removes a closed sidebar from keyboard and assistive-technology navigation', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={false} onToggle={vi.fn()} />
      </MemoryRouter>,
    );

    const sidebar = document.getElementById('logo-sidebar');
    expect(sidebar).not.toBeNull();
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    expect(sidebar).toHaveProperty('inert', true);
  });

  it('exposes and updates the expanded state of the management menu', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen onToggle={vi.fn()} />
      </MemoryRouter>,
    );

    const managementButton = screen.getByRole('button', { name: 'Manajemen' });
    expect(managementButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(managementButton);

    expect(managementButton).toHaveAttribute('aria-expanded', 'false');
  });
});
