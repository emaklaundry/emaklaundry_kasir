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
  HelpCircleIcon,
  ArrowTrendingUpIcon,
  FileTextIcon,
} from '../components/icons';
import { UserRole } from '../types';
import { Permission, can, isAdminRole } from './permissions';

export interface NavItem {
  path: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  adminOnly?: boolean;
  /** Tampil bila peran punya hak ini (mengganti `adminOnly`). */
  permission?: Permission;
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
      {
        path: '/management/customers',
        label: 'Pelanggan',
        icon: UsersIcon,
        permission: 'customer.edit',
      },
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
      {
        path: '/business',
        label: 'Pusat Bisnis',
        icon: ArrowTrendingUpIcon,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'Sistem & Keamanan',
    items: [
      { path: '/management/stores', label: 'Cabang', icon: TruckIcon, superAdminOnly: true },
      { path: '/management/users', label: 'Akun Login', icon: UsersIcon, superAdminOnly: true },
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
      { path: '/help', label: 'Bantuan / Tutorial', icon: HelpCircleIcon },
    ],
  },
];

/**
 * Kasir & Operator hanya melihat menu tanpa `adminOnly`; `superAdminOnly` khusus Super Admin.
 * Rincian hak per peran ada di `config/permissions.ts`.
 */
export function canSeeNavItem(item: NavItem, role: UserRole | string | undefined): boolean {
  if (item.superAdminOnly) return role === UserRole.SuperAdmin;
  if (item.permission) return can(role, item.permission);
  if (item.adminOnly) return isAdminRole(role);
  return true;
}
