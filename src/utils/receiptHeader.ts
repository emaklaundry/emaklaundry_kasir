import type { Settings, Store } from '../types';
import { DEFAULT_BUSINESS_NAME } from './whatsappReceipt';

export interface ReceiptHeader {
  /** Nama usaha (judul besar struk). */
  title: string;
  /** Baris kecil di bawah judul: nama cabang, alamat, nomor HP. Kosong dilewati. */
  details: string[];
}

/** Header struk dari Pengaturan (nama usaha) dan data cabang transaksi. */
export function buildReceiptHeader(
  settings: Pick<Settings, 'businessName'> | null | undefined,
  store: Pick<Store, 'name' | 'address' | 'phone'> | null | undefined,
): ReceiptHeader {
  const title = settings?.businessName?.trim() || DEFAULT_BUSINESS_NAME;
  const storeName = store?.name?.trim();
  const details = [
    // Nama cabang tidak diulang bila sama persis dengan nama usaha.
    storeName && storeName.toLowerCase() !== title.toLowerCase() ? storeName : '',
    store?.address?.trim() ?? '',
    store?.phone?.trim() ? `Telp/WA ${store.phone.trim()}` : '',
  ].filter(Boolean);
  return { title, details };
}
