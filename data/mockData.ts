import { User, UserRole, Service, ServiceCategory, InventoryItem, Transaction, PaymentStatus, OrderStatus, Asset, Expense, AuditLog, AppSettings, Customer } from '../types';

export const mockUsers: User[] = [
  { id: 1, name: 'Admin Laundry', role: UserRole.Admin, isActive: true },
  { id: 2, name: 'Kasir Satu', role: UserRole.Cashier, isActive: true },
  { id: 3, name: 'Kasir Dua', role: UserRole.Cashier, isActive: false },
];

export const mockCustomers: Customer[] = [
    { id: 'CUST01', name: 'Budi Santoso', phone: '081234567890', address: 'Jl. Merdeka No. 10, Jakarta', notes: 'Pelanggan reguler, minta pewangi lavender.' },
    { id: 'CUST02', name: 'Citra Lestari', phone: '085678901234', address: 'Jl. Sudirman Kav. 5, Bandung' },
    { id: 'CUST03', name: 'Doni Firmansyah', phone: '087812345678', address: 'Jl. Pahlawan No. 2, Surabaya', notes: 'Hati-hati dengan kemeja sutra.' },
    { id: 'CUST04', name: 'Eka Putri', phone: '089955554321', address: 'Jl. Gatot Subroto No. 15, Medan' },
];


export const mockServices: Service[] = [
  { id: 'S1', name: 'Cuci Kering Lipat', category: ServiceCategory.Kiloan, price: 7000, unit: 'kg', durationDays: 2 },
  { id: 'S2', name: 'Cuci Kering Setrika', category: ServiceCategory.Kiloan, price: 9000, unit: 'kg', durationDays: 3 },
  { id: 'S3', name: 'Setrika Saja', category: ServiceCategory.Kiloan, price: 5000, unit: 'kg', durationDays: 1 },
  { id: 'S4', name: 'Express 6 Jam', category: ServiceCategory.Express, price: 15000, unit: 'kg', durationDays: 0 },
  { id: 'S5', name: 'Kemeja', category: ServiceCategory.Satuan, price: 10000, unit: 'pcs', durationDays: 2 },
  { id: 'S6', name: 'Jas', category: ServiceCategory.DryClean, price: 30000, unit: 'pcs', durationDays: 4 },
  { id: 'S7', name: 'Selimut', category: ServiceCategory.Satuan, price: 20000, unit: 'pcs', durationDays: 3 },
];

export const mockInventory: InventoryItem[] = [
  { id: 'INV1', name: 'Deterjen Bubuk', stock: 20, lowStockThreshold: 5, unit: 'kg' },
  { id: 'INV2', name: 'Pewangi Pakaian', stock: 15, lowStockThreshold: 5, unit: 'liter' },
  { id: 'INV3', name: 'Plastik Packing', stock: 250, lowStockThreshold: 100, unit: 'pcs' },
  { id: 'INV4', name: 'Hanger', stock: 80, lowStockThreshold: 20, unit: 'pcs' },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'TRX001', customerId: 'CUST01',
    items: [{ serviceId: 'S2', serviceName: 'Cuci Kering Setrika', quantity: 3, price: 9000, subtotal: 27000, unit: 'kg' }],
    total: 27000, paymentStatus: PaymentStatus.Paid, orderStatus: OrderStatus.Completed,
    createdAt: new Date('2023-10-26T10:00:00'), estimatedCompletionDate: new Date('2023-10-29T10:00:00')
  },
  {
    id: 'TRX002', customerId: 'CUST02',
    items: [
        { serviceId: 'S1', serviceName: 'Cuci Kering Lipat', quantity: 5, price: 7000, subtotal: 35000, unit: 'kg' }, 
        { serviceId: 'S7', serviceName: 'Selimut', quantity: 1, price: 20000, subtotal: 20000, unit: 'pcs' }
    ],
    total: 55000, paymentStatus: PaymentStatus.Unpaid, orderStatus: OrderStatus.Processing,
    createdAt: new Date('2023-10-27T14:30:00'), estimatedCompletionDate: new Date('2023-10-30T14:30:00')
  },
  {
    id: 'TRX003', customerId: 'CUST03',
    items: [{ serviceId: 'S6', serviceName: 'Jas', quantity: 2, price: 30000, subtotal: 60000, unit: 'pcs' }],
    total: 60000, paymentStatus: PaymentStatus.Paid, orderStatus: OrderStatus.Ready,
    createdAt: new Date('2023-10-28T09:00:00'), estimatedCompletionDate: new Date('2023-11-01T09:00:00')
  },
  {
    id: 'TRX004', customerId: 'CUST01',
    items: [{ serviceId: 'S5', serviceName: 'Kemeja', quantity: 5, price: 10000, subtotal: 50000, unit: 'pcs' }],
    total: 50000, paymentStatus: PaymentStatus.Unpaid, orderStatus: OrderStatus.Processing,
    createdAt: new Date('2023-10-29T11:00:00'), estimatedCompletionDate: new Date('2023-11-01T11:00:00')
  }
];

export const mockAssets: Asset[] = [
  {
    id: 'ASSET01', name: 'Mesin Cuci Front Load LG', purchaseDate: new Date('2022-01-15'), purchaseCost: 7000000, status: 'Active',
    maintenanceHistory: [{ id: 1, date: new Date('2023-06-20'), description: 'Pembersihan filter', cost: 50000 }]
  },
  {
    id: 'ASSET02', name: 'Mesin Pengering Electrolux', purchaseDate: new Date('2022-01-15'), purchaseCost: 6500000, status: 'Under Maintenance',
    maintenanceHistory: [{ id: 1, date: new Date('2023-10-25'), description: 'Ganti v-belt', cost: 250000 }]
  },
  {
    id: 'ASSET03', name: 'Setrika Uap Philips', purchaseDate: new Date('2022-05-10'), purchaseCost: 1200000, status: 'Active',
    maintenanceHistory: []
  },
];

export const mockExpenses: Expense[] = [
  { id: 1, date: new Date('2023-10-25'), category: 'Operasional', description: 'Listrik', amount: 500000 },
  { id: 2, date: new Date('2023-10-25'), category: 'Inventaris', description: 'Pembelian deterjen', amount: 200000 },
  { id: 3, date: new Date('2023-10-26'), category: 'Gaji', description: 'Gaji Kasir 1', amount: 1500000 },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 1, timestamp: new Date(), user: 'Admin Laundry', action: 'Login' },
  { id: 2, timestamp: new Date(), user: 'Kasir Satu', action: 'Membuat transaksi TRX003' },
  { id: 3, timestamp: new Date(), user: 'Admin Laundry', action: 'Mengubah layanan "Jas"' },
];

export const mockSettings: AppSettings = {
    openTime: '08:00',
    closeTime: '21:00',
    taxRate: 0,
    deliveryFeePerKm: 2000,
    whatsappNumber: '081234567890',
    receiptMessage: 'Terima kasih telah menggunakan jasa kami!'
};