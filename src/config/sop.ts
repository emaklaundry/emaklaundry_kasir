import { UserRole } from '../types';

/**
 * Kategori SOP yang dibaca tiap peran (pop up wajib baca & halaman SOP).
 * Peran yang tidak tercantum (Admin, Super Admin) melihat semua kategori.
 */
export const SOP_CATEGORIES_BY_ROLE: Partial<Record<UserRole, string[]>> = {
  [UserRole.Cashier]: ['Umum', 'Kasir'],
  [UserRole.Operator]: ['Umum', 'Operator', 'Produksi'],
};

export function getSopCategoriesForRole(role: UserRole | undefined): string[] | undefined {
  return role ? SOP_CATEGORIES_BY_ROLE[role] : undefined;
}
