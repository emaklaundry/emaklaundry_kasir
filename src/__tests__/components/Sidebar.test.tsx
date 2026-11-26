import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

const mockUser = vi.hoisted(() => ({ role: 'Admin' }));
vi.mock('@/contexts/useAppContext', () => ({
  default: () => ({ currentUser: { role: mockUser.role } }),
}));

const renderSidebar = (isOpen = true) =>
  render(
    <MemoryRouter>
      <Sidebar isOpen={isOpen} onToggle={vi.fn()} />
    </MemoryRouter>,
  );

const linksIn = (section: string) =>
  within(screen.getByRole('list', { name: section }))
    .getAllByRole('link')
    .map((l) => l.textContent);

describe('Sidebar', () => {
  beforeEach(() => {
    mockUser.role = 'Admin';
  });

  it('removes a closed sidebar from keyboard and assistive-technology navigation', () => {
    renderSidebar(false);
    const sidebar = document.getElementById('logo-sidebar');
    expect(sidebar).not.toBeNull();
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    expect(sidebar).toHaveProperty('inert', true);
  });

  it('Admin: enam kelompok menu dengan urutan tetap', () => {
    renderSidebar();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Operasional Utama',
      'Layanan & Pelanggan',
      'SDM & Aset',
      'Laporan & Analisis',
      'Sistem & Keamanan',
      'Bantuan & Panduan',
    ]);
    expect(linksIn('Layanan & Pelanggan')).toEqual([
      'Pelanggan',
      'Layanan',
      'Inventaris',
      'Pengeluaran',
    ]);
    expect(linksIn('SDM & Aset')).toEqual(['Karyawan', 'Absensi', 'Aset & Pemeliharaan']);
    expect(linksIn('Laporan & Analisis')).toEqual(['Laporan', 'Pusat Bisnis']);
    expect(linksIn('Sistem & Keamanan')).toEqual(['Pengaturan', 'Log Audit', 'Backup & Restore']);
    expect(linksIn('Bantuan & Panduan')).toEqual(['SOP (Prosedur)', 'Bantuan / Tutorial']);
    // Cabang & Akun Login (email) khusus Super Admin
    expect(screen.queryByRole('link', { name: 'Cabang' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Akun Login' })).toBeNull();
  });

  it('Operator: hanya menu operasional & bantuan', () => {
    mockUser.role = 'Operator';
    renderSidebar();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Operasional Utama', 'Bantuan & Panduan']);
    expect(linksIn('Operasional Utama')).toEqual(['Dashboard', 'Transaksi']);
    expect(linksIn('Bantuan & Panduan')).toEqual(['Bantuan / Tutorial']);
    expect(screen.queryByRole('link', { name: 'Pelanggan' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Karyawan' })).toBeNull();
  });

  it('Kasir: menu operasional, Pelanggan & bantuan', () => {
    mockUser.role = 'Kasir';
    renderSidebar();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Operasional Utama', 'Layanan & Pelanggan', 'Bantuan & Panduan']);
    expect(linksIn('Operasional Utama')).toEqual(['Dashboard', 'Transaksi']);
    expect(linksIn('Layanan & Pelanggan')).toEqual(['Pelanggan']);
    expect(linksIn('Bantuan & Panduan')).toEqual(['Bantuan / Tutorial']);
    expect(screen.queryByRole('link', { name: 'Karyawan' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Pusat Bisnis' })).toBeNull();
  });

  it('Super Admin melihat menu Cabang', () => {
    mockUser.role = 'Super Admin';
    renderSidebar();
    expect(linksIn('Sistem & Keamanan')[0]).toBe('Cabang');
  });
});
