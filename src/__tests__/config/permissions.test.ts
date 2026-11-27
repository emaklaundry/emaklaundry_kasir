import { describe, it, expect } from 'vitest';
import { can, isAdminRole, EMPLOYEE_TO_USER_ROLE } from '@/config/permissions';
import { UserRole } from '@/types';

describe('permissions', () => {
  it('Operator mengerjakan pesanan tanpa akses uang', () => {
    expect(can(UserRole.Operator, 'transaction.updateStatus')).toBe(true);
    expect(can(UserRole.Operator, 'transaction.create')).toBe(false);
    expect(can(UserRole.Operator, 'transaction.payment')).toBe(false);
    expect(can(UserRole.Operator, 'expense.create')).toBe(false);
    // Struk WhatsApp memuat nominal & nomor HP pelanggan.
    expect(can(UserRole.Operator, 'transaction.notify')).toBe(false);
    expect(can(UserRole.Operator, 'customer.edit')).toBe(false);
  });

  it('Kasir ke atas yang mengirim struk/kabar WhatsApp', () => {
    expect(can(UserRole.Cashier, 'transaction.notify')).toBe(true);
    expect(can(UserRole.Admin, 'transaction.notify')).toBe(true);
    expect(can(UserRole.SuperAdmin, 'transaction.notify')).toBe(true);
  });

  it('hanya Kasir ke atas yang menandai pesanan Selesai (serah terima)', () => {
    expect(can(UserRole.Operator, 'transaction.complete')).toBe(false);
    expect(can(UserRole.Cashier, 'transaction.complete')).toBe(true);
    expect(can(UserRole.Admin, 'transaction.complete')).toBe(true);
    expect(can(UserRole.SuperAdmin, 'transaction.complete')).toBe(true);
  });

  it('Kasir bertransaksi, tapi tidak melihat keuangan & pengeluaran bulanan', () => {
    expect(can(UserRole.Cashier, 'transaction.create')).toBe(true);
    expect(can(UserRole.Cashier, 'transaction.payment')).toBe(true);
    expect(can(UserRole.Cashier, 'finance.view')).toBe(false);
    expect(can(UserRole.Cashier, 'expense.monthly')).toBe(false);
    expect(can(UserRole.Cashier, 'business.hub')).toBe(false);
  });

  it('Admin mengelola cabang; hanya Super Admin yang mengelola sistem', () => {
    expect(can(UserRole.Admin, 'expense.monthly')).toBe(true);
    expect(can(UserRole.Admin, 'business.hub')).toBe(true);
    expect(can(UserRole.Admin, 'system.manage')).toBe(false);
    expect(can(UserRole.SuperAdmin, 'system.manage')).toBe(true);
  });

  it('peran tak dikenal tidak punya hak apa pun', () => {
    expect(can(undefined, 'transaction.updateStatus')).toBe(false);
    expect(can('Tamu', 'transaction.updateStatus')).toBe(false);
    expect(isAdminRole(UserRole.Operator)).toBe(false);
  });

  it('akun PIN karyawan mengikuti posisinya', () => {
    expect(EMPLOYEE_TO_USER_ROLE.operator).toBe(UserRole.Operator);
    expect(EMPLOYEE_TO_USER_ROLE.kasir).toBe(UserRole.Cashier);
    expect(EMPLOYEE_TO_USER_ROLE.admin).toBe(UserRole.Admin);
  });
});
