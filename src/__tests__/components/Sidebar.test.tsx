import { render, screen, within } from '@testing-library/react';
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

  it('groups admin pages under labelled sections in a fixed order', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen onToggle={vi.fn()} />
      </MemoryRouter>,
    );

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Data Master',
      'Operasional',
      'SDM',
      'Analisis',
      'Sistem',
      'Panduan',
    ]);

    const sdm = screen.getByRole('list', { name: 'SDM' });
    expect(
      within(sdm)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Karyawan', 'Absensi']);
  });

  it('hides super-admin-only pages from Admin', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen onToggle={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Cabang' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Pengaturan' })).toBeInTheDocument();
  });
});
