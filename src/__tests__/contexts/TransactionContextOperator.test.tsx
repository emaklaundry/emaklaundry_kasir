import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useTransactions,
  transactionSource,
  OPERATOR_TRANSACTIONS_VIEW,
} from '@/contexts/TransactionContext';
import AppContext from '@/contexts/AppContextContext';
import type { AppContextType } from '@/contexts/AppContext';
import { UserRole } from '@/types';

const { rpc, updateTransactionProgress, from } = vi.hoisted(() => ({
  rpc: vi.fn(),
  updateTransactionProgress: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/utils/supabaseClient', () => ({
  supabase: { rpc, from },
  updateTransactionProgress,
}));

vi.mock('@tanstack/react-query', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    useQuery: vi.fn().mockReturnValue({ data: { data: [], count: 0 }, isLoading: false }),
    // onSuccess (verifikasi ke server) sengaja tidak dijalankan di sini.
    useMutation: vi.fn().mockImplementation(({ mutationFn }) => ({
      mutateAsync: (...args: unknown[]) => mutationFn(...args),
    })),
  };
});

const wrapperFor = (role: UserRole) => {
  const value = { currentUser: { role } } as unknown as AppContextType;
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
  return Wrapper;
};

describe('transaksi untuk Operator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Operator membaca view tanpa nominal, peran lain membaca tabel transactions', () => {
    expect(transactionSource(UserRole.Operator)).toBe(OPERATOR_TRANSACTIONS_VIEW);
    expect(transactionSource(UserRole.Cashier)).toBe('transactions');
    expect(transactionSource(UserRole.Admin)).toBe('transactions');
    expect(transactionSource(undefined)).toBe('transactions');
  });

  it('Operator menyimpan progres lewat RPC operator_update_transaction', async () => {
    rpc.mockResolvedValue({
      data: [{ id: 't1', orderStatus: 'Siap Diambil', customerName: 'Budi', total: null }],
      error: null,
    });
    const { result } = renderHook(() => useTransactions({ enabled: false }), {
      wrapper: wrapperFor(UserRole.Operator),
    });

    const updated = await result.current.updateTransaction('t1', {
      orderStatus: 'Siap Diambil' as never,
    });

    expect(rpc).toHaveBeenCalledWith('operator_update_transaction', {
      p_transaction_id: 't1',
      p_patch: { orderStatus: 'Siap Diambil' },
    });
    expect(updateTransactionProgress).not.toHaveBeenCalled();
    expect(updated?.customerName).toBe('Budi');
  });

  it('Operator tidak bisa mengubah kolom pembayaran', async () => {
    const { result } = renderHook(() => useTransactions({ enabled: false }), {
      wrapper: wrapperFor(UserRole.Operator),
    });

    await expect(result.current.updateTransaction('t1', { amountPaid: 1000 })).rejects.toThrow(
      /Operator hanya dapat mengubah/,
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it('Kasir tetap memakai update_transaction_progress', async () => {
    updateTransactionProgress.mockResolvedValue([{ id: 't1', orderStatus: 'Siap Diambil' }]);
    const { result } = renderHook(() => useTransactions({ enabled: false }), {
      wrapper: wrapperFor(UserRole.Cashier),
    });

    await result.current.updateTransaction('t1', { orderStatus: 'Siap Diambil' as never });

    expect(updateTransactionProgress).toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});
