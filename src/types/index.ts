export enum ServiceCategory {
  Kiloan = 'Kiloan',
  Satuan = 'Satuan',
  Sepatu = 'Sepatu',
  Karpet = 'Karpet',
}

export enum WashType {
  Pakaian = 'Pakaian',
  Sepatu = 'Sepatu',
  Tas = 'Tas',
  Selimut = 'Selimut',
  Boneka = 'Boneka',
  Karpet = 'Karpet',
  Gorden = 'Gorden',
  Lainnya = 'Lainnya',
}

export enum PaymentStatus {
  Paid = 'Lunas',
  Unpaid = 'Belum Lunas',
}

export enum OrderStatus {
  Processing = 'Diproses',
  Ready = 'Siap Diambil',
  Completed = 'Selesai',
}

export enum PaymentMethod {
  Cash = 'Tunai',
  QRIS = 'QRIS',
  Transfer = 'Transfer Bank',
}

export enum UserRole {
  SuperAdmin = 'Super Admin',
  Admin = 'Admin',
  Cashier = 'Kasir',
  /** Petugas cuci/setrika: hanya mengerjakan progres pesanan, tanpa akses uang. */
  Operator = 'Operator',
}

export type AssetStatus = 'Active' | 'Under Maintenance' | 'Decommissioned';

export interface Store {
  id: string;
  name: string;
  address: string;
  /** Nomor HP/WhatsApp cabang, dicetak di header struk. */
  phone?: string | null;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  /** Kode wilayah kelurahan/desa (adm4) untuk prakiraan cuaca BMKG, mis. 32.79.01.1002. */
  bmkgAdm4?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string; // Optional - tidak wajib diisi
  address?: string;
  notes?: string;
  storeId: string;
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  washType: WashType;
  price: number;
  unit: string;
  durationDays: number;
  /** Jumlah minimum per transaksi (mis. 3 kg). 0 / kosong = tanpa minimum. */
  minQuantity?: number;
  /** Tampilkan layanan ini beserta harganya di landing page. Bawaan: true. */
  showOnWeb?: boolean;
  storeId: string;
}

export interface TransactionItemDetail {
  note: string;
}

export interface TransactionItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  price: number;
  subtotal: number;
  unit: string;
  itemDetails?: TransactionItemDetail[];
  taggedItems?: string; // For Kiloan item tagging
}

export interface ExtendedTransactionItem extends TransactionItem {
  length?: number;
  width?: number;
}

export interface Transaction {
  id: string;
  invoiceCode?: string; // UBAH dari invoice_code menjadi invoiceCode (camelCase, sesuai DB)
  customerId: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: Date;
  estimatedCompletionDate: string;
  amountPaid: number;
  change: number;
  paymentMethod?: PaymentMethod;
  createdByUserId: string;
  storeId: string;
  notes?: string;
  idempotencyKey?: string;
  /** Izin PIN supervisor sekali pakai untuk aksi sensitif Kasir (ubah nota lunas, pembatalan). */
  supervisorApprovalId?: string | null;
  /** Kapan struk/notifikasi terakhir dikirim via WhatsApp (ISO). Kosong = belum pernah. */
  whatsappSentAt?: string | null;
  /**
   * Nama pelanggan dari view transactions_operator. Hanya terisi untuk Operator,
   * yang tidak punya akses baca ke tabel customers.
   */
  customerName?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  /** Boleh desimal (mis. 12,5 liter). Bisa minus bila pemakaian melebihi stok tercatat. */
  stock: number;
  lowStockThreshold: number;
  unit: string;
  storeId: string;
  /** Kolom turunan di database: ambang > 0 dan stok ≤ ambang. */
  is_low_stock?: boolean;
}

/** Dasar perhitungan aturan potong stok otomatis. */
export type InventoryRecipeBasis = 'per_unit' | 'per_transaksi';

/**
 * Aturan potong stok otomatis. Dijalankan oleh trigger database setiap nota dibuat:
 * - per_unit: amount × jumlah (kg/pcs/m) baris nota yang cocok
 * - per_transaksi: amount sekali per nota yang memuat layanan yang cocok
 */
export interface InventoryRecipe {
  id: string;
  inventoryItemId: string;
  /** null = berlaku untuk semua layanan */
  serviceId: string | null;
  basis: InventoryRecipeBasis;
  amount: number;
  isActive: boolean;
  storeId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Kapan stok dipotong: saat nota dibuat, saat "Siap Diambil", atau saat "Selesai". */
export type InventoryDeductAt = 'dibuat' | 'siap_diambil' | 'selesai';

/** Bila stok bahan kurang: dibiarkan minus, diberi peringatan, atau nota ditahan. */
export type InventoryStockGuard = 'bebas' | 'peringatan' | 'tahan';

/** Pengaturan potong stok otomatis per cabang (tabel inventory_store_settings). */
export interface InventorySettings {
  storeId: string;
  autoDeductEnabled: boolean;
  deductAt: InventoryDeductAt;
  stockGuard: InventoryStockGuard;
  updatedAt?: Date;
}

/** Bahan yang stoknya tidak cukup untuk sebuah nota. */
export interface StockShortage {
  inventoryItemId: string;
  itemName: string;
  unit: string;
  needed: number;
  available: number;
}

export interface StockOpname {
  id: string;
  inventoryItemId: string;
  inventoryItemName?: string; // for display
  virtualStock: number;
  physicalStock: number;
  discrepancy: number; // virtual - physical (positive = missing)
  notes?: string;
  recordedBy?: string;
  recordedAt: Date;
  storeId: string;
}

export type InventoryMovementKind =
  | 'awal'
  | 'restok'
  | 'penyesuaian'
  | 'opname'
  | 'transaksi'
  | 'koreksi_transaksi';

/** Satu baris buku besar stok. quantity positif = masuk, negatif = keluar. */
export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  inventoryItemName?: string;
  transactionId?: string;
  invoiceCode?: string;
  kind: InventoryMovementKind;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note?: string;
  createdByName?: string;
  createdAt: Date;
  storeId: string;
}

/** Mode penyesuaian stok manual (RPC adjust_inventory_stock). */
export type StockAdjustMode = 'tambah' | 'kurang' | 'set';

export interface MaintenanceLog {
  id: string;
  date: Date;
  description: string;
  cost: number;
}

export interface Asset {
  id: string;
  name: string;
  serialNumber?: string;
  purchaseDate: Date;
  purchaseCost: number;
  status: AssetStatus;
  storeId: string;
  maintenanceHistory: MaintenanceLog[];
}

export interface Expense {
  id: string;
  date: Date;
  description: string;
  category: string;
  amount: number;
  storeId: string;
  recurringTemplateId?: string;
  recurringPeriod?: string;
  /** Diisi bila pengeluaran ini gaji harian otomatis dari absensi. */
  attendanceId?: string;
}

export interface User {
  id: string; // uuid dari Supabase Auth
  name: string;
  role: UserRole;
  storeId?: string;
  createdAt?: Date;
  isActive: boolean;
  /** Diisi bila akun ini adalah login PIN milik karyawan (dipakai untuk absensi otomatis). */
  employeeId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  storeId?: string;
  /** data | aktivitas | navigasi | klik | sesi | error */
  category?: 'data' | 'aktivitas' | 'navigasi' | 'klik' | 'sesi' | 'error';
  /** Untuk kategori data: tabel, id baris, dan INSERT/UPDATE/DELETE */
  tableName?: string;
  recordId?: string;
  operation?: string;
  changedFields?: string[];
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  /** Halaman tempat aksi terjadi (path + query) */
  page?: string;
  metadata?: Record<string, unknown>;
}

export interface Settings {
  id: number;
  receiptMessage: string;
  isMaintenanceMode?: boolean;
  maintenanceMessage?: string;
  whatsappFooter?: string;
  /** Nama usaha di pesan WhatsApp ("Tim <nama>"). Kosong = "Emak Laundry". */
  businessName?: string | null;
  /** Link cek status cucian; nomor invoice ditambahkan sebagai ?invoice=. */
  trackingUrl?: string | null;
  /** Kode QRIS statis toko (EMVCo). Kosong = pembayaran QRIS tanpa QR dinamis. */
  qrisStaticCode?: string | null;
  /** Pop-up pengeluaran bulanan (listrik, air, dll). Default aktif. */
  monthlyExpenseReminderEnabled?: boolean;
  /** Tanggal (1-28) pop-up mulai muncul tiap bulan. Default 1. */
  monthlyExpenseReminderDay?: number;
}

export interface ScheduledMaintenance {
  id: string;
  assetId: string;
  description: string;
  frequencyValue: number;
  frequencyUnit: 'days' | 'weeks' | 'months' | 'years';
  nextDueDate: Date;
  lastCompletedDate: Date | null;
  estimatedCost?: number;
}
