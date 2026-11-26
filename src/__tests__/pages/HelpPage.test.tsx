import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HelpPage from '@/pages/HelpPage';
import { HELP_TOPICS } from '@/config/helpTopics';
import { navSections } from '@/config/navigation';

const mockUser = vi.hoisted(() => ({ role: 'Admin' }));
vi.mock('@/contexts/useAppContext', () => ({
  default: () => ({ currentUser: { role: mockUser.role } }),
}));
const startTour = vi.fn();
vi.mock('@/hooks/useTutorial', () => ({ useTutorial: () => ({ startTour }) }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <HelpPage />
    </MemoryRouter>,
  );

const sectionHeadings = () =>
  screen
    .getAllByRole('heading', { level: 2 })
    .map((h) => h.textContent)
    .filter((t) => t !== 'Tur interaktif');

describe('HelpPage', () => {
  beforeEach(() => {
    mockUser.role = 'Admin';
  });

  it('setiap topik memakai kelompok menu yang ada', () => {
    const titles = navSections.map((s) => s.title);
    for (const topic of HELP_TOPICS) expect(titles).toContain(topic.section);
  });

  it('tidak lagi membahas saldo diskon, pajak, atau diskon', () => {
    const text = JSON.stringify(HELP_TOPICS).toLowerCase();
    expect(text).not.toMatch(/saldo diskon|pajak \(%\)|diskon \(%\)/);
  });

  it('Admin: kelompok tampil berurutan sama seperti sidebar', () => {
    renderPage();
    expect(sectionHeadings()).toEqual(navSections.map((s) => s.title));
    expect(screen.getByText('Mengelola karyawan')).toBeInTheDocument();
  });

  it('Kasir: topik khusus Admin disembunyikan', () => {
    mockUser.role = 'Kasir';
    renderPage();
    expect(screen.queryByText('Mengelola karyawan')).not.toBeInTheDocument();
    expect(screen.queryByText('PIN Supervisor')).not.toBeInTheDocument();
    expect(screen.getByText('Membuat transaksi baru')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tur Karyawan' })).not.toBeInTheDocument();
  });

  it('pencarian menyaring topik dan menampilkan pesan bila kosong', () => {
    renderPage();
    const search = screen.getByLabelText('Cari topik bantuan');
    fireEvent.change(search, { target: { value: 'qris' } });
    expect(screen.getByText('Menerima pembayaran')).toBeInTheDocument();
    expect(screen.queryByText('Mengelola karyawan')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'zzzz-tidak-ada' } });
    expect(screen.getByText(/Tidak ada topik/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan semua topik' }));
    expect(screen.getByText('Mengelola karyawan')).toBeInTheDocument();
  });

  it('tab kategori hanya menampilkan kelompok itu', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'SDM & Aset' }));
    expect(sectionHeadings()).toEqual(['SDM & Aset']);
  });
});
