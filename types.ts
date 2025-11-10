
export enum ServiceCategory {
  Kiloan = 'Kiloan',
  Satuan = 'Satuan',
  Sepatu = 'Sepatu',
  Karpet = 'Karpet',
}

export enum PaymentStatus {
  Paid = 'Lunas',
  Unpaid = 'Belum Lunas',
  PartiallyPaid = 'Bayar Sebagian',
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
  BranchAdmin = 'Admin Cabang',
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
  phone: string;
  address?: string;
  notes?: string;
  storeId: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  unit: string;
  durationDays: number;
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
}

export interface Transaction {
  id: string;
  customerId: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: Date;
  estimatedCompletionDate: Date;
  amountPaid: number;
  change: number;
  paymentMethod?: PaymentMethod;
  createdByUserId: number;
  storeId: string;
  notes?: string;
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
  id: number;
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
  id: number;
  date: Date;
  description: string;
  category: string;
  amount: number;
  storeId: string;
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
  isActive: boolean;
  storeId?: string;
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  user: string;
  action: string;
}

export interface Settings {
  receiptMessage: string;
  taxRate: number;
  discountRate: number;
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