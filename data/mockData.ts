

export let mockTransactions: Transaction[] = [
  {
    id: 'TRX001', customerId: 'CUST1',
    items: [{ serviceId: 'S2', serviceName: 'Cuci Setrika', quantity: 5, price: 10000, subtotal: 50000, unit: 'kg' }],
    subtotal: 50000,
    discount: 5000, // 10% discount for VIP
    tax: 0,
    total: 45000, paymentStatus: PaymentStatus.Paid, orderStatus: OrderStatus.Completed,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 40)), estimatedCompletionDate: new Date('2023-10-04T10:00:00'),
    amountPaid: 45000, change: 0, paymentMethod: PaymentMethod.QRIS, createdByUserId: 3, storeId: 'STORE1'
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
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)), estimatedCompletionDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    amountPaid: 0, change: 0, createdByUserId: 3, storeId: 'STORE1'
  },
  {
    id: 'TRX003', customerId: 'CUST3',
    items: [{ serviceId: 'S5', serviceName: 'Jas', quantity: 1, price: 50000, subtotal: 50000, unit: 'pcs', itemDetails: [{note: ''}] }],
    subtotal: 50000,
    discount: 2500, // 5% discount
    tax: 0,
    total: 47500, paymentStatus: PaymentStatus.PartiallyPaid, orderStatus: OrderStatus.Ready,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 4)), estimatedCompletionDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    amountPaid: 20000, change: 0, paymentMethod: PaymentMethod.Cash, createdByUserId: 5, storeId: 'STORE2'
  },
   {
    id: 'TRX004', customerId: 'CUST4',
    items: [{ serviceId: 'S7', serviceName: 'Cuci Sepatu', quantity: 2, price: 40000, subtotal: 80000, unit: 'pasang' }],
    subtotal: 80000,
    discount: 0,
    tax: 0,
    total: 80000, paymentStatus: PaymentStatus.Unpaid, orderStatus: OrderStatus.Processing,
    createdAt: new Date(), estimatedCompletionDate: new Date(new Date().setDate(new Date().getDate() + 4)),
    amountPaid: 0, change: 0, createdByUserId: 2, storeId: 'STORE2'
  },
   {
    id: 'TRX005', customerId: 'CUST1',
    items: [{ serviceId: 'S1', serviceName: 'Cuci Kering Lipat', quantity: 10, price: 8000, subtotal: 80000, unit: 'kg' }],
    subtotal: 80000,
    discount: 8000, 
    tax: 0,
    total: 72000, paymentStatus: PaymentStatus.Paid, orderStatus: OrderStatus.Completed,
    createdAt: new Date(), estimatedCompletionDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    amountPaid: 72000, change: 0, paymentMethod: PaymentMethod.QRIS, createdByUserId: 3, storeId: 'STORE1'
  },
];

export const mockInventory: InventoryItem[] = [
  { id: 'INV1', name: 'Deterjen Cair', stock: 50, lowStockThreshold: 10, unit: 'liter', storeId: 'STORE1' },
  { id: 'INV2', name: 'Pewangi Pakaian', stock: 40, lowStockThreshold: 15, unit: 'liter', storeId: 'STORE1' },
  { id: 'INV3', name: 'Plastik Kemasan', stock: 5, lowStockThreshold: 100, unit: 'pcs', storeId: 'STORE2' },
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
  { id: 1, date: new Date(), description: 'Pembelian Deterjen', category: 'Bahan Baku', amount: 500000, storeId: 'STORE1' },
  { id: 2, date: new Date(new Date().setDate(new Date().getDate() - 10)), description: 'Bayar Listrik', category: 'Operasional', amount: 1200000, storeId: 'STORE1' },
  { id: 3, date: new Date(new Date().setDate(new Date().getDate() - 15)), description: 'Gaji Karyawan', category: 'Gaji', amount: 5000000, storeId: 'STORE2' },
];

export const mockUsers: User[] = [
  { id: 1, name: 'Super Admin', role: UserRole.SuperAdmin, isActive: true, canGiveDiscount: true },
  { id: 2, name: 'Admin Jakarta', role: UserRole.BranchAdmin, isActive: true, storeId: 'STORE1', canGiveDiscount: true },
  { id: 3, name: 'Kasir Jakarta', role: UserRole.Cashier, isActive: true, storeId: 'STORE1', canGiveDiscount: false },
  { id: 4, name: 'Admin Bandung', role: UserRole.BranchAdmin, isActive: true, storeId: 'STORE2', canGiveDiscount: true },
  { id: 5, name: 'Kasir Bandung', role: UserRole.Cashier, isActive: true, storeId: 'STORE2', canGiveDiscount: true },
  { id: 6, name: 'Kasir Nonaktif', role: UserRole.Cashier, isActive: false, storeId: 'STORE1', canGiveDiscount: false },
];

export const mockSettings: Settings = {
    receiptMessage: 'Terima kasih telah menggunakan jasa kami! Silakan simpan struk ini sebagai bukti transaksi.',
    taxRate: 0,
    discountRate: 0,
};

export const mockScheduledMaintenance: ScheduledMaintenance[] = [
    {
        id: 'SCHED1',
        assetId: 'ASSET1',
        description: 'Pembersihan filter bulanan',
        frequencyValue: 1,
        frequencyUnit: 'months',
        nextDueDate: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago to show on dashboard
        lastCompletedDate: null
    },
    {
        id: 'SCHED2',
        assetId: 'ASSET3',
        description: 'Pengecekan selang uap',
        frequencyValue: 6,
        frequencyUnit: 'months',
        nextDueDate: new Date(new Date().setMonth(new Date().getMonth() + 2)), // 2 months from now
        lastCompletedDate: new Date(new Date().setMonth(new Date().getMonth() - 4))
    }
];
