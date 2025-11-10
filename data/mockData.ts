
import {
  Customer,
  Service,
  ServiceCategory,
  Transaction,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  InventoryItem,
  Asset,
  Expense,
  User,
  UserRole,
  AuditLog,
  Settings,
  Store
} from '../types';

export const mockStores: Store[] = [
    { id: 'STORE1', name: 'Jakarta Pusat', address: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan' },
    { id: 'STORE2', name: 'Bandung', address: 'Jl. Asia Afrika No.1, Bandung' },
];

export const mockCustomers: Customer[] = [
  { id: 'CUST1', name: 'Budi Santoso', phone: '081234567890', address: 'Jl. Merdeka No. 10, Jakarta', notes: 'Pelanggan VIP', storeId: 'STORE1' },
  { id: 'CUST2', name: 'Siti Aminah', phone: '087654321098', address: 'Jl. Pahlawan No. 5, Surabaya', storeId: 'STORE1' },
  { id: 'CUST3', name: 'Agus Wijaya', phone: '085566778899', address: 'Jl. Sudirman No. 15, Bandung', storeId: 'STORE2' },
  { id: 'CUST4', name: 'Dewi Lestari', phone: '082122334455', address: 'Jl. Gajah Mada No. 20, Semarang', storeId: 'STORE2' },
];

export const mockServices: Service[] = [
  { id: 'S1', name: 'Cuci Kering Lipat', category: ServiceCategory.Kiloan, price: 8000, unit: 'kg', durationDays: 2 },
  { id: 'S2', name: 'Cuci Setrika', category: ServiceCategory.Kiloan, price: 10000, unit: 'kg', durationDays: 3 },
  { id: 'S3', name: 'Setrika Saja', category: ServiceCategory.Kiloan, price: 6000, unit: 'kg', durationDays: 1 },
  { id: 'S4', name: 'Kemeja', category: ServiceCategory.Satuan, price: 15000, unit: 'pcs', durationDays: 2 },
  { id: 'S5', name: 'Jas', category: ServiceCategory.Satuan, price: 50000, unit: 'pcs', durationDays: 4 },
  { id: 'S6', name: 'Selimut', category: ServiceCategory.Satuan, price: 25000, unit: 'pcs', durationDays: 3 },
  { id: 'S7', name: 'Cuci Sepatu', category: ServiceCategory.Sepatu, price: 40000, unit: 'pasang', durationDays: 5 },
  { id: 'S8', name: 'Karpet Tipis', category: ServiceCategory.Karpet, price: 15000, unit: 'm²', durationDays: 5 },
];

export let mockTransactions: Transaction[] = [
  {
    id: 'TRX001', customerId: 'CUST1',
    items: [{ serviceId: 'S2', serviceName: 'Cuci Setrika', quantity: 5, price: 10000, subtotal: 50000, unit: 'kg' }],
    subtotal: 50000,
    discount: 0,
    tax: 0,
    total: 50000, paymentStatus: PaymentStatus.Paid, orderStatus: OrderStatus.Completed,
    createdAt: new Date('2023-10-01T10:00:00'), estimatedCompletionDate: new Date('2023-10-04T10:00:00'),
    amountPaid: 50000, change: 0, paymentMethod: PaymentMethod.QRIS, createdByUserId: 3, storeId: 'STORE1'
  },
  {
    id: 'TRX002', customerId: 'CUST2',
    items: [
        { serviceId: 'S1', serviceName: 'Cuci Kering Lipat', quantity: 3, price: 8000, subtotal: 24000, unit: 'kg' },
        { 
            serviceId: 'S4', 
            serviceName: 'Kemeja', 
            quantity: 2, 
            price: 15000, 
            subtotal: 30000, 
            unit: 'pcs',
            itemDetails: [ { note: 'Noda tinta di saku.' }, { note: '' } ]
        }
    ],
    subtotal: 54000,
    discount: 0,
    tax: 0,
    total: 54000, paymentStatus: PaymentStatus.Unpaid, orderStatus: OrderStatus.Processing,
    createdAt: new Date('2023-10-25T14:30:00'), estimatedCompletionDate: new Date('2023-10-28T14:30:00'),
    amountPaid: 0, change: 0, createdByUserId: 3, storeId: 'STORE1'
  },
  {
    id: 'TRX003', customerId: 'CUST3',
    items: [{ serviceId: 'S5', serviceName: 'Jas', quantity: 1, price: 50000, subtotal: 50000, unit: 'pcs' }],
    subtotal: 50000,
    discount: 5000,
    tax: 0,
    total: 45000, paymentStatus: PaymentStatus.PartiallyPaid, orderStatus: OrderStatus.Ready,
    createdAt: new Date('2023-10-26T11:00:00'), estimatedCompletionDate: new Date('2023-10-30T11:00:00'),
    amountPaid: 20000, change: 0, paymentMethod: PaymentMethod.Cash, createdByUserId: 5, storeId: 'STORE2'
  },
   {
    id: 'TRX004', customerId: 'CUST4',
    items: [{ serviceId: 'S7', serviceName: 'Cuci Sepatu', quantity: 2, price: 40000, subtotal: 80000, unit: 'pasang' }],
    subtotal: 80000,
    discount: 0,
    tax: 0,
    total: 80000, paymentStatus: PaymentStatus.Unpaid, orderStatus: OrderStatus.Processing,
    createdAt: new Date('2023-10-27T09:00:00'), estimatedCompletionDate: new Date('2023-11-01T09:00:00'),
    amountPaid: 0, change: 0, createdByUserId: 2, storeId: 'STORE2'
  },
];

export const mockInventory: InventoryItem[] = [
  { id: 'INV1', name: 'Deterjen Cair', stock: 50, lowStockThreshold: 10, unit: 'liter', storeId: 'STORE1' },
  { id: 'INV2', name: 'Pewangi Pakaian', stock: 40, lowStockThreshold: 15, unit: 'liter', storeId: 'STORE1' },
  { id: 'INV3', name: 'Plastik Kemasan', stock: 500, lowStockThreshold: 100, unit: 'pcs', storeId: 'STORE2' },
  { id: 'INV4', name: 'Hanger', stock: 200, lowStockThreshold: 50, unit: 'pcs', storeId: 'STORE2' },
];

export const mockAssets: Asset[] = [
  { 
    id: 'ASSET1', name: 'Mesin Cuci LG A1', serialNumber: 'LG-FL-202201A', purchaseDate: new Date('2022-01-15'), purchaseCost: 8000000, status: 'Active', storeId: 'STORE1',
    maintenanceHistory: [ { id: 1, date: new Date('2023-05-20'), description: 'Pembersihan filter rutin', cost: 0 } ]
  },
  {
    id: 'ASSET2', name: 'Mesin Pengering B2', serialNumber: 'ELX-DR-202201B', purchaseDate: new Date('2022-01-15'), purchaseCost: 7500000, status: 'Active', storeId: 'STORE1',
    maintenanceHistory: []
  },
  {
    id: 'ASSET3', name: 'Setrika Uap C3', serialNumber: 'PH-SI-202111C', purchaseDate: new Date('2021-11-10'), purchaseCost: 1200000, status: 'Under Maintenance', storeId: 'STORE2',
    maintenanceHistory: [ { id: 1, date: new Date('2023-10-20'), description: 'Ganti selang uap', cost: 150000 } ]
  },
];

export const mockExpenses: Expense[] = [
  { id: 1, date: new Date('2023-10-25'), description: 'Pembelian Deterjen', category: 'Bahan Baku', amount: 500000, storeId: 'STORE1' },
  { id: 2, date: new Date('2023-10-20'), description: 'Bayar Listrik', category: 'Operasional', amount: 1200000, storeId: 'STORE1' },
  { id: 3, date: new Date('2023-10-15'), description: 'Gaji Karyawan', category: 'Gaji', amount: 5000000, storeId: 'STORE2' },
];

export const mockUsers: User[] = [
  { id: 1, name: 'Super Admin', role: UserRole.SuperAdmin, isActive: true },
  { id: 2, name: 'Admin Jakarta', role: UserRole.BranchAdmin, isActive: true, storeId: 'STORE1' },
  { id: 3, name: 'Kasir Jakarta', role: UserRole.Cashier, isActive: true, storeId: 'STORE1' },
  { id: 4, name: 'Admin Bandung', role: UserRole.BranchAdmin, isActive: true, storeId: 'STORE2' },
  { id: 5, name: 'Kasir Bandung', role: UserRole.Cashier, isActive: true, storeId: 'STORE2' },
  { id: 6, name: 'Kasir Nonaktif', role: UserRole.Cashier, isActive: false, storeId: 'STORE1' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 1, timestamp: new Date(), user: 'Super Admin', action: 'Login ke sistem' },
  { id: 2, timestamp: new Date(), user: 'Kasir Jakarta', action: 'Membuat transaksi TRX002' },
  { id: 3, timestamp: new Date(), user: 'Admin Bandung', action: 'Menambahkan Aset "Setrika Uap C3"' },
];

export const mockSettings: Settings = {
    receiptMessage: 'Terima kasih telah menggunakan jasa kami! Silakan simpan struk ini sebagai bukti transaksi.',
    taxRate: 0,
    discountRate: 0,
};