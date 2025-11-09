
export enum UserRole {
  Admin = 'Admin',
  Cashier = 'Cashier',
}

export enum OrderStatus {
  Processing = 'Processing',
  Ready = 'Ready',
  Completed = 'Completed',
}

export enum PaymentStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
}

export enum ServiceCategory {
    Kiloan = 'Kiloan',
    Satuan = 'Satuan',
    Sepatu = 'Sepatu',
    Karpet = 'Karpet',
    Lainnya = 'Lainnya',
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  unit: string; // e.g., 'kg', 'pcs'
  durationDays: number;
}

export interface TransactionItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  price: number;
  subtotal: number;
  unit: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  items: TransactionItem[];
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: Date;
  estimatedCompletionDate: Date;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  unit: string; // e.g., 'liter', 'kg', 'pcs'
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
  status: 'Active' | 'Under Maintenance' | 'Decommissioned';
  maintenanceHistory: MaintenanceLog[];
}

export interface Expense {
  id: number;
  date: Date;
  description: string;
  category: string;
  amount: number;
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  user: string;
  action: string;
}

export interface Settings {
    receiptMessage: string;
}