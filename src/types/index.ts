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
}

export type AssetStatus = 'Active' | 'Under Maintenance' | 'Decommissioned';

export interface Store {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string; // Optional - tidak wajib diisi
  address?: string;
  notes?: string;
  storeId: string;
  defaultDiscount?: number;
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
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  unit: string;
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
}

export interface User {
  id: string; // uuid dari Supabase Auth
  name: string;
  role: UserRole;
  storeId?: string;
  createdAt?: Date;
  isActive: boolean;
  canGiveDiscount: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  storeId?: string;
}

export interface Settings {
  id: number;
  receiptMessage: string;
  taxRate: number;
  discountRate: number;
  isMaintenanceMode?: boolean;
  maintenanceMessage?: string;
  whatsappFooter?: string;
}

export interface ScheduledMaintenance {
  id: string;
  assetId: string;
  description: string;
  frequencyValue: number;
  frequencyUnit: 'days' | 'weeks' | 'months' | 'years';
  nextDueDate: Date;
  lastCompletedDate: Date | null;
}
