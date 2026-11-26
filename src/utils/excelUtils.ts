/* eslint-disable @typescript-eslint/no-unused-vars */
import type ExcelJS from 'exceljs';
import type {
  Customer,
  Service,
  InventoryItem,
  Asset,
  Expense,
  AssetStatus,
  ServiceCategory,
  WashType,
  Transaction,
  TransactionItem,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  MaintenanceLog,
} from '../types';

// Dynamic import to prevent ExcelJS from bloating the initial bundle
const getExcelJS = async () => {
  const mod = await import('exceljs');
  return mod.default || mod;
};

const createWorkbook = async (): Promise<ExcelJS.Workbook> => {
  const ExcelJSModule = await getExcelJS();
  return new ExcelJSModule.Workbook();
};

// ============================================
// CONSTANTS
// ============================================
const BRAND_BLUE = 'FF2563EB';
const BRAND_WHITE = 'FFFFFFFF';
const BORDER_COLOR = 'FFD1D5DB';
const ALTERNATE_ROW_COLOR = 'FFF3F4F6';

// ============================================
// EXCEL EXPORT FUNCTIONS
// ============================================

/**
 * Export customers to Excel file
 */
export async function exportCustomersToExcel(customers: Customer[]): Promise<void> {
  const workbook = await createWorkbook();
  const worksheet = workbook.addWorksheet('Customers');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama', key: 'name', width: 30 },
    { header: 'Nomor HP', key: 'phone', width: 20 },
    { header: 'Alamat', key: 'address', width: 45 },
    { header: 'Catatan', key: 'notes', width: 35 },
  ];

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: BRAND_WHITE } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data
  customers.forEach((customer, index) => {
    const row = worksheet.addRow({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });

    // Alternate row styling
    if (index % 2 !== 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
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
  const workbook = await createWorkbook();
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
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: BRAND_WHITE } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data
  transactions.forEach((transaction, index) => {
    const customer = customers.find((c) => c.id === transaction.customerId);
    const services = transaction.items
      .map(
        (item: TransactionItem) =>
          `${item.serviceName} (${item.quantity} ${item.unit} × Rp ${item.price.toLocaleString('id-ID')})`,
      )
      .join(', ');

    const row = worksheet.addRow({
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

    // Alternate row styling
    if (index % 2 !== 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
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
  const workbook = await createWorkbook();
  const worksheet = workbook.addWorksheet('Services');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Layanan', key: 'name', width: 35 },
    { header: 'Kategori', key: 'category', width: 15 },
    { header: 'Jenis Cucian', key: 'washType', width: 15 },
    { header: 'Harga', key: 'price', width: 15 },
    { header: 'Unit', key: 'unit', width: 15 },
    { header: 'Estimasi (hari)', key: 'durationDays', width: 18 },
  ];

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: BRAND_WHITE } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data
  services.forEach((service, index) => {
    const row = worksheet.addRow({
      id: service.id,
      name: service.name,
      category: service.category,
      washType: service.washType,
      price: service.price,
      unit: service.unit,
      durationDays: service.durationDays,
    });

    // Alternate row styling
    if (index % 2 !== 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'services.xlsx');
}

/**
 * Export inventory items to Excel file
 */
export async function exportInventoryToExcel(items: InventoryItem[]): Promise<void> {
  const workbook = await createWorkbook();
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
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: BRAND_WHITE } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data
  items.forEach((item, index) => {
    const row = worksheet.addRow({
      id: item.id,
      name: item.name,
      stock: item.stock,
      lowStockThreshold: item.lowStockThreshold,
      unit: item.unit,
    });

    // Alternate row styling
    if (index % 2 !== 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'inventory.xlsx');
}

/**
 * Export assets to Excel file
 */
export async function exportAssetsToExcel(assets: Asset[]): Promise<void> {
  const workbook = await createWorkbook();
  const worksheet = workbook.addWorksheet('Assets');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Aset', key: 'name', width: 30 },
    { header: 'Serial Number', key: 'serialNumber', width: 25 },
    { header: 'Tanggal Beli', key: 'purchaseDate', width: 18 },
    { header: 'Harga Beli', key: 'purchaseCost', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: BRAND_WHITE } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data
  assets.forEach((asset, index) => {
    const row = worksheet.addRow({
      id: asset.id,
      name: asset.name,
      serialNumber: asset.serialNumber || '',
      purchaseDate:
        asset.purchaseDate instanceof Date
          ? asset.purchaseDate.toISOString().split('T')[0]
          : asset.purchaseDate || '',
      purchaseCost: asset.purchaseCost || 0,
      status: asset.status,
    });

    // Alternate row styling
    if (index % 2 !== 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'assets.xlsx');
}

/**
 * Export expenses to Excel file
 */
export async function exportExpensesToExcel(expenses: Expense[]): Promise<void> {
  const workbook = await createWorkbook();
  const worksheet = workbook.addWorksheet('Expenses');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Tanggal', key: 'date', width: 18 },
    { header: 'Kategori', key: 'category', width: 20 },
    { header: 'Jumlah', key: 'amount', width: 18 },
    { header: 'Deskripsi', key: 'description', width: 45 },
  ];

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: BRAND_WHITE } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data
  expenses.forEach((expense, index) => {
    const row = worksheet.addRow({
      id: expense.id,
      date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
    });

    // Alternate row styling
    if (index % 2 !== 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'expenses.xlsx');
}

// ============================================
// EXCEL IMPORT FUNCTIONS
// ============================================
// ... (Import functions remain mostly unchanged, they just read data)
// We will skip editing import functions as they don't affect visual templates,
// but we need to ensure we don't accidentally remove them.
// I will just collapse them in this replacement for brevity if the tool supports it,
// but wait, I can just not touch lines 320-530.
// Actually, looking at the available lines in the context, I need to be careful.
// I will replace the export functions block first.

// Wait, the user wants consistency. The TEMPLATES that are downloaded are generated by
// downloadCustomerTemplate, downloadServiceTemplate, etc.
// These are further down in the file (lines 560+).
// I need to update THOSE as well.

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

  worksheet.eachRow((row, _rowNumber) => {
    // Skip header row
    if (_rowNumber === 1) return;

    const rawId = row.getCell(1).value?.toString();
    const customerId = rawId && rawId.trim() !== '' ? rawId : undefined;

    // Structure: ID, Name, Phone, Address, Notes
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

  worksheet.eachRow((row, _rowNumber) => {
    // Skip header row
    if (_rowNumber === 1) return;

    const rawId = row.getCell(1).value?.toString();
    const serviceId = rawId && rawId.trim() !== '' ? rawId : undefined;

    const service: Partial<Service> = {
      id: serviceId,
      name: row.getCell(2).value?.toString() || '',
      category: row.getCell(3).value?.toString() as ServiceCategory,
      washType: (row.getCell(4).value?.toString() || 'Pakaian') as WashType,
      price: Number(row.getCell(5).value) || 0,
      unit: row.getCell(6).value?.toString() || 'kg',
      durationDays: Number(row.getCell(7).value) || 3,
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

  worksheet.eachRow((row, _rowNumber) => {
    // Skip header row
    if (_rowNumber === 1) return;

    const rawId = row.getCell(1).value?.toString();
    const id = rawId && rawId.trim() !== '' ? rawId : undefined;

    // Structure: ID, Name, Stock, LowStockThreshold, Unit
    const item: Partial<InventoryItem> = {
      id,
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

  worksheet.eachRow((row, _rowNumber) => {
    // Skip header row
    if (_rowNumber === 1) return;

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

  worksheet.eachRow((row, _rowNumber) => {
    // Skip header row
    if (_rowNumber === 1) return;

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
  const workbook = await createWorkbook();
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
  const workbook = await createWorkbook();

  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [{ header: 'Panduan Penggunaan Template', key: 'guide', width: 80 }];

  // Header instruksi
  const headerRow = instructionSheet.getRow(1);
  headerRow.font = { bold: true, size: 14, color: { argb: BRAND_WHITE } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

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
      row.font = { bold: true, size: 12, color: { argb: BRAND_BLUE } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Pelanggan
  const dataSheet = workbook.addWorksheet('Customers');

  dataSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Pelanggan', key: 'name', width: 35 },
    { header: 'Nomor HP', key: 'phone', width: 20 },
    { header: 'Alamat', key: 'address', width: 50 },
    { header: 'Catatan', key: 'notes', width: 40 },
  ];

  // Style header
  const dataHeaderRow = dataSheet.getRow(1);
  dataHeaderRow.font = { bold: true, size: 11, color: { argb: BRAND_WHITE } };
  dataHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  dataHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  dataHeaderRow.height = 25;

  // Add sample rows dengan berbagai contoh
  const sampleData = [
    {
      name: 'Ibu Siti',
      phone: '081234567890',
      address: 'Jl. Merdeka No. 45, Jakarta',
      notes: 'Pelanggan VIP',
    },
    {
      name: 'Pak Budi',
      phone: '082198765432',
      address: 'Perum Griya Asri Blok C12',
      notes: 'Pelanggan reguler',
    },
    {
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
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
  });

  // Add borders
  dataSheet.eachRow((row, _rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });
  });

  // Add note di bawah data
  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value =
    '💡 Tips: Hapus baris contoh di atas, lalu isi dengan data pelanggan Anda sendiri';
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 5);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Pelanggan.xlsx');
}

/**
 * Generate Excel template for services
 */
export async function downloadServiceTemplate(): Promise<void> {
  const workbook = await createWorkbook();

  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [{ header: 'Panduan Penggunaan Template', key: 'guide', width: 80 }];

  const instructionHeader = instructionSheet.getRow(1);
  instructionHeader.font = { bold: true, size: 14, color: { argb: BRAND_WHITE } };
  instructionHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  instructionHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  instructionHeader.height = 30;

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
      row.font = { bold: true, size: 12, color: { argb: BRAND_BLUE } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Layanan
  const dataSheet = workbook.addWorksheet('Services');

  dataSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Layanan', key: 'name', width: 35 },
    { header: 'Kategori', key: 'category', width: 15 },
    { header: 'Jenis Cucian', key: 'washType', width: 15 },
    { header: 'Harga', key: 'price', width: 15 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Estimasi (hari)', key: 'estimatedDays', width: 18 },
  ];

  const dataHeader = dataSheet.getRow(1);
  dataHeader.font = { bold: true, size: 11, color: { argb: BRAND_WHITE } };
  dataHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  dataHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  dataHeader.height = 25;

  const sampleData = [
    {
      name: 'Cuci Kering Kiloan',
      category: 'Kiloan',
      washType: 'Pakaian',
      price: 7000,
      unit: 'kg',
      estimatedDays: 3,
    },
    {
      name: 'Cuci Setrika Kiloan',
      category: 'Kiloan',
      washType: 'Pakaian',
      price: 10000,
      unit: 'kg',
      estimatedDays: 3,
    },
    {
      name: 'Bed Cover Single',
      category: 'Satuan',
      washType: 'Bed Cover',
      price: 25000,
      unit: 'pcs',
      estimatedDays: 2,
    },
    {
      name: 'Cuci Sepatu Sneakers',
      category: 'Sepatu',
      washType: 'Sepatu',
      price: 35000,
      unit: 'pasang',
      estimatedDays: 2,
    },
    {
      name: 'Cuci Karpet',
      category: 'Karpet',
      washType: 'Karpet',
      price: 50000,
      unit: 'm2',
      estimatedDays: 4,
    },
  ];

  sampleData.forEach((data, index) => {
    const row = dataSheet.addRow(data);
    row.height = 20;

    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
  });

  dataSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });
  });

  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value =
    '💡 Tips: Hapus 5 baris contoh di atas, lalu isi dengan daftar layanan Anda';
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 7);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Layanan.xlsx');
}

/**
 * Generate Excel template for inventory
 */
export async function downloadInventoryTemplate(): Promise<void> {
  const workbook = await createWorkbook();

  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [{ header: 'Panduan Penggunaan Template', key: 'guide', width: 80 }];

  const instructionHeader = instructionSheet.getRow(1);
  instructionHeader.font = { bold: true, size: 14, color: { argb: BRAND_WHITE } };
  instructionHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  instructionHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  instructionHeader.height = 30;

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
      row.font = { bold: true, size: 12, color: { argb: BRAND_BLUE } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Inventori
  const dataSheet = workbook.addWorksheet('Inventory');

  dataSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Item', key: 'name', width: 40 },
    { header: 'Stok', key: 'stock', width: 12 },
    { header: 'Min Stok Alert', key: 'lowStockThreshold', width: 18 },
    { header: 'Unit', key: 'unit', width: 15 },
  ];

  const dataHeader = dataSheet.getRow(1);
  dataHeader.font = { bold: true, size: 11, color: { argb: BRAND_WHITE } };
  dataHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  dataHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  dataHeader.height = 25;

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
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
  });

  dataSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });
  });

  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value =
    '💡 Tips: Hapus 5 baris contoh di atas, lalu isi dengan daftar inventori Anda';
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 5);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Inventori.xlsx');
}

/**
 * Generate Excel template for assets
 */
export async function downloadAssetTemplate(): Promise<void> {
  const workbook = await createWorkbook();

  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [{ header: 'Panduan Penggunaan Template', key: 'guide', width: 80 }];

  const instructionHeader = instructionSheet.getRow(1);
  instructionHeader.font = { bold: true, size: 14, color: { argb: BRAND_WHITE } };
  instructionHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  instructionHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  instructionHeader.height = 30;

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
      row.font = { bold: true, size: 12, color: { argb: BRAND_BLUE } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Aset
  const dataSheet = workbook.addWorksheet('Assets');

  dataSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Aset', key: 'name', width: 35 },
    { header: 'Serial Number', key: 'serialNumber', width: 20 },
    { header: 'Tanggal Beli', key: 'purchaseDate', width: 18 },
    { header: 'Harga Beli', key: 'purchaseCost', width: 18 },
    { header: 'Status', key: 'status', width: 22 },
  ];

  const dataHeader = dataSheet.getRow(1);
  dataHeader.font = { bold: true, size: 11, color: { argb: BRAND_WHITE } };
  dataHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
  };
  dataHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  dataHeader.height = 25;

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
        fgColor: { argb: ALTERNATE_ROW_COLOR },
      };
    }
  });

  dataSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });
  });

  const noteRow = dataSheet.addRow(['']);
  noteRow.getCell(1).value =
    '💡 Tips: Hapus 5 baris contoh di atas, lalu isi dengan daftar aset Anda';
  noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 6);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Aset.xlsx');
}

/**
 * Generate Excel template for expenses
 */
export async function downloadExpenseTemplate(): Promise<void> {
  const workbook = await createWorkbook();

  // Sheet 1: Instruksi
  const instructionSheet = workbook.addWorksheet('📋 INSTRUKSI');
  instructionSheet.columns = [{ header: 'Panduan Penggunaan Template', key: 'guide', width: 80 }];

  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_BLUE },
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
      row.font = { bold: true, size: 12, color: { argb: BRAND_BLUE } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    } else if (text.match(/^\d️⃣/)) {
      row.font = { bold: true, size: 11 };
    }
  });

  // Sheet 2: Data Pengeluaran
  const dataSheet = workbook.addWorksheet('Expenses');

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
    fgColor: { argb: BRAND_BLUE },
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
  noteRow.getCell(1).value =
    '💡 Tips: Hapus 5 baris contoh di atas, lalu isi dengan data pengeluaran Anda';
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
  const workbook = await createWorkbook();

  // Sheet 1: Informasi
  const infoSheet = workbook.addWorksheet('ℹ️ INFORMASI');
  infoSheet.columns = [{ header: 'Tentang Template Transaksi', key: 'info', width: 80 }];

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
    '📊 TEMPLATE TRANSAKSI - BACKUP & RESTORE',
    '',
    '✅ FITUR BARU: Template ini sekarang mendukung IMPORT untuk backup/restore!',
    '',
    '📤 CARA EXPORT TRANSAKSI (BACKUP):',
    '',
    '1. Buka halaman "Daftar Transaksi" di aplikasi',
    '2. Gunakan filter untuk memilih transaksi yang ingin di-backup:',
    '   • Filter berdasarkan tanggal',
    '   • Filter berdasarkan status',
    '   • Filter berdasarkan pelanggan',
    '3. Klik tombol "Export" untuk download data Excel',
    '4. Simpan file Excel sebagai backup',
    '',
    '📥 CARA IMPORT TRANSAKSI (RESTORE):',
    '',
    '1. Buka halaman "Daftar Transaksi" di aplikasi',
    '2. Klik tombol "Import"',
    '3. Pilih file Excel hasil export sebelumnya',
    '4. Sistem akan:',
    '   • Validasi semua data',
    '   • Cek duplikasi invoice',
    '   • Verifikasi pelanggan dan layanan sudah ada',
    '   • Import transaksi yang valid',
    '5. Lihat hasil import di notifikasi',
    '',
    '⚠️ PENTING - SYARAT IMPORT:',
    '',
    '   ✓ File harus berformat Excel (.xlsx atau .xls)',
    '   ✓ Pelanggan harus sudah terdaftar (nama/no HP cocok)',
    '   ✓ Layanan harus sudah tersedia di database',
    '   ✓ Kode invoice tidak boleh duplikat',
    '   ✓ Format kolom harus sesuai template (jangan ubah header)',
    '   ✓ Hanya Admin/Super Admin yang bisa import',
    '',
    '💡 TIPS BACKUP & RESTORE:',
    '',
    '   • Export transaksi secara berkala (harian/mingguan)',
    '   • Simpan file backup di cloud storage (Google Drive, OneDrive)',
    '   • Beri nama file dengan tanggal, contoh: transaksi_2025-12-17.xlsx',
    '   • Pastikan data pelanggan & layanan sudah diimport terlebih dahulu',
    '   • Gunakan hasil export untuk analisa bisnis di Excel',
    '',
    '🔒 KEAMANAN DATA:',
    '',
    '   • Simpan file backup di tempat yang aman',
    '   • Jangan share file yang berisi data sensitif pelanggan',
    '   • Backup data secara rutin untuk antisipasi kehilangan data',
    '   • Enkripsi file backup jika disimpan di cloud',
    '',
    '❌ YANG TIDAK BISA DIIMPORT:',
    '',
    '   • Transaksi dengan invoice duplikat akan dilewati',
    '   • Transaksi dengan pelanggan tidak terdaftar akan error',
    '   • Transaksi dengan layanan tidak tersedia akan error',
    '   • Data yang tidak sesuai format akan diabaikan',
    '',
    '✅ CARA MEMBUAT TRANSAKSI BARU:',
    '',
    'Selain import, Anda tetap bisa membuat transaksi baru:',
    '1. Buka aplikasi → Menu "Transaksi"',
    '2. Klik tombol "Tambah Transaksi Baru"',
    '3. Isi formulir transaksi dengan lengkap',
    '4. Simpan transaksi',
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

  // Sheet 2: Transaksi (importable template)
  const dataSheet = workbook.addWorksheet('Transaksi');

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
  noteRow.getCell(1).value =
    '✅ Template ini BISA diimport! Export transaksi aktual dengan tombol Export, lalu import kembali dengan tombol Import untuk backup/restore.';
  noteRow.getCell(1).font = { italic: true, bold: true, color: { argb: 'FF16A34A' } };
  dataSheet.mergeCells(noteRow.number, 1, noteRow.number, 17);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'Template_Transaksi.xlsx');
}

// ============================================
// IMPORT TRANSACTIONS FROM EXCEL
// ============================================

interface ImportTransactionResult {
  success: Transaction[];
  errors: Array<{ row: number; error: string; data?: unknown }>;
}

/**
 * Import transactions from Excel file
 * For backup/restore purposes only
 */
export async function importTransactionsFromExcel(
  file: File,
  existingCustomers: Customer[],
  existingServices: Service[],
  existingTransactions: Transaction[],
): Promise<ImportTransactionResult> {
  const workbook = await createWorkbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const worksheet = workbook.getWorksheet('Transaksi');
  if (!worksheet) {
    throw new Error('Sheet "Transaksi" tidak ditemukan dalam file Excel');
  }

  const success: Transaction[] = [];
  const errors: Array<{ row: number; error: string; data?: unknown }> = [];

  // Skip header row (row 1)
  worksheet.eachRow((row, _rowNumber) => {
    if (_rowNumber === 1) return; // Skip header

    try {
      const id = row.getCell(1).value?.toString().trim();
      const invoiceCode = row.getCell(2).value?.toString().trim();
      const createdAtStr = row.getCell(3).value?.toString().trim();
      const customerName = row.getCell(4).value?.toString().trim();
      const customerPhone = row.getCell(5).value?.toString().trim();
      const servicesStr = row.getCell(6).value?.toString().trim();
      const subtotal = Number(row.getCell(7).value) || 0;
      const discount = Number(row.getCell(8).value) || 0;
      const tax = Number(row.getCell(9).value) || 0;
      const total = Number(row.getCell(10).value) || 0;
      const orderStatus = row.getCell(11).value?.toString().trim();
      const paymentStatus = row.getCell(12).value?.toString().trim();
      const amountPaid = Number(row.getCell(13).value) || 0;
      const change = Number(row.getCell(14).value) || 0;
      const paymentMethod = row.getCell(15).value?.toString().trim();
      const estimatedCompletionDate = row.getCell(16).value?.toString().trim();
      const notes = row.getCell(17).value?.toString().trim();

      // Validation
      if (!id || !invoiceCode || !customerName || !servicesStr) {
        errors.push({
          row: _rowNumber,
          error: 'Data tidak lengkap (ID, Invoice, Pelanggan, atau Layanan kosong)',
          data: { id, invoiceCode, customerName },
        });
        return;
      }

      // Check for duplicate invoice code
      const duplicateInExisting = existingTransactions.find((t) => t.invoiceCode === invoiceCode);
      const duplicateInSuccess = success.find((t) => t.invoiceCode === invoiceCode);

      if (duplicateInExisting || duplicateInSuccess) {
        errors.push({
          row: _rowNumber,
          error: `Invoice ${invoiceCode} sudah ada dalam database`,
          data: { invoiceCode },
        });
        return;
      }

      // Find or create customer
      const customer = existingCustomers.find(
        (c) =>
          c.name.toLowerCase() === customerName.toLowerCase() ||
          (customerPhone && c.phone === customerPhone),
      );

      if (!customer) {
        errors.push({
          row: _rowNumber,
          error: `Pelanggan "${customerName}" tidak ditemukan. Silakan tambahkan pelanggan terlebih dahulu.`,
          data: { customerName, customerPhone },
        });
        return;
      }

      // Parse services from string
      // Format: "Service Name (quantity unit × Rp price), ..."
      const items: TransactionItem[] = [];
      const serviceMatches = servicesStr?.match(/([^(]+)\s*\(([^)]+)\)/g);

      if (!serviceMatches || serviceMatches.length === 0) {
        errors.push({
          row: _rowNumber,
          error: 'Format layanan tidak valid',
          data: { servicesStr },
        });
        return;
      }

      for (const serviceMatch of serviceMatches) {
        const nameMatch = serviceMatch.match(/^([^(]+)/);
        const detailMatch = serviceMatch.match(/\(([^)]+)\)/);

        if (!nameMatch || !detailMatch) continue;

        const serviceName = nameMatch[1].trim();
        const details = detailMatch[1];
        const qtyMatch = details.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
        const priceMatch = details.match(/Rp\s*([\d,.]+)/);

        if (!qtyMatch || !priceMatch) {
          errors.push({
            row: _rowNumber,
            error: `Format detail layanan tidak valid: ${serviceMatch}`,
            data: { serviceMatch },
          });
          return;
        }

        const quantity = parseFloat(qtyMatch[1]);
        const unit = qtyMatch[2];

        // Parse price from Excel (may have locale formatting like "7.000" or "7,000")
        const priceStr = priceMatch[1].replace(/\./g, '').replace(/,/g, ''); // Remove thousands separators
        const price = parseFloat(priceStr) || 0;

        // Find service
        const service = existingServices.find(
          (s) => s.name.toLowerCase() === serviceName.toLowerCase(),
        );

        if (!service) {
          errors.push({
            row: _rowNumber,
            error: `Layanan "${serviceName}" tidak ditemukan`,
            data: { serviceName },
          });
          return;
        }

        items.push({
          serviceId: service.id,
          serviceName: service.name,
          quantity,
          unit,
          price: price || service.price, // Use parsed price or fallback to service price
          subtotal: (price || service.price) * quantity, // Calculate subtotal
        });
      }

      if (items.length === 0) {
        errors.push({
          row: _rowNumber,
          error: 'Tidak ada layanan yang valid',
          data: { servicesStr },
        });
        return;
      }

      // Parse date
      let createdAt: Date;
      try {
        // Try to parse the date string
        if (createdAtStr) {
          createdAt = new Date(createdAtStr);
          if (isNaN(createdAt.getTime())) {
            // If invalid, use current date
            createdAt = new Date();
          }
        } else {
          createdAt = new Date();
        }
      } catch {
        createdAt = new Date();
      }

      // Create transaction object
      const transaction: Transaction = {
        id: id || crypto.randomUUID(),
        invoiceCode: invoiceCode || '',
        customerId: customer.id,
        items,
        subtotal,
        discount,
        tax,
        total,
        orderStatus: orderStatus as OrderStatus,
        paymentStatus: paymentStatus as PaymentStatus,
        amountPaid,
        change,
        paymentMethod: (paymentMethod || undefined) as PaymentMethod | undefined,
        estimatedCompletionDate: estimatedCompletionDate || '',
        notes: notes || '',
        createdAt: new Date(createdAt),
        storeId: '', // To be filled by app
        createdByUserId: '', // To be filled by app
      };

      success.push(transaction);
    } catch (error) {
      errors.push({
        row: _rowNumber,
        error: error instanceof Error ? error.message : 'Error tidak diketahui',
      });
    }
  });

  return { success, errors };
}

// ============================================
// FULL BACKUP & RESTORE - EXPORT ALL DATA
// ============================================

/**
 * Export all data (Full Backup) to a single Excel file with multiple sheets
 */
export async function exportAllData(
  customers: Customer[],
  services: Service[],
  inventory: InventoryItem[],
  assets: Asset[],
  expenses: Expense[],
  transactions: Transaction[],
): Promise<void> {
  const workbook = await createWorkbook();
  const timestamp = new Date().toISOString().split('T')[0];

  // Sheet 1: Info
  const infoSheet = workbook.addWorksheet('ℹ️ INFO');
  infoSheet.columns = [{ header: 'Full Backup Information', key: 'info', width: 80 }];

  infoSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  infoSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  infoSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  infoSheet.getRow(1).height = 30;

  const infoData = [
    '',
    '💾 FULL BACKUP - SEMUA DATA APLIKASI',
    '',
    `📅 Tanggal Backup: ${new Date().toLocaleString('id-ID')}`,
    '',
    '📊 ISI BACKUP:',
    `   • ${customers.length} Pelanggan`,
    `   • ${services.length} Layanan`,
    `   • ${inventory.length} Item Inventori`,
    `   • ${assets.length} Aset`,
    `   • ${expenses.length} Pengeluaran`,
    `   • ${transactions.length} Transaksi`,
    '',
    '⚠️ PENTING:',
    '',
    '   • File ini berisi SEMUA data aplikasi Anda',
    '   • Simpan file ini di tempat yang AMAN',
    '   • Jangan share file ini karena berisi data sensitif',
    '   • Gunakan untuk disaster recovery atau migrasi sistem',
    '',
    '📥 CARA RESTORE:',
    '',
    '   1. Buka aplikasi → Menu "Backup & Restore"',
    '   2. Klik "Import Full Backup"',
    '   3. Pilih file backup ini',
    '   4. Sistem akan restore semua data',
    '',
    '💡 TIPS:',
    '',
    '   • Backup data secara berkala (mingguan/bulanan)',
    '   • Simpan di cloud storage (Google Drive, OneDrive)',
    '   • Buat nama file yang jelas dengan tanggal',
    '   • Test restore di environment testing dulu',
  ];

  infoData.forEach((text, index) => {
    const row = infoSheet.getRow(index + 2);
    row.getCell(1).value = text;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };

    if (text.includes('💾') || text.includes('📊') || text.includes('📥') || text.includes('💡')) {
      row.font = { bold: true, size: 12, color: { argb: 'FF2563EB' } };
    } else if (text.includes('⚠️')) {
      row.font = { bold: true, size: 12, color: { argb: 'FFEF4444' } };
    }
  });

  // Sheet 2: Customers
  const customerSheet = workbook.addWorksheet('👥 Pelanggan');
  customerSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama', key: 'name', width: 25 },
    { header: 'Nomor HP', key: 'phone', width: 20 },
    { header: 'Alamat', key: 'address', width: 40 },
    { header: 'Catatan', key: 'notes', width: 30 },
    { header: 'Store ID', key: 'storeId', width: 40 },
  ];
  customerSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  customerSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  customerSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  customerSheet.getRow(1).height = 25;
  customers.forEach((customer) => {
    customerSheet.addRow({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
      storeId: customer.storeId || '',
    });
  });

  // Sheet 3: Services
  const serviceSheet = workbook.addWorksheet('🧺 Layanan');
  serviceSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Layanan', key: 'name', width: 30 },
    { header: 'Kategori', key: 'category', width: 15 },
    { header: 'Jenis Cucian', key: 'washType', width: 15 },
    { header: 'Harga', key: 'price', width: 15 },
    { header: 'Unit', key: 'unit', width: 15 },
    { header: 'Durasi (hari)', key: 'durationDays', width: 15 },
    { header: 'Deskripsi', key: 'description', width: 40 },
    { header: 'Store ID', key: 'storeId', width: 40 },
  ];
  serviceSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  serviceSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  serviceSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  serviceSheet.getRow(1).height = 25;
  services.forEach((service) => {
    serviceSheet.addRow({
      id: service.id,
      name: service.name,
      category: service.category,
      washType: service.washType || 'Pakaian',
      price: service.price,
      unit: service.unit,
      durationDays: service.durationDays,
      description: '', // description not in interface
      storeId: service.storeId || '',
    });
  });
  serviceSheet.getColumn('E').numFmt = 'Rp #,##0';

  // Sheet 4: Inventory
  const inventorySheet = workbook.addWorksheet('📦 Inventaris');
  inventorySheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Item', key: 'name', width: 30 },
    { header: 'Stok', key: 'stock', width: 12 },
    { header: 'Min Stok Alert', key: 'lowStockThreshold', width: 18 },
    { header: 'Unit', key: 'unit', width: 20 },
    { header: 'Kategori', key: 'category', width: 20 },
    { header: 'Store ID', key: 'storeId', width: 40 },
  ];
  inventorySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  inventorySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  inventorySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  inventorySheet.getRow(1).height = 25;
  inventory.forEach((item) => {
    inventorySheet.addRow({
      id: item.id,
      name: item.name,
      stock: item.stock,
      lowStockThreshold: item.lowStockThreshold,
      unit: item.unit,
      category: '', // category not in interface
      storeId: item.storeId || '',
    });
  });

  // Sheet 5: Assets
  const assetSheet = workbook.addWorksheet('🏢 Aset');
  assetSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Aset', key: 'name', width: 30 },
    { header: 'Serial Number', key: 'serialNumber', width: 25 },
    { header: 'Tanggal Beli', key: 'purchaseDate', width: 15 },
    { header: 'Harga Beli', key: 'purchaseCost', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Store ID', key: 'storeId', width: 40 },
    { header: 'Riwayat Perawatan', key: 'maintenanceHistory', width: 50 },
  ];
  assetSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  assetSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  assetSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  assetSheet.getRow(1).height = 25;
  assets.forEach((asset) => {
    assetSheet.addRow({
      id: asset.id,
      name: asset.name,
      serialNumber: asset.serialNumber || '',
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString() : '',
      purchaseCost: asset.purchaseCost || 0,
      status: asset.status,
      storeId: asset.storeId || '',
      maintenanceHistory: JSON.stringify(asset.maintenanceHistory || []),
    });
  });
  assetSheet.getColumn('E').numFmt = 'Rp #,##0';

  // Sheet 6: Expenses
  const expenseSheet = workbook.addWorksheet('💰 Pengeluaran');
  expenseSheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Kategori', key: 'category', width: 20 },
    { header: 'Jumlah', key: 'amount', width: 15 },
    { header: 'Deskripsi', key: 'description', width: 40 },
    { header: 'Store ID', key: 'storeId', width: 40 },
  ];
  expenseSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  expenseSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  expenseSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  expenseSheet.getRow(1).height = 25;
  expenses.forEach((expense) => {
    expenseSheet.addRow({
      id: expense.id,
      date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      storeId: expense.storeId || '',
    });
  });
  expenseSheet.getColumn('D').numFmt = 'Rp #,##0';

  // Sheet 7: Transactions
  const transactionSheet = workbook.addWorksheet('🧾 Transaksi');
  transactionSheet.columns = [
    { header: 'ID Transaksi', key: 'id', width: 40 },
    { header: 'Kode Invoice', key: 'invoiceCode', width: 18 },
    { header: 'Tanggal', key: 'createdAt', width: 22 },
    { header: 'Customer ID', key: 'customerId', width: 40 },
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
    { header: 'Store ID', key: 'storeId', width: 40 },
    { header: 'Catatan', key: 'notes', width: 30 },
  ];
  transactionSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  transactionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  transactionSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  transactionSheet.getRow(1).height = 25;

  transactions.forEach((transaction) => {
    const services = transaction.items
      .map(
        (item: TransactionItem) =>
          `${item.serviceName} (${item.quantity} ${item.unit} × Rp ${item.price.toLocaleString('id-ID')})`,
      )
      .join(', ');

    transactionSheet.addRow({
      id: transaction.id,
      invoiceCode: transaction.invoiceCode || '-',
      createdAt: new Date(transaction.createdAt).toLocaleString('id-ID'),
      customerId: transaction.customerId,
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
      estimatedCompletionDate: transaction.estimatedCompletionDate
        ? typeof transaction.estimatedCompletionDate === 'object' &&
          transaction.estimatedCompletionDate !== null &&
          'toISOString' in transaction.estimatedCompletionDate
          ? (transaction.estimatedCompletionDate as Date).toISOString()
          : String(transaction.estimatedCompletionDate)
        : '',
      storeId: transaction.storeId || '',
      notes: transaction.notes || '-',
    });
  });

  const currencyColumns = ['F', 'G', 'H', 'I', 'L', 'M'];
  currencyColumns.forEach((col) => {
    transactionSheet.getColumn(col).numFmt = 'Rp #,##0';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, `full_backup_${timestamp}.xlsx`);
}

/**
 * Import all data from full backup Excel file
 */
export async function importAllData(file: File): Promise<{
  customers: Customer[];
  services: Service[];
  inventory: InventoryItem[];
  assets: Asset[];
  expenses: Expense[];
  transactions: Transaction[];
}> {
  const workbook = await createWorkbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  // Import Customers
  const customerSheet = workbook.getWorksheet('👥 Pelanggan');
  const customers: Customer[] = [];
  if (customerSheet) {
    // Baca kolom berdasarkan nama header, supaya backup lama (masih punya kolom
    // "Saldo Diskon") dan backup baru sama-sama bisa dipulihkan.
    const customerColumns = new Map<string, number>();
    customerSheet.getRow(1).eachCell((cell, colNumber) => {
      customerColumns.set(String(cell.value ?? '').trim(), colNumber);
    });
    const customerCell = (row: ExcelJS.Row, header: string, fallback: number) =>
      row.getCell(customerColumns.get(header) ?? fallback).value as string;

    customerSheet.eachRow((row, _rowNumber) => {
      if (_rowNumber > 1) {
        // Skip header
        const id = customerCell(row, 'ID', 1);
        const name = customerCell(row, 'Nama', 2);
        const phone = customerCell(row, 'Nomor HP', 3);
        const address = customerCell(row, 'Alamat', 4);
        const notes = customerCell(row, 'Catatan', 5);
        const storeId = customerCell(row, 'Store ID', 6);

        if (id && name) {
          // @ts-expect-error - Partial customer from Excel, missing createdAt
          customers.push({
            id,
            name,
            phone: phone || undefined,
            address: address || undefined,
            notes: notes || undefined,
            storeId: storeId || '',
          });
        }
      }
    });
  }

  // Import Services
  const serviceSheet = workbook.getWorksheet('🧺 Layanan');
  const services: Service[] = [];
  if (serviceSheet) {
    serviceSheet.eachRow((row, _rowNumber) => {
      if (_rowNumber > 1) {
        const id = row.getCell(1).value as string;
        const name = row.getCell(2).value as string;
        const category = row.getCell(3).value as ServiceCategory;
        const washType = (row.getCell(4).value as WashType) || 'Pakaian';
        const price = Number(row.getCell(5).value) || 0;
        const unit = row.getCell(6).value as string;
        const durationDays = Number(row.getCell(7).value) || 0;
        const description = row.getCell(8).value as string;
        const storeId = row.getCell(9).value as string;

        if (id && name && category && unit) {
          services.push({
            id,
            name,
            category,
            washType,
            price,
            unit,
            durationDays,
            storeId: storeId || '',
            // @ts-expect-error - isActive may not exist on Service
            isActive: true,
          });
        }
      }
    });
  }

  // Import Inventory
  const inventorySheet = workbook.getWorksheet('📦 Inventaris');
  const inventory: InventoryItem[] = [];
  if (inventorySheet) {
    inventorySheet.eachRow((row, _rowNumber) => {
      if (_rowNumber > 1) {
        const id = row.getCell(1).value as string;
        const name = row.getCell(2).value as string;
        const stock = Number(row.getCell(3).value) || 0;
        const lowStockThreshold = Number(row.getCell(4).value) || 0;
        const unit = row.getCell(5).value as string;
        const category = row.getCell(6).value as string; // Read category but dont use it yet as it is not in interface
        const storeId = row.getCell(7).value as string;

        if (id && name && unit && storeId) {
          inventory.push({
            id,
            name,
            stock,
            unit,
            lowStockThreshold,
            storeId,
          });
        }
      }
    });
  }

  // Import Assets
  const assetSheet = workbook.getWorksheet('🏢 Aset');
  const assets: Asset[] = [];
  if (assetSheet) {
    assetSheet.eachRow((row, _rowNumber) => {
      if (_rowNumber > 1) {
        const id = row.getCell(1).value as string;
        const name = row.getCell(2).value as string;
        const serialNumber = row.getCell(3).value as string;
        const purchaseDate = row.getCell(4).value as string;
        const purchaseCost = Number(row.getCell(5).value) || 0;
        const status = row.getCell(6).value as AssetStatus;
        const storeId = row.getCell(7).value as string;
        const maintenanceHistoryStr = row.getCell(8).value as string;

        let maintenanceHistory: MaintenanceLog[] = [];
        if (maintenanceHistoryStr) {
          try {
            const parsed = JSON.parse(maintenanceHistoryStr);
            if (Array.isArray(parsed)) {
              maintenanceHistory = parsed;
            }
          } catch (e) {
            console.warn('Failed to parse maintenance history', e);
          }
        }

        if (id && name && status && purchaseDate) {
          assets.push({
            id,
            name,
            serialNumber: serialNumber || undefined,
            status,
            // @ts-expect-error - purchaseDate type mismatch
            purchaseDate,
            purchaseCost,
            storeId: storeId || '',
            maintenanceHistory,
          });
        }
      }
    });
  }

  // Import Expenses
  const expenseSheet = workbook.getWorksheet('💰 Pengeluaran');
  const expenses: Expense[] = [];
  if (expenseSheet) {
    expenseSheet.eachRow((row, _rowNumber) => {
      if (_rowNumber > 1) {
        const id = row.getCell(1).value as string;
        const dateValue = row.getCell(2).value;
        const category = row.getCell(3).value as string;
        const amount = Number(row.getCell(4).value) || 0;
        const description = row.getCell(5).value as string;
        const storeId = row.getCell(6).value as string;

        if (id && description && category && dateValue) {
          // Convert date to Date object
          let dateObj: Date;
          if (dateValue instanceof Date) {
            dateObj = dateValue;
          } else if (typeof dateValue === 'string') {
            dateObj = new Date(dateValue);
          } else {
            dateObj = new Date();
          }

          expenses.push({
            id,
            description,
            amount,
            category,
            date: dateObj,
            storeId: storeId || '',
          });
        }
      }
    });
  }

  // Import Transactions
  const transactionSheet = workbook.getWorksheet('🧾 Transaksi');
  const transactions: Transaction[] = [];
  if (transactionSheet) {
    // Create a map of service names to IDs for quick lookup
    const serviceNameToIdMap = new Map<string, string>();
    services.forEach((service) => {
      serviceNameToIdMap.set(service.name.toLowerCase().trim(), service.id);
    });

    transactionSheet.eachRow((row, _rowNumber) => {
      if (_rowNumber > 1) {
        const id = row.getCell(1).value as string;
        const invoiceCode = row.getCell(2).value as string;
        const createdAt = row.getCell(3).value as string;
        const customerId = row.getCell(4).value as string;
        const servicesStr = row.getCell(5).value as string;
        const subtotal = Number(row.getCell(6).value) || 0;
        const discount = Number(row.getCell(7).value) || 0;
        const tax = Number(row.getCell(8).value) || 0;
        const total = Number(row.getCell(9).value) || 0;
        const orderStatus = row.getCell(10).value as string;
        const paymentStatus = row.getCell(11).value as string;
        const amountPaid = Number(row.getCell(12).value) || 0;
        const change = Number(row.getCell(13).value) || 0;
        const paymentMethod = row.getCell(14).value as string;
        const estimatedDateStr = row.getCell(15).value?.toString();
        const storeId = row.getCell(16).value as string;
        const notesStr = row.getCell(17).value?.toString();

        // Simple parsing for services string if needed, or fallback to empty array
        // "Service Name (qty unit × Rp price), ..."
        const items: TransactionItem[] = [];
        if (servicesStr) {
          const parts = servicesStr.split('), ');
          parts.forEach((part) => {
            const cleanPart = part.endsWith(')') ? part : part + ')';
            const match = cleanPart.match(
              /^(.+?)\s*\((\d+(?:\.\d+)?)\s*(.+?)\s*×\s*Rp\s*([\d,.]+)\)$/,
            );
            if (match) {
              const [_, name, qty, unit, priceStr] = match;
              const price = parseFloat(priceStr.replace(/\./g, '').replace(/,/g, ''));
              const serviceName = name.trim();
              const serviceNameLower = serviceName.toLowerCase();

              // Try to find service ID by name
              let serviceId = serviceNameToIdMap.get(serviceNameLower);

              // If not found, generate a new UUID for this service
              // This allows historical data with deleted services to still be imported
              if (!serviceId) {
                serviceId = crypto.randomUUID();
                // Add to map to ensure consistency within this import
                serviceNameToIdMap.set(serviceNameLower, serviceId);
                console.warn(
                  `Service "${serviceName}" not found in database, generated new UUID: ${serviceId}`,
                );
              }

              items.push({
                serviceId: serviceId,
                serviceName: serviceName,
                quantity: parseFloat(qty),
                unit: unit.trim(),
                price: price,
                subtotal: parseFloat(qty) * price,
              });
            }
          });
        }

        if (id && customerId && orderStatus && paymentStatus) {
          transactions.push({
            id,
            invoiceCode: invoiceCode || undefined,
            createdAt: new Date(createdAt),
            customerId,
            items,
            subtotal,
            discount,
            tax,
            total,
            orderStatus: orderStatus as OrderStatus,
            paymentStatus: paymentStatus as PaymentStatus,
            amountPaid,
            change,
            paymentMethod: (paymentMethod !== '-' ? paymentMethod : undefined) as
              | PaymentMethod
              | undefined,
            estimatedCompletionDate: estimatedDateStr || '',
            notes: notesStr || '',
            storeId: storeId || '',
            createdByUserId: '', // Cannot restore easily
          });
        }
      }
    });
  }

  return {
    customers,
    services,
    inventory,
    assets,
    expenses,
    transactions,
  };
}
