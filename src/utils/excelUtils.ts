import ExcelJS from 'exceljs';
import type {
  Customer,
  Service,
  InventoryItem,
  Asset,
  Expense,
  AssetStatus,
  ServiceCategory,
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
  const worksheet = workbook.addWorksheet('Customers');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama', key: 'name', width: 25 },
    { header: 'Nomor HP', key: 'phone', width: 20 },
    { header: 'Alamat', key: 'address', width: 40 },
    { header: 'Catatan', key: 'notes', width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add sample row
  worksheet.addRow({
    id: '(Kosongkan untuk data baru)',
    name: 'Contoh: John Doe',
    phone: '081234567890',
    address: 'Jl. Contoh No. 123',
    notes: 'Catatan pelanggan',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'template_customers.xlsx');
}

/**
 * Generate Excel template for services
 */
export async function downloadServiceTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Services');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Layanan', key: 'name', width: 30 },
    { header: 'Kategori', key: 'category', width: 15 },
    { header: 'Harga', key: 'price', width: 15 },
    { header: 'Unit', key: 'unit', width: 15 },
    { header: 'Estimasi (hari)', key: 'estimatedDays', width: 15 },
    { header: 'Deskripsi', key: 'description', width: 40 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add sample row
  worksheet.addRow({
    id: '(Kosongkan untuk data baru)',
    name: 'Cuci Kering Kiloan',
    category: 'Kiloan',
    price: 7000,
    unit: 'kg',
    estimatedDays: 3,
    description: 'Cuci kering tanpa setrika',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'template_services.xlsx');
}

/**
 * Generate Excel template for inventory
 */
export async function downloadInventoryTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Item', key: 'name', width: 30 },
    { header: 'Stok', key: 'stock', width: 12 },
    { header: 'Min Stok Alert', key: 'lowStockThreshold', width: 15 },
    { header: 'Unit', key: 'unit', width: 20 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add sample row
  worksheet.addRow({
    id: '(Kosongkan untuk data baru)',
    name: 'Detergen Attack',
    stock: 50,
    lowStockThreshold: 10,
    unit: 'kg',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'template_inventory.xlsx');
}

/**
 * Generate Excel template for assets
 */
export async function downloadAssetTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Assets');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Nama Aset', key: 'name', width: 30 },
    { header: 'Serial Number', key: 'serialNumber', width: 20 },
    { header: 'Tanggal Beli', key: 'purchaseDate', width: 15 },
    { header: 'Harga Beli', key: 'purchaseCost', width: 15 },
    { header: 'Status', key: 'status', width: 20 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add sample row
  worksheet.addRow({
    id: '(Kosongkan untuk data baru)',
    name: 'Mesin Cuci LG 10kg',
    serialNumber: 'LG-001',
    purchaseDate: '2024-01-15',
    purchaseCost: 5500000,
    status: 'Active',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'template_assets.xlsx');
}

/**
 * Generate Excel template for expenses
 */
export async function downloadExpenseTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Expenses');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 40 },
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Kategori', key: 'category', width: 20 },
    { header: 'Jumlah', key: 'amount', width: 15 },
    { header: 'Deskripsi', key: 'description', width: 40 },
    { header: 'Catatan', key: 'notes', width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add sample row
  worksheet.addRow({
    id: '(Kosongkan untuk data baru)',
    date: '2024-12-15',
    category: 'Pembelian Bahan',
    amount: 500000,
    description: 'Beli detergen',
    notes: 'Catatan tambahan',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(buffer, 'template_expenses.xlsx');
}
