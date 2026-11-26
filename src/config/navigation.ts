import React from 'react';
import {
  HomeIcon,
  ShoppingCartIcon,
  PackageIcon,
  UsersIcon,
  BarChartIcon,
  SettingsIcon,
  WrenchIcon,
  DollarSignIcon,
  HistoryIcon,
  TruckIcon,
  DatabaseIcon,
  BookOpenIcon,
  HelpCircleIcon,
  ArrowTrendingUpIcon,
  CalculatorIcon,
  FileTextIcon,
} from '../components/icons';
import { UserRole } from '../types';

export interface NavItem {
  path: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// Urutan mengikuti alur kerja: operasional harian -> data & stok -> SDM & aset ->
// laporan -> sistem -> bantuan. Halaman Bantuan memakai urutan kelompok yang sama.
export const navSections: NavSection[] = [
  {
    title: 'Operasional Utama',
    items: [
      { path: '/', label: 'Dashboard', icon: HomeIcon },
      { path: '/transactions', label: 'Transaksi', icon: ShoppingCartIcon },
    ],
  },
  {
    title: 'Layanan & Pelanggan',
    items: [
      { path: '/management/customers', label: 'Pelanggan', icon: UsersIcon, adminOnly: true },
      { path: '/management/services', label: 'Layanan', icon: PackageIcon, adminOnly: true },
      { path: '/management/inventory', label: 'Inventaris', icon: PackageIcon, adminOnly: true },
      {
        path: '/management/expenses',
        label: 'Pengeluaran',
        icon: DollarSignIcon,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'SDM & Aset',
    items: [
      { path: '/management/employees', label: 'Karyawan', icon: UsersIcon, adminOnly: true },
      { path: '/management/attendance', label: 'Absensi', icon: HistoryIcon, adminOnly: true },
      {
        path: '/management/assets',
        label: 'Aset & Pemeliharaan',
        icon: WrenchIcon,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'Laporan & Analisis',
    items: [
      { path: '/reports', label: 'Laporan', icon: BarChartIcon, adminOnly: true },
      { path: '/business/calculator', label: 'Kalkulator Bisnis', icon: CalculatorIcon },
    ],
  },
  {
    title: 'Sistem & Keamanan',
    items: [
      { path: '/management/stores', label: 'Cabang', icon: TruckIcon, superAdminOnly: true },
      { path: '/management/users', label: 'Pengguna', icon: UsersIcon, adminOnly: true },
      { path: '/settings', label: 'Pengaturan', icon: SettingsIcon, adminOnly: true },
      { path: '/audit-log', label: 'Log Audit', icon: HistoryIcon, adminOnly: true },
      {
        path: '/management/backup',
        label: 'Backup & Restore',
        icon: DatabaseIcon,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'Bantuan & Panduan',
    items: [
      { path: '/management/sop', label: 'SOP (Prosedur)', icon: FileTextIcon, adminOnly: true },
      { path: '/business-guide', label: 'Panduan Bisnis', icon: ArrowTrendingUpIcon },
      { path: '/docs', label: 'Dokumentasi', icon: BookOpenIcon },
      { path: '/help', label: 'Bantuan / Tutorial', icon: HelpCircleIcon },
    ],
  },
];

/** Kasir hanya melihat menu tanpa `adminOnly`; `superAdminOnly` khusus Super Admin. */
export function canSeeNavItem(item: NavItem, role: UserRole | string | undefined): boolean {
  const isSuperAdmin = role === UserRole.SuperAdmin;
  const isAdmin = isSuperAdmin || role === UserRole.Admin;
  if (item.superAdminOnly) return isSuperAdmin;
  if (item.adminOnly) return isAdmin;
  return true;
}
