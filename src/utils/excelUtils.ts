import ExcelJS from 'exceljs';
import type {
  Customer,
  Service,
  InventoryItem,
  Asset,
  Expense,
  AssetStatus,
  ServiceCategory,
  Transaction,
  TransactionItem,
} from '../types';

// ============================================
// EXCEL EXPORT FUNCTIONS
// ============================================

/**
 * Export customers to Excel file
 */
export async function exportCustomersToExcel(customers: Customer[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Customers');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama', key: 'name', width: 25 },
    { header: 'Nomor HP', key: 'phone', width: 20 },
    { header: 'Alamat', key: 'address', width: 40 },
    { header: 'Catatan', key: 'notes', width: 30 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data
  customers.forEach((customer) => {
    worksheet.addRow({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'customers.xlsx');
}

/**
 * Export transactions to Excel file
 */
export async function exportTransactionsToExcel(
  transactions: Transaction[],
  customers: { id: string; name: string; phone: string }[],
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transaksi');

  // Define columns
  worksheet.columns = [
    { header: 'ID Transaksi', key: 'id', width: 40 },
    { header: 'Kode Invoice', key: 'invoiceCode', width: 15 },
    { header: 'Tanggal', key: 'createdAt', width: 20 },
    { header: 'Nama Pelanggan', key: 'customerName', width: 25 },
    { header: 'No. HP', key: 'customerPhone', width: 18 },
    { header: 'Layanan', key: 'services', width: 40 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
    { header: 'Diskon', key: 'discount', width: 12 },
    { header: 'Pajak', key: 'tax', width: 12 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Status Pesanan', key: 'orderStatus', width: 18 },
    { header: 'Status Bayar', key: 'paymentStatus', width: 18 },
    { header: 'Dibayar', key: 'amountPaid', width: 15 },
    { header: 'Kembalian', key: 'change', width: 12 },
    { header: 'Metode Bayar', key: 'paymentMethod', width: 18 },
    { header: 'Est. Selesai', key: 'estimatedCompletionDate', width: 18 },
    { header: 'Catatan', key: 'notes', width: 30 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data
  transactions.forEach((transaction) => {
    const customer = customers.find((c) => c.id === transaction.customerId);
    const services = transaction.items
      .map(
        (item: TransactionItem) =>
          `${item.serviceName} (${item.quantity} ${item.unit} × Rp ${item.price.toLocaleString('id-ID')})`,
      )
      .join(', ');

    worksheet.addRow({
      id: transaction.id,
      invoiceCode: transaction.invoiceCode || '-',
      createdAt: new Date(transaction.createdAt).toLocaleString('id-ID'),
      customerName: customer?.name || 'Unknown',
      customerPhone: customer?.phone || '-',
      services: services,
      subtotal: transaction.subtotal,
      discount: transaction.discount,
      tax: transaction.tax,
      total: transaction.total,
      orderStatus: transaction.orderStatus,
      paymentStatus: transaction.paymentStatus,
      amountPaid: transaction.amountPaid,
      change: transaction.change,
      paymentMethod: transaction.paymentMethod || '-',
      estimatedCompletionDate: transaction.estimatedCompletionDate,
      notes: transaction.notes || '-',
    });
  });

  // Format currency columns
  const currencyColumns = ['G', 'H', 'I', 'J', 'M', 'N']; // subtotal, discount, tax, total, amountPaid, change
  currencyColumns.forEach((col) => {
    worksheet.getColumn(col).numFmt = 'Rp #,##0';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(buffer, `transaksi_${timestamp}.xlsx`);
}

/**
 * Export services to Excel file
 */
export async function exportServicesToExcel(services: Service[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Services');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Layanan', key: 'name', width: 30 },
    { header: 'Kategori', key: 'category', width: 15 },
    { header: 'Harga', key: 'price', width: 15 },
    { header: 'Unit', key: 'unit', width: 15 },
    { header: 'Estimasi (hari)', key: 'estimatedDays', width: 15 },
    { header: 'Deskripsi', key: 'description', width: 40 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data
  services.forEach((service) => {
    worksheet.addRow({
      id: service.id,
      name: service.name,
      category: service.category,
      price: service.price,
      unit: service.unit,
      durationDays: service.durationDays,
    });
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'services.xlsx');
}

/**
 * Export inventory items to Excel file
 */
export async function exportInventoryToExcel(items: InventoryItem[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Item', key: 'name', width: 30 },
    { header: 'Stok', key: 'stock', width: 12 },
    { header: 'Min Stok Alert', key: 'lowStockThreshold', width: 15 },
    { header: 'Unit', key: 'unit', width: 20 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data
  items.forEach((item) => {
    worksheet.addRow({
      id: item.id,
      name: item.name,
      stock: item.stock,
      lowStockThreshold: item.lowStockThreshold,
      unit: item.unit,
    });
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'inventory.xlsx');
}

/**
 * Export assets to Excel file
 */
export async function exportAssetsToExcel(assets: Asset[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Assets');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Aset', key: 'name', width: 30 },
    { header: 'Serial Number', key: 'serialNumber', width: 20 },
    { header: 'Tanggal Beli', key: 'purchaseDate', width: 15 },
    { header: 'Harga Beli', key: 'purchaseCost', width: 15 },
    { header: 'Status', key: 'status', width: 20 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data
  assets.forEach((asset) => {
    worksheet.addRow({
      id: asset.id,
      name: asset.name,
      serialNumber: asset.serialNumber || '',
      purchaseDate: asset.purchaseDate || '',
      purchaseCost: asset.purchaseCost || 0,
      status: asset.status,
    });
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'assets.xlsx');
}

/**
 * Export expenses to Excel file
 */
export async function exportExpensesToExcel(expenses: Expense[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Expenses');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Kategori', key: 'category', width: 20 },
    { header: 'Jumlah', key: 'amount', width: 15 },
    { header: 'Deskripsi', key: 'description', width: 40 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data
  expenses.forEach((expense) => {
    worksheet.addRow({
      id: expense.id,
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
    });
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'expenses.xlsx');
}

// ============================================
// EXCEL IMPORT FUNCTIONS
// ============================================

/**
 * Import customers from Excel file
 */
export async function importCustomersFromExcel(file: File): Promise<Partial<Customer>[]> {
  const workbook = await readExcelFile(file);
  const worksheet = workbook.getWorksheet('Customers');

  if (!worksheet) {
    throw new Error('Sheet "Customers" tidak ditemukan dalam file Excel');
  }

  const customers: Partial<Customer>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    const rawId = row.getCell(1).value?.toString();
    const customerId = rawId && !rawId.includes('Kosongkan') ? rawId : undefined;

    const customer: Partial<Customer> = {
      id: customerId,
      name: row.getCell(2).value?.toString() || '',
      phone: row.getCell(3).value?.toString() || undefined,
      address: row.getCell(4).value?.toString() || undefined,
      notes: row.getCell(5).value?.toString() || undefined,
    };

    // Only add if name is not empty
    if (customer.name) {
      customers.push(customer);
    }
  });

  return customers;
}

/**
 * Import services from Excel file
 */
export async function importServicesFromExcel(file: File): Promise<Partial<Service>[]> {
  const workbook = await readExcelFile(file);
  const worksheet = workbook.getWorksheet('Services');

  if (!worksheet) {
    throw new Error('Sheet "Services" tidak ditemukan dalam file Excel');
  }

  const services: Partial<Service>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    const rawId = row.getCell(1).value?.toString();
    const serviceId = rawId && !rawId.includes('Kosongkan') ? rawId : undefined;

    const service: Partial<Service> = {
      id: serviceId,
      name: row.getCell(2).value?.toString() || '',
      category: row.getCell(3).value?.toString() as ServiceCategory,
      price: Number(row.getCell(4).value) || 0,
      unit: row.getCell(5).value?.toString() || 'Kg',
      durationDays: Number(row.getCell(6).value) || 3,
    };

    // Only add if name is not empty
    if (service.name) {
      services.push(service);
    }
  });

  return services;
}

/**
 * Import inventory items from Excel file
 */
export async function importInventoryFromExcel(file: File): Promise<Partial<InventoryItem>[]> {
  const workbook = await readExcelFile(file);
  const worksheet = workbook.getWorksheet('Inventory');

  if (!worksheet) {
    throw new Error('Sheet "Inventory" tidak ditemukan dalam file Excel');
  }

  const items: Partial<InventoryItem>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    const rawId = row.getCell(1).value?.toString();
    const itemId = rawId && !rawId.includes('Kosongkan') ? rawId : undefined;

    const item: Partial<InventoryItem> = {
      id: itemId,
      name: row.getCell(2).value?.toString() || '',
      stock: Number(row.getCell(3).value) || 0,
      lowStockThreshold: Number(row.getCell(4).value) || 0,
      unit: row.getCell(5).value?.toString() || 'pcs',
    };

    // Only add if name is not empty
    if (item.name) {
      items.push(item);
    }
  });

  return items;
}

/**
 * Import assets from Excel file
 */
export async function importAssetsFromExcel(file: File): Promise<Partial<Asset>[]> {
  const workbook = await readExcelFile(file);
  const worksheet = workbook.getWorksheet('Assets');

  if (!worksheet) {
    throw new Error('Sheet "Assets" tidak ditemukan dalam file Excel');
  }

  const assets: Partial<Asset>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    const rawId = row.getCell(1).value?.toString();
    const assetId = rawId && !rawId.includes('Kosongkan') ? rawId : undefined;

    const purchaseDateValue = row.getCell(4).value;
    let purchaseDate: Date | undefined;
    if (purchaseDateValue instanceof Date) {
      purchaseDate = purchaseDateValue;
    } else if (typeof purchaseDateValue === 'string') {
      const parsed = new Date(purchaseDateValue);
      purchaseDate = isNaN(parsed.getTime()) ? undefined : parsed;
    }

    const asset: Partial<Asset> = {
      id: assetId,
      name: row.getCell(2).value?.toString() || '',
      serialNumber: row.getCell(3).value?.toString() || undefined,
      purchaseDate,
      purchaseCost: Number(row.getCell(5).value) || undefined,
      status: (row.getCell(6).value?.toString() || 'Active') as AssetStatus,
    };

    // Only add if name is not empty
    if (asset.name) {
      assets.push(asset);
    }
  });

  return assets;
}

/**
 * Import expenses from Excel file
 */
export async function importExpensesFromExcel(file: File): Promise<Partial<Expense>[]> {
  const workbook = await readExcelFile(file);
  const worksheet = workbook.getWorksheet('Expenses');

  if (!worksheet) {
    throw new Error('Sheet "Expenses" tidak ditemukan dalam file Excel');
  }

  const expenses: Partial<Expense>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    const rawId = row.getCell(1).value?.toString();
    const expenseId = rawId && !rawId.includes('Kosongkan') ? rawId : undefined;

    // Convert date to YYYY-MM-DD format
    const dateCell = row.getCell(2).value;
    let formattedDate: string;
    if (dateCell instanceof Date) {
      formattedDate = dateCell.toISOString().split('T')[0];
    } else if (typeof dateCell === 'string') {
      // Try to parse if string
      const parsedDate = new Date(dateCell);
      formattedDate = isNaN(parsedDate.getTime())
        ? new Date().toISOString().split('T')[0]
        : parsedDate.toISOString().split('T')[0];
    } else {
      formattedDate = new Date().toISOString().split('T')[0];
    }

    const expense: Partial<Expense> = {
      id: expenseId,
      date: new Date(formattedDate),
      category: row.getCell(3).value?.toString() || 'Lainnya',
      amount: Number(row.getCell(4).value) || 0,
      description: row.getCell(5).value?.toString() || '',
    };

    // Only add if description is not empty
    if (expense.description) {
      expenses.push(expense);
    }
  });

  return expenses;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Read Excel file
 */
async function readExcelFile(file: File): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  return workbook;
}

/**
 * Download file to browser
 */
function downloadFile(buffer: ExcelJS.Buffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Generate Excel template for customers
 */
export async function downloadCustomerTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [
    { header: 'Panduan Penggunaan Template', key: 'guide', width: 80 },
  ];

  // Header instruksi
  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  instructionSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  instructionSheet.getRow(1).height = 30;

  // Isi instruksi
  const instructions = [
    '',
    '🎯 CARA MENGGUNAKAN TEMPLATE INI:',
    '',
    '1️⃣ Kolom ID:',
    '   • Kosongkan untuk menambah pelanggan BARU',
    '   • Isi dengan ID existing untuk UPDATE data pelanggan yang sudah ada',
    '',
    '2️⃣ Kolom Nama: WAJIB diisi (tidak boleh kosong)',
    '',
    '3️⃣ Kolom Nomor HP: OPSIONAL',
    '   • Format: 08xxxxxxxxxx atau +628xxxxxxxxxx atau 628xxxxxxxxxx',
    '   • Contoh: 081234567890',
    '',
    '4️⃣ Kolom Alamat & Catatan: OPSIONAL (boleh kosong)',
    '',
    '⚠️ PENTING:',
    '   • Jangan ubah nama kolom header (baris pertama)',
    '   • Hapus baris contoh sebelum mengisi data Anda',
    '   • Satu file bisa berisi banyak pelanggan',
    '   • Nomor HP yang sama tidak bisa digunakan untuk pelanggan berbeda',
    '',
    '💾 CARA IMPORT:',
    '   1. Isi data di sheet "Data Pelanggan"',
    '   2. Save file Excel',
    '   3. Kembali ke aplikasi → Halaman Pelanggan',
    '   4. Klik tombol "Import" dan pilih file ini',
    '',
    '✅ Setelah import berhasil, data akan langsung muncul di daftar pelanggan',
  ];

  instructions.forEach((text, index) => {
    const row = instructionSheet.getRow(index + 2);
    row.getCell(1).value = text;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    
    if (text.includes('🎯') || text.includes('💾')) {
      row.font = { bold: true, size: 12, color: { argb: 'FF2563EB' } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Pelanggan
  const dataSheet = workbook.addWorksheet('Data Pelanggan');
  
  dataSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Pelanggan', key: 'name', width: 30 },
    { header: 'Nomor HP', key: 'phone', width: 20 },
    { header: 'Alamat', key: 'address', width: 45 },
    { header: 'Catatan', key: 'notes', width: 35 },
  ];

  // Style header
  dataSheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  dataSheet.getRow(1).height = 25;

  // Add sample rows dengan berbagai contoh
  const sampleData = [
    {
      id: '',
      name: 'Ibu Siti',
      phone: '081234567890',
      address: 'Jl. Merdeka No. 45, Jakarta',
      notes: 'Pelanggan VIP - berikan diskon 10%',
    },
    {
      id: '',
      name: 'Pak Budi',
      phone: '082198765432',
      address: 'Perum Griya Asri Blok C12',
      notes: '',
    },
    {
      id: '',
      name: 'Hotel Grand Plaza',
      phone: '+6281234567890',
      address: 'Jl. Gatot Subroto No. 100',
      notes: 'Corporate client - tagihan bulanan',
    },
  ];

  sampleData.forEach((data, index) => {
    const row = dataSheet.addRow(data);
    row.height = 20;
    
    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    }
  });

  // Add borders
  dataSheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  // Add note di bawah data
  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value = '💡 Tips: Hapus baris contoh di atas, lalu isi dengan data pelanggan Anda sendiri';
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 5);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Pelanggan.xlsx');
}

/**
 * Generate Excel template for services
 */
export async function downloadServiceTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [
    { header: 'Panduan Penggunaan Template', key: 'guide', width: 80 },
  ];

  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' },
  };
  instructionSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  instructionSheet.getRow(1).height = 30;

  const instructions = [
    '',
    '🎯 CARA MENGGUNAKAN TEMPLATE INI:',
    '',
    '1️⃣ Kolom ID:',
    '   • Kosongkan untuk menambah layanan BARU',
    '   • Isi dengan ID existing untuk UPDATE layanan yang sudah ada',
    '',
    '2️⃣ Kolom Nama Layanan: WAJIB diisi',
    '',
    '3️⃣ Kolom Kategori: WAJIB dipilih dari salah satu:',
    '   • Kiloan (untuk cuci kiloan)',
    '   • Satuan (untuk cuci satuan seperti bed cover, selimut)',
    '   • Sepatu (untuk cuci sepatu)',
    '   • Karpet (untuk cuci karpet)',
    '',
    '4️⃣ Kolom Harga: WAJIB diisi (dalam Rupiah, tanpa titik/koma)',
    '   • Contoh: 7000 untuk Rp 7.000',
    '',
    '5️⃣ Kolom Unit: WAJIB diisi',
    '   • Untuk Kiloan: kg',
    '   • Untuk Satuan: pcs atau pasang',
    '   • Untuk Sepatu: pasang',
    '   • Untuk Karpet: m2',
    '',
    '6️⃣ Kolom Estimasi (hari): WAJIB diisi',
    '   • Berapa hari estimasi pengerjaan',
    '   • Contoh: 3 untuk 3 hari',
    '',
    '7️⃣ Kolom Deskripsi: OPSIONAL',
    '',
    '⚠️ PENTING:',
    '   • Jangan ubah nama kolom header',
    '   • Hapus baris contoh sebelum mengisi data',
    '   • Kategori harus PERSIS sama dengan pilihan di atas',
    '',
    '💾 CARA IMPORT:',
    '   1. Isi data di sheet "Data Layanan"',
    '   2. Save file Excel',
    '   3. Kembali ke aplikasi → Halaman Layanan',
    '   4. Klik tombol "Import" dan pilih file ini',
  ];

  instructions.forEach((text, index) => {
    const row = instructionSheet.getRow(index + 2);
    row.getCell(1).value = text;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    
    if (text.includes('🎯') || text.includes('💾')) {
      row.font = { bold: true, size: 12, color: { argb: 'FF10B981' } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Layanan
  const dataSheet = workbook.addWorksheet('Data Layanan');
  
  dataSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Layanan', key: 'name', width: 35 },
    { header: 'Kategori', key: 'category', width: 15 },
    { header: 'Harga', key: 'price', width: 15 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Estimasi (hari)', key: 'estimatedDays', width: 18 },
    { header: 'Deskripsi', key: 'description', width: 45 },
  ];

  dataSheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' },
  };
  dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  dataSheet.getRow(1).height = 25;

  const sampleData = [
    {
      id: '',
      name: 'Cuci Kering Kiloan',
      category: 'Kiloan',
      price: 7000,
      unit: 'kg',
      estimatedDays: 3,
      description: 'Cuci kering tanpa setrika, parfum standar',
    },
    {
      id: '',
      name: 'Cuci Setrika Kiloan',
      category: 'Kiloan',
      price: 10000,
      unit: 'kg',
      estimatedDays: 3,
      description: 'Cuci kering + setrika rapi + parfum',
    },
    {
      id: '',
      name: 'Bed Cover Single',
      category: 'Satuan',
      price: 25000,
      unit: 'pcs',
      estimatedDays: 2,
      description: 'Bed cover ukuran single/twin',
    },
    {
      id: '',
      name: 'Cuci Sepatu Sneakers',
      category: 'Sepatu',
      price: 35000,
      unit: 'pasang',
      estimatedDays: 2,
      description: 'Deep cleaning sepatu sneakers + repellent',
    },
    {
      id: '',
      name: 'Cuci Karpet',
      category: 'Karpet',
      price: 50000,
      unit: 'm2',
      estimatedDays: 4,
      description: 'Per meter persegi, harga sudah termasuk jemput',
    },
  ];

  sampleData.forEach((data, index) => {
    const row = dataSheet.addRow(data);
    row.height = 20;
    
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    }
  });

  dataSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value = '💡 Tips: Hapus 5 baris contoh di atas, lalu isi dengan daftar layanan Anda';
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 7);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Layanan.xlsx');
}

/**
 * Generate Excel template for inventory
 */
export async function downloadInventoryTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [
    { header: 'Panduan Penggunaan Template', key: 'guide', width: 80 },
  ];

  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8B5CF6' },
  };
  instructionSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  instructionSheet.getRow(1).height = 30;

  const instructions = [
    '',
    '🎯 CARA MENGGUNAKAN TEMPLATE INI:',
    '',
    '1️⃣ Kolom ID:',
    '   • Kosongkan untuk menambah item BARU',
    '   • Isi dengan ID existing untuk UPDATE item yang sudah ada',
    '',
    '2️⃣ Kolom Nama Item: WAJIB diisi',
    '',
    '3️⃣ Kolom Stok: WAJIB diisi (angka tanpa koma/titik)',
    '   • Jumlah stok saat ini',
    '   • Contoh: 50 untuk 50 unit',
    '',
    '4️⃣ Kolom Min Stok Alert: WAJIB diisi',
    '   • Batas minimum stok sebelum perlu restock',
    '   • Sistem akan memberi notifikasi jika stok < minimum',
    '   • Contoh: 10 (artinya jika stok di bawah 10, akan ada peringatan)',
    '',
    '5️⃣ Kolom Unit: WAJIB diisi',
    '   • Satuan pengukuran stok',
    '   • Contoh: kg, liter, pcs, lusin, box, botol',
    '',
    '⚠️ PENTING:',
    '   • Jangan ubah nama kolom header',
    '   • Hapus baris contoh sebelum mengisi data',
    '   • Stok dan Min Stok Alert harus berupa angka',
    '   • Pastikan Unit konsisten untuk item sejenis',
    '',
    '💡 TIPS MANAJEMEN STOK:',
    '   • Set Min Stok Alert = konsumsi 1-2 minggu',
    '   • Review stok secara berkala',
    '   • Update stok setelah pembelian/pemakaian',
    '',
    '💾 CARA IMPORT:',
    '   1. Isi data di sheet "Data Inventori"',
    '   2. Save file Excel',
    '   3. Kembali ke aplikasi → Halaman Inventori',
    '   4. Klik tombol "Import" dan pilih file ini',
  ];

  instructions.forEach((text, index) => {
    const row = instructionSheet.getRow(index + 2);
    row.getCell(1).value = text;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    
    if (text.includes('🎯') || text.includes('💾') || text.includes('💡')) {
      row.font = { bold: true, size: 12, color: { argb: 'FF8B5CF6' } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Inventori
  const dataSheet = workbook.addWorksheet('Data Inventori');
  
  dataSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Item', key: 'name', width: 40 },
    { header: 'Stok', key: 'stock', width: 12 },
    { header: 'Min Stok Alert', key: 'lowStockThreshold', width: 18 },
    { header: 'Unit', key: 'unit', width: 15 },
  ];

  dataSheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8B5CF6' },
  };
  dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  dataSheet.getRow(1).height = 25;

  const sampleData = [
    {
      id: '',
      name: 'Deterjen Bubuk Premium',
      stock: 50,
      lowStockThreshold: 10,
      unit: 'kg',
    },
    {
      id: '',
      name: 'Pewangi Laundry',
      stock: 25,
      lowStockThreshold: 5,
      unit: 'liter',
    },
    {
      id: '',
      name: 'Plastik Wrapping Roll',
      stock: 15,
      lowStockThreshold: 3,
      unit: 'roll',
    },
    {
      id: '',
      name: 'Gantungan Baju Plastik',
      stock: 500,
      lowStockThreshold: 100,
      unit: 'pcs',
    },
    {
      id: '',
      name: 'Sikat Sepatu',
      stock: 8,
      lowStockThreshold: 2,
      unit: 'pcs',
    },
  ];

  sampleData.forEach((data, index) => {
    const row = dataSheet.addRow(data);
    row.height = 20;
    
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    }
  });

  dataSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value = '💡 Tips: Hapus 5 baris contoh di atas, lalu isi dengan daftar inventori Anda';
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 5);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Inventori.xlsx');
}

/**
 * Generate Excel template for assets
 */
export async function downloadAssetTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [
    { header: 'Panduan Penggunaan Template', key: 'guide', width: 80 },
  ];

  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF59E0B' },
  };
  instructionSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  instructionSheet.getRow(1).height = 30;

  const instructions = [
    '',
    '🎯 CARA MENGGUNAKAN TEMPLATE INI:',
    '',
    '1️⃣ Kolom ID:',
    '   • Kosongkan untuk menambah aset BARU',
    '   • Isi dengan ID existing untuk UPDATE aset yang sudah ada',
    '',
    '2️⃣ Kolom Nama Aset: WAJIB diisi',
    '   • Nama lengkap dari aset/peralatan',
    '',
    '3️⃣ Kolom Serial Number: WAJIB diisi',
    '   • Nomor seri atau kode unik aset',
    '   • Gunakan format yang mudah diingat (contoh: MC-001, SETRIKA-02)',
    '',
    '4️⃣ Kolom Tanggal Beli: WAJIB diisi',
    '   • Format: YYYY-MM-DD (contoh: 2024-01-15)',
    '   • Gunakan tanggal pembelian aset',
    '',
    '5️⃣ Kolom Harga Beli: WAJIB diisi (dalam Rupiah, tanpa titik/koma)',
    '   • Contoh: 5500000 untuk Rp 5.500.000',
    '',
    '6️⃣ Kolom Status: WAJIB dipilih dari salah satu:',
    '   • Active (aset sedang digunakan)',
    '   • Under Maintenance (sedang dalam perbaikan)',
    '   • Decommissioned (sudah tidak digunakan)',
    '',
    '⚠️ PENTING:',
    '   • Jangan ubah nama kolom header',
    '   • Hapus baris contoh sebelum mengisi data',
    '   • Tanggal harus format YYYY-MM-DD',
    '   • Status harus PERSIS sama dengan pilihan di atas',
    '   • Harga Beli harus berupa angka tanpa titik/koma',
    '',
    '💡 TIPS MANAJEMEN ASET:',
    '   • Gunakan serial number yang sistematis',
    '   • Catat semua maintenance di menu Maintenance',
    '   • Review kondisi aset secara berkala',
    '   • Update status aset sesuai kondisi aktual',
    '',
    '💾 CARA IMPORT:',
    '   1. Isi data di sheet "Data Aset"',
    '   2. Save file Excel',
    '   3. Kembali ke aplikasi → Halaman Aset',
    '   4. Klik tombol "Import" dan pilih file ini',
  ];

  instructions.forEach((text, index) => {
    const row = instructionSheet.getRow(index + 2);
    row.getCell(1).value = text;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    
    if (text.includes('🎯') || text.includes('💾') || text.includes('💡')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFF59E0B' } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Aset
  const dataSheet = workbook.addWorksheet('Data Aset');
  
  dataSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Aset', key: 'name', width: 35 },
    { header: 'Serial Number', key: 'serialNumber', width: 20 },
    { header: 'Tanggal Beli', key: 'purchaseDate', width: 18 },
    { header: 'Harga Beli', key: 'purchaseCost', width: 18 },
    { header: 'Status', key: 'status', width: 22 },
  ];

  dataSheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF59E0B' },
  };
  dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  dataSheet.getRow(1).height = 25;

  const sampleData = [
    {
      id: '',
      name: 'Mesin Cuci LG 10kg',
      serialNumber: 'MC-001',
      purchaseDate: '2024-01-15',
      purchaseCost: 5500000,
      status: 'Active',
    },
    {
      id: '',
      name: 'Mesin Pengering Sharp 8kg',
      serialNumber: 'MP-001',
      purchaseDate: '2024-02-20',
      purchaseCost: 4200000,
      status: 'Active',
    },
    {
      id: '',
      name: 'Setrika Uap Philips',
      serialNumber: 'SETRIKA-01',
      purchaseDate: '2023-11-10',
      purchaseCost: 850000,
      status: 'Under Maintenance',
    },
    {
      id: '',
      name: 'Rak Display Besi 5 Tingkat',
      serialNumber: 'RAK-003',
      purchaseDate: '2023-06-01',
      purchaseCost: 1200000,
      status: 'Active',
    },
    {
      id: '',
      name: 'Kipas Angin Besar',
      serialNumber: 'KIPAS-02',
      purchaseDate: '2022-12-15',
      purchaseCost: 450000,
      status: 'Decommissioned',
    },
  ];

  sampleData.forEach((data, index) => {
    const row = dataSheet.addRow(data);
    row.height = 20;
    
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    }
  });

  dataSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value = '💡 Tips: Hapus 5 baris contoh di atas, lalu isi dengan daftar aset Anda';
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 6);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Aset.xlsx');
}

/**
 * Generate Excel template for expenses
 */
export async function downloadExpenseTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [
    { header: 'Panduan Penggunaan Template', key: 'guide', width: 80 },
  ];

  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEF4444' },
  };
  instructionSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  instructionSheet.getRow(1).height = 30;

  const instructions = [
    '',
    '🎯 CARA MENGGUNAKAN TEMPLATE INI:',
    '',
    '1️⃣ Kolom ID:',
    '   • Kosongkan untuk menambah pengeluaran BARU',
    '   • Isi dengan ID existing untuk UPDATE pengeluaran yang sudah ada',
    '',
    '2️⃣ Kolom Tanggal: WAJIB diisi',
    '   • Format: YYYY-MM-DD (contoh: 2024-12-15)',
    '   • Gunakan tanggal saat pengeluaran terjadi',
    '',
    '3️⃣ Kolom Kategori: WAJIB diisi',
    '   • Contoh: Pembelian Bahan, Gaji Karyawan, Listrik & Air, Sewa Tempat, dll',
    '   • Gunakan kategori yang konsisten',
    '',
    '4️⃣ Kolom Jumlah: WAJIB diisi (dalam Rupiah, tanpa titik/koma)',
    '   • Contoh: 500000 untuk Rp 500.000',
    '',
    '5️⃣ Kolom Deskripsi: WAJIB diisi',
    '   • Penjelasan singkat tentang pengeluaran',
    '   • Contoh: "Beli detergen 10kg + pewangi 5 liter"',
    '',
    '6️⃣ Kolom Catatan: OPSIONAL',
    '   • Informasi tambahan jika diperlukan',
    '',
    '⚠️ PENTING:',
    '   • Jangan ubah nama kolom header',
    '   • Hapus baris contoh sebelum mengisi data',
    '   • Tanggal harus format YYYY-MM-DD',
    '   • Jumlah harus berupa angka tanpa titik/koma',
    '   • Pastikan kategori konsisten untuk laporan yang akurat',
    '',
    '💡 TIPS PENCATATAN PENGELUARAN:',
    '   • Catat pengeluaran sesegera mungkin',
    '   • Simpan bukti/nota pembelian',
    '   • Kategorikan dengan jelas dan konsisten',
    '   • Review pengeluaran bulanan secara rutin',
    '',
    '💾 CARA IMPORT:',
    '   1. Isi data di sheet "Data Pengeluaran"',
    '   2. Save file Excel',
    '   3. Kembali ke aplikasi → Halaman Pengeluaran',
    '   4. Klik tombol "Import" dan pilih file ini',
  ];

  instructions.forEach((text, index) => {
    const row = instructionSheet.getRow(index + 2);
    row.getCell(1).value = text;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    
    if (text.includes('🎯') || text.includes('💾') || text.includes('💡')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFEF4444' } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Pengeluaran
  const dataSheet = workbook.addWorksheet('Data Pengeluaran');
  
  dataSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Tanggal', key: 'date', width: 18 },
    { header: 'Kategori', key: 'category', width: 25 },
    { header: 'Jumlah', key: 'amount', width: 18 },
    { header: 'Deskripsi', key: 'description', width: 45 },
    { header: 'Catatan', key: 'notes', width: 35 },
  ];

  dataSheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEF4444' },
  };
  dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  dataSheet.getRow(1).height = 25;

  const sampleData = [
    {
      id: '',
      date: '2024-12-15',
      category: 'Pembelian Bahan',
      amount: 500000,
      description: 'Beli detergen 10kg + pewangi 5 liter',
      notes: 'Supplier Toko Makmur',
    },
    {
      id: '',
      date: '2024-12-10',
      category: 'Gaji Karyawan',
      amount: 3000000,
      description: 'Gaji karyawan bulan Desember',
      notes: '2 karyawan @ Rp 1.500.000',
    },
    {
      id: '',
      date: '2024-12-05',
      category: 'Listrik & Air',
      amount: 750000,
      description: 'Bayar tagihan listrik dan air bulan November',
      notes: 'Listrik Rp 550k, Air Rp 200k',
    },
    {
      id: '',
      date: '2024-12-01',
      category: 'Sewa Tempat',
      amount: 2500000,
      description: 'Sewa toko bulan Desember',
      notes: 'Sewa toko + parkir',
    },
    {
      id: '',
      date: '2024-11-28',
      category: 'Maintenance',
      amount: 350000,
      description: 'Service mesin cuci',
      notes: 'Ganti bearing + bersih mesin',
    },
  ];

  sampleData.forEach((data, index) => {
    const row = dataSheet.addRow(data);
    row.height = 20;
    
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    }
  });

  dataSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value = '💡 Tips: Hapus 5 baris contoh di atas, lalu isi dengan data pengeluaran Anda';
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 6);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Pengeluaran.xlsx');
}

/**
 * Generate Excel template for transactions
 * Note: Transaction template is for EXPORT only, not for import
 */
export async function downloadTransactionTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Informasi
  const infoSheet = workbook.addWorksheet('ℹ️ INFORMASI');
  infoSheet.columns = [
    { header: 'Tentang Template Transaksi', key: 'info', width: 80 },
  ];

  infoSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  infoSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  infoSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  infoSheet.getRow(1).height = 30;

  const infoText = [
    '',
    '📊 TEMPLATE TRANSAKSI',
    '',
    'Template ini adalah untuk EXPORT transaksi saja.',
    'Anda TIDAK BISA mengimport data transaksi menggunakan template ini.',
    '',
    '❓ KENAPA TIDAK BISA IMPORT?',
    '',
    'Transaksi adalah data yang kompleks dan sensitif yang melibatkan:',
    '   • Hubungan dengan data pelanggan',
    '   • Hubungan dengan data layanan',
    '   • Kalkulasi harga, diskon, dan pajak',
    '   • Pencatatan pembayaran dan status',
    '   • Nomor invoice yang auto-generated',
    '',
    'Oleh karena itu, transaksi harus dibuat melalui aplikasi langsung',
    'untuk memastikan semua data terintegrasi dengan benar.',
    '',
    '✅ CARA MEMBUAT TRANSAKSI BARU:',
    '',
    '1. Buka aplikasi → Menu "Transaksi"',
    '2. Klik tombol "Tambah Transaksi Baru"',
    '3. Isi formulir transaksi dengan lengkap:',
    '   • Pilih pelanggan (atau tambah pelanggan baru)',
    '   • Pilih layanan yang diinginkan',
    '   • Sistem akan otomatis menghitung total',
    '   • Atur status pembayaran dan pengerjaan',
    '4. Simpan transaksi',
    '',
    '📥 CARA EXPORT TRANSAKSI:',
    '',
    '1. Buka halaman "Daftar Transaksi" di aplikasi',
    '2. Gunakan filter untuk memilih transaksi yang ingin di-export:',
    '   • Filter berdasarkan tanggal',
    '   • Filter berdasarkan status',
    '   • Filter berdasarkan pelanggan',
    '3. Klik tombol "Export" untuk download data Excel',
    '',
    '💡 TIPS:',
    '',
    '   • Export transaksi secara berkala untuk backup',
    '   • Gunakan hasil export untuk analisa bisnis',
    '   • File export bisa dibuka dengan Excel atau Google Sheets',
    '   • Anda bisa melakukan perhitungan tambahan di Excel',
    '',
    '🔒 KEAMANAN DATA:',
    '',
    '   • Simpan file export di tempat yang aman',
    '   • Jangan share file yang berisi data sensitif pelanggan',
    '   • Backup data secara rutin',
  ];

  infoText.forEach((text, index) => {
    const row = infoSheet.getRow(index + 2);
    row.getCell(1).value = text;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    
    if (text.includes('📊') || text.includes('✅') || text.includes('📥') || text.includes('💡')) {
      row.font = { bold: true, size: 12, color: { argb: 'FF2563EB' } };
    } else if (text.includes('❓') || text.includes('🔒')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFEF4444' } };
    }
  });

  // Sheet 2: Template Data (for reference only)
  const dataSheet = workbook.addWorksheet('Contoh Data Transaksi');
  
  dataSheet.columns = [
    { header: 'ID Transaksi', key: 'id', width: 40 },
    { header: 'Kode Invoice', key: 'invoiceCode', width: 18 },
    { header: 'Tanggal', key: 'createdAt', width: 22 },
    { header: 'Nama Pelanggan', key: 'customerName', width: 28 },
    { header: 'No. HP', key: 'customerPhone', width: 18 },
    { header: 'Layanan', key: 'services', width: 45 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
    { header: 'Diskon', key: 'discount', width: 12 },
    { header: 'Pajak', key: 'tax', width: 12 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Status Pesanan', key: 'orderStatus', width: 18 },
    { header: 'Status Bayar', key: 'paymentStatus', width: 18 },
    { header: 'Dibayar', key: 'amountPaid', width: 15 },
    { header: 'Kembalian', key: 'change', width: 12 },
    { header: 'Metode Bayar', key: 'paymentMethod', width: 18 },
    { header: 'Est. Selesai', key: 'estimatedCompletionDate', width: 18 },
    { header: 'Catatan', key: 'notes', width: 35 },
  ];

  dataSheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  dataSheet.getRow(1).height = 25;

  // Add sample rows
  const sampleData = [
    {
      id: 'xxxxx-xxxxx-xxxxx',
      invoiceCode: 'INV-001',
      createdAt: new Date().toLocaleString('id-ID'),
      customerName: 'Budi Santoso',
      customerPhone: '081234567890',
      services: 'Cuci Kering Kiloan (5 kg × Rp 7.000)',
      subtotal: 35000,
      discount: 0,
      tax: 0,
      total: 35000,
      orderStatus: 'Diproses',
      paymentStatus: 'Lunas',
      amountPaid: 35000,
      change: 0,
      paymentMethod: 'Tunai',
      estimatedCompletionDate: '2024-12-18',
      notes: 'Parfum standar',
    },
    {
      id: 'xxxxx-xxxxx-xxxxx',
      invoiceCode: 'INV-002',
      createdAt: new Date().toLocaleString('id-ID'),
      customerName: 'Siti Aminah',
      customerPhone: '082345678901',
      services: 'Cuci Setrika Kiloan (3 kg × Rp 10.000); Bed Cover Single (1 pcs × Rp 25.000)',
      subtotal: 55000,
      discount: 5000,
      tax: 0,
      total: 50000,
      orderStatus: 'Selesai',
      paymentStatus: 'Lunas',
      amountPaid: 50000,
      change: 0,
      paymentMethod: 'Transfer',
      estimatedCompletionDate: '2024-12-16',
      notes: 'Member reguler',
    },
    {
      id: 'xxxxx-xxxxx-xxxxx',
      invoiceCode: 'INV-003',
      createdAt: new Date().toLocaleString('id-ID'),
      customerName: 'Ahmad Wijaya',
      customerPhone: '083456789012',
      services: 'Cuci Sepatu Sneakers (2 pasang × Rp 35.000)',
      subtotal: 70000,
      discount: 0,
      tax: 0,
      total: 70000,
      orderStatus: 'Diambil',
      paymentStatus: 'Belum Lunas',
      amountPaid: 35000,
      change: 0,
      paymentMethod: 'Tunai',
      estimatedCompletionDate: '2024-12-17',
      notes: 'DP 50%, sisa bayar saat ambil',
    },
  ];

  sampleData.forEach((data, index) => {
    const row = dataSheet.addRow(data);
    row.height = 20;
    
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    }
  });

  // Format currency columns
  const currencyColumns = ['G', 'H', 'I', 'J', 'M', 'N'];
  currencyColumns.forEach((col) => {
    dataSheet.getColumn(col).numFmt = 'Rp #,##0';
  });

  dataSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value = 'ℹ️ Informasi: Ini hanya contoh format data transaksi. Untuk export data aktual, gunakan tombol Export di halaman Transaksi.';
  noteRow.getCell(1).font = { italic: true, bold: true, color: { argb: 'FF2563EB' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 17);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Transaksi.xlsx');
}
