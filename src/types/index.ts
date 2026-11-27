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
  phone?: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
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
  stock: number;
  virtualStock?: number; // auto-deducted stock for recipe tracking
  lowStockThreshold: number;
  unit: string;
  storeId: string;
  recipe?: InventoryRecipe;
}

export interface InventoryRecipe {
  id: string;
  inventoryItemId: string;
  usagePerKg: number; // ml/pcs per kg cucian
  storeId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StockOpname {
  id: string;
  inventoryItemId: string;
  inventoryItemName?: string; // for display
  virtualStock: number;
  physicalStock: number;
  discrepancy: number; // virtual - physical (positive = missing)
  notes?: string;
  recordedBy: string;
  recordedAt: Date;
  storeId: string;
}

export interface InventoryUsageLog {
  id: string;
  inventoryItemId: string;
  inventoryItemName?: string;
  transactionId?: string;
  quantityUsed: number;
  totalKg: number;
  usagePerKg: number;
  createdAt: Date;
  storeId: string;
}

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
