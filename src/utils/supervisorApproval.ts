import { supabase } from './supabaseClient';

/** Aksi Kasir yang wajib disetujui PIN supervisor (Admin cabang / Super Admin). */
export type SupervisorAction = 'manual_discount' | 'edit_paid' | 'cancel_transaction';

export const SUPERVISOR_ACTION_LABELS: Record<SupervisorAction, string> = {
  manual_discount: 'Diskon manual',
  edit_paid: 'Ubah pembayaran nota lunas',
  cancel_transaction: 'Batalkan transaksi',
};

export type SupervisorApprovalResult =
  | { ok: true; approvalId: string; approverName: string }
  | { ok: false; remainingAttempts: number };

/**
 * Meminta izin sekali pakai (berlaku 2 menit) dengan PIN supervisor.
 * PIN salah mengembalikan `ok: false`; PIN terkunci/invalid melempar Error.
 */
export async function requestSupervisorApproval(
  action: SupervisorAction,
  pin: string,
  options: { maxAmount?: number; transactionId?: string } = {},
): Promise<SupervisorApprovalResult> {
  const { data, error } = await supabase.rpc('request_supervisor_approval', {
    p_action: action,
    p_pin: pin,
    p_max_amount: options.maxAmount,
    p_transaction_id: options.transactionId,
  });
  if (error) throw new Error(error.message);

  const result = (data ?? {}) as {
    approval_id?: string | null;
    approver_name?: string | null;
    remaining_attempts?: number;
  };
  if (result.approval_id) {
    return { ok: true, approvalId: result.approval_id, approverName: result.approver_name ?? '' };
  }
  return { ok: false, remainingAttempts: result.remaining_attempts ?? 0 };
}

export async function hasMySupervisorPin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_my_supervisor_pin');
  if (error) throw new Error(error.message);
  return data === true;
}

export async function setMySupervisorPin(pin: string): Promise<void> {
  const { error } = await supabase.rpc('set_my_supervisor_pin', { p_pin: pin });
  if (error) throw new Error(error.message);
}

/** Diskon otomatis dari Pengaturan (Rp) yang boleh dipakai Kasir tanpa PIN. */
export function autoDiscountAmount(subtotal: number, discountRate: number | undefined): number {
  return Math.round(subtotal * ((discountRate ?? 0) / 100));
}

/** Sama dengan aturan di trigger database (toleransi Rp1 untuk pembulatan). */
export function needsManualDiscountApproval(
  manualDiscount: number,
  subtotal: number,
  discountRate: number | undefined,
): boolean {
  return manualDiscount > autoDiscountAmount(subtotal, discountRate) + 1;
}

export const isValidPinFormat = (pin: string) => /^[0-9]{6}$/.test(pin);
