import { describe, it, expect } from 'vitest';
import { getLaundryStatus, getPublicServices } from '@/utils/supabaseClient';

// NOTE: Test ini akan benar-benar memanggil Supabase. Pastikan env sudah benar.
describe('supabaseClient (real API)', () => {
  it('should throw error for invalid transactionId', async () => {
    await expect(getLaundryStatus('invalid-id')).rejects.toThrow();
  });

  it('should throw error for invalid storeId', async () => {
    await expect(getPublicServices('invalid-id')).rejects.toThrow();
  });

  // Untuk test sukses, masukkan ID yang valid di bawah ini jika ingin benar-benar test ke database:
  // it('should return data for valid transactionId', async () => {
  //   const data = await getLaundryStatus('VALID_TRANSACTION_ID');
  //   expect(data).toBeDefined();
  // });
});
