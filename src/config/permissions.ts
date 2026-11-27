import { UserRole } from '../types';
import type { EmployeeRole } from '../types/hrm';

/**
 * Hak akses per peran — satu sumber kebenaran untuk menu, rute, dan tombol.
 *
 * Perbedaan istilah:
 * - **Akun Login** (menu "Akun Login", tabel `profiles`): siapa yang bisa masuk ke
 *   aplikasi dan peran apa yang ia pegang. Peran inilah yang menentukan hak akses.
 *   Login email & password hanya untuk Super Admin; peran lain login lewat PIN
 *   karyawan (profil dengan `employee_id`).
 * - **Karyawan** (menu "Karyawan", tabel `employees`): data SDM — gaji, jadwal,
 *   absensi. Karyawan tidak otomatis bisa login. Admin dapat memberi PIN login;
 *   peran akunnya mengikuti posisi karyawan (operator → Operator, dst).
 *
 * Pemeriksaan di sini hanya mengatur tampilan. Batas sebenarnya dijaga database
 * (RLS & trigger, lihat SECTION 14 di supabase/setup/0.complete_setup.sql).
 */
export type Permission =
  /** Membuat nota/transaksi baru. */
  | 'transaction.create'
  /** Menerima & mencatat pembayaran, sekaligus melihat nominal nota (harga, total, bayar). */
  | 'transaction.payment'
  /** Mengirim struk/notifikasi WhatsApp ke pelanggan (butuh nomor HP & nominal nota). */
  | 'transaction.notify'
  /** Mengubah progres pesanan (Diproses → Siap Diambil). */
  | 'transaction.updateStatus'
  /** Menandai pesanan Selesai (serah terima ke pelanggan, harus sudah Lunas). */
  | 'transaction.complete'
  /** Update stok cepat dari Aksi Cepat. */
  | 'inventory.quickUpdate'
  /** Lapor kerusakan mesin/aset. */
  | 'maintenance.report'
  /** Membuka halaman Pelanggan, menambah & mengubah data pelanggan (tanpa hapus/import/export). */
  | 'customer.edit'
  /** Mencatat pengeluaran harian dari Aksi Cepat. */
  | 'expense.create'
  /** Pengingat & isian pengeluaran bulanan (listrik, air, sewa, dll). */
  | 'expense.monthly'
  /** Melihat angka keuangan: omzet, piutang, laba. */
  | 'finance.view'
  /** Menu manajemen cabang: pelanggan, layanan, inventaris, karyawan, laporan, dll. */
  | 'branch.manage'
  /** Panduan & Kalkulator Bisnis. */
  | 'business.hub'
  /** Mengelola banyak cabang, mode maintenance, data lintas cabang. */
  | 'system.manage';

const OPERATOR: Permission[] = [
  'transaction.updateStatus',
  'inventory.quickUpdate',
  'maintenance.report',
];

const CASHIER: Permission[] = [
  ...OPERATOR,
  'transaction.create',
  'transaction.payment',
  'transaction.complete',
  'transaction.notify',
  'customer.edit',
  'expense.create',
];

const ADMIN: Permission[] = [
  ...CASHIER,
  'expense.monthly',
  'finance.view',
  'branch.manage',
  'business.hub',
];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [UserRole.Operator]: OPERATOR,
  [UserRole.Cashier]: CASHIER,
  [UserRole.Admin]: ADMIN,
  [UserRole.SuperAdmin]: [...ADMIN, 'system.manage'],
};

export function can(role: UserRole | string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role as UserRole];
  return permissions ? permissions.includes(permission) : false;
}

export const isAdminRole = (role: UserRole | string | undefined | null): boolean =>
  role === UserRole.Admin || role === UserRole.SuperAdmin;

/**
 * Peran akun login PIN mengikuti posisi karyawan.
 * Harus sama dengan pemetaan di supabase/functions/manage-employee-login.
 */
export const EMPLOYEE_TO_USER_ROLE: Record<EmployeeRole, UserRole> = {
  operator: UserRole.Operator,
  kasir: UserRole.Cashier,
  admin: UserRole.Admin,
};

/** Urutan dari akses paling sedikit ke paling luas — dipakai di form & tabel. */
export const ROLE_ORDER: UserRole[] = [
  UserRole.Operator,
  UserRole.Cashier,
  UserRole.Admin,
  UserRole.SuperAdmin,
];

export const ROLE_DESCRIPTIONS: Record<UserRole, { summary: string; can: string[] }> = {
  [UserRole.Operator]: {
    summary: 'Petugas cuci/setrika. Fokus mengerjakan pesanan, tanpa akses uang.',
    can: [
      'Lihat pesanan aktif cabangnya (+ yang selesai 7 hari terakhir), tanpa harga & nominal',
      'Ubah progres pesanan (Diproses → Siap Diambil)',
      'Update stok & lapor kerusakan mesin',
    ],
  },
  [UserRole.Cashier]: {
    summary: 'Melayani pelanggan di meja kasir.',
    can: [
      'Semua hak Operator',
      'Buat transaksi baru & terima pembayaran',
      'Kirim struk & kabar pesanan via WhatsApp',
      'Tandai pesanan Selesai saat diserahkan ke pelanggan',
      'Tambah & ubah data pelanggan (nama, nomor HP, alamat, catatan)',
      'Catat pengeluaran kecil harian',
    ],
  },
  [UserRole.Admin]: {
    summary: 'Pengelola satu cabang.',
    can: [
      'Semua hak Kasir',
      'Kelola pelanggan, layanan, inventaris, aset, karyawan & absensi',
      'Pengeluaran bulanan (listrik, air, sewa) & laporan keuangan',
      'Pusat Bisnis: panduan & kalkulator',
      'Beri PIN login untuk karyawan di cabangnya',
    ],
  },
  [UserRole.SuperAdmin]: {
    summary: 'Pemilik usaha. Akses penuh ke semua cabang.',
    can: [
      'Semua hak Admin untuk semua cabang',
      'Tambah/ubah cabang',
      'Mode maintenance & pengaturan sistem',
      'Satu-satunya peran yang login dengan email & password',
    ],
  },
};
