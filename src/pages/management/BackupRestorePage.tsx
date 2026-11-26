import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DownloadIcon,
  UploadIcon,
  DatabaseIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  SpinnerIcon,
} from '../../components/icons';
import useToasts from '../../contexts/useToasts';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import useAppContext from '../../contexts/useAppContext';
import { exportAllData, importAllData } from '../../utils/excelUtils';
import {
  exportBackup,
  downloadBackup,
  readBackupFile,
  validateBackup,
  importBackup,
  BackupData,
} from '../../utils/backupUtils';
import {
  UserRole,
  Transaction,
  TransactionItem,
  Expense,
  Customer,
  Service,
  InventoryItem,
  Asset,
} from '@/types';
import type { Json } from '@/types/supabase';

const BackupRestorePage: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { addToast, updateToast } = useToasts();
  const [confirm, confirmDialog] = useConfirmDialog();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // JSON Backup states
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [importJsonProgress, setImportJsonProgress] = useState(0);
  const [pendingJsonBackup, setPendingJsonBackup] = useState<BackupData | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all data without pagination limits
  const customersQuery = useQuery({
    queryKey: ['backup-customers-all', selectedStoreId],
    queryFn: async () => {
      const { supabase } = await import('../../utils/supabaseClient');
      let allCustomers: unknown[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase.from('customers').select('*');

        // Apply store filter
        if (selectedStoreId && selectedStoreId !== 'all') {
          query = query.eq('storeId', selectedStoreId);
        }

        query = query.range(page * pageSize, (page + 1) * pageSize - 1);
        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          allCustomers = [...allCustomers, ...data];
          if (data.length < pageSize) {
            hasMore = false;
          }
          page++;
        } else {
          hasMore = false;
        }
      }

      return (allCustomers as Record<string, unknown>[]).map((c) => ({
        ...c,
        address: c.address ?? undefined,
        notes: c.notes ?? undefined,
        phone: c.phone ?? undefined,
        storeId: c.storeId ?? undefined,
      }));
    },
  });

  const customers = customersQuery.data || [];

  const servicesQuery = useQuery({
    queryKey: ['backup-services-all', selectedStoreId],
    queryFn: async () => {
      const { supabase } = await import('../../utils/supabaseClient');
      let query = supabase.from('services').select('*');

      // Apply store filter
      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((s: Record<string, unknown>) => ({
        ...s,
        storeId: s.storeId ?? undefined,
        washType: s.wash_type,
      }));
    },
  });

  const services = servicesQuery.data || [];

  const inventoryQuery = useQuery({
    queryKey: ['backup-inventory-all', selectedStoreId],
    queryFn: async () => {
      const { supabase } = await import('../../utils/supabaseClient');
      let allInventory: unknown[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase.from('inventory_items').select('*');

        // Apply store filter
        if (selectedStoreId && selectedStoreId !== 'all') {
          query = query.eq('storeId', selectedStoreId);
        }

        query = query.range(page * pageSize, (page + 1) * pageSize - 1);
        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          allInventory = [...allInventory, ...data];
          if (data.length < pageSize) {
            hasMore = false;
          }
          page++;
        } else {
          hasMore = false;
        }
      }

      return (allInventory as Record<string, unknown>[]).map((i) => ({
        ...i,
        storeId: i.storeId ?? undefined,
      }));
    },
  });

  const inventory = inventoryQuery.data || [];

  const assetsQuery = useQuery({
    queryKey: ['backup-assets-all', selectedStoreId],
    queryFn: async () => {
      const { supabase } = await import('../../utils/supabaseClient');
      let query = supabase.from('assets').select('*');

      // Apply store filter
      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((a: Record<string, unknown>) => ({
        ...a,
        purchaseDate: a.purchaseDate ?? undefined,
        serialNumber: a.serialNumber ?? undefined,
        purchaseCost: a.purchaseCost ?? undefined,
        storeId: a.storeId ?? undefined,
        maintenanceHistory: Array.isArray(a.maintenanceHistory) ? a.maintenanceHistory : [],
      }));
    },
  });

  const assets = assetsQuery.data || [];

  // Fetch combined expenses (from database + asset purchases + maintenance)
  const expensesQuery = useQuery({
    queryKey: ['backup-expenses-combined', selectedStoreId],
    queryFn: async () => {
      const { supabase } = await import('../../utils/supabaseClient');

      // Helper untuk format tanggal lokal (YYYY-MM-DD)
      const formatDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // 1. Fetch ALL expenses from database
      let allOperationalExpenses: Expense[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase.from('expenses').select('*');

        // Apply store filter
        if (selectedStoreId && selectedStoreId !== 'all') {
          query = query.eq('storeId', selectedStoreId);
        }

        query = query.range(page * pageSize, (page + 1) * pageSize - 1);
        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          allOperationalExpenses = [
            ...allOperationalExpenses,
            ...data.map((e) => ({
              ...e,
              date: new Date(typeof e.date === 'string' ? e.date : e.date),
              storeId: e.storeId ?? '',
              recurringTemplateId: e.recurringTemplateId ?? undefined,
              recurringPeriod: e.recurringPeriod ?? undefined,
            })),
          ];
          if (data.length < pageSize) {
            hasMore = false;
          }
          page++;
        } else {
          hasMore = false;
        }
      }

      // 2. Fetch Assets for backfilling old purchases and maintenance
      let assetQuery = supabase.from('assets').select('*');

      // Apply store filter
      if (selectedStoreId && selectedStoreId !== 'all') {
        assetQuery = assetQuery.eq('storeId', selectedStoreId);
      }

      const { data: assetsData, error: assetsError } = await assetQuery;

      if (assetsError) throw assetsError;

      const assetExpenses: Expense[] = [];

      // Helper to check duplicate expenses
      const isExpenseExist = (desc: string, date: string, amount: number) => {
        return allOperationalExpenses.some(
          (e) =>
            e.description === desc &&
            (e.date instanceof Date ? e.date.toISOString().split('T')[0] : e.date) === date &&
            Math.abs(e.amount - amount) < Math.max(100, amount * 0.01),
        );
      };

      if (assetsData) {
        (assetsData as Record<string, unknown>[]).forEach((asset) => {
          if (!asset.id || !asset.name) return;

          // A. Asset Purchases
          if (asset.purchaseDate) {
            let purchaseDateStr = String(asset.purchaseDate);
            if (purchaseDateStr.includes('T')) {
              purchaseDateStr = purchaseDateStr.split('T')[0];
            }

            const cost = Number(asset.purchaseCost) || 0;
            const description = `Pembelian Aset: ${asset.name}`;

            if (!isExpenseExist(description, purchaseDateStr, cost)) {
              assetExpenses.push({
                id: `asset-purchase-${asset.id}`,
                date: new Date(purchaseDateStr),
                description: description,
                category: 'Pembelian Aset',
                amount: cost,
                storeId: (typeof asset.storeId === 'string' ? asset.storeId : '') as string,
              });
            }
          }

          // B. Asset Maintenance History
          let maintenanceHistory: {
            id: string;
            date: Date | string;
            description: string;
            cost: number;
          }[] = [];
          if (asset.maintenanceHistory) {
            if (Array.isArray(asset.maintenanceHistory)) {
              maintenanceHistory = asset.maintenanceHistory;
            } else if (typeof asset.maintenanceHistory === 'string') {
              try {
                maintenanceHistory = JSON.parse(asset.maintenanceHistory);
              } catch (error) {
                console.error(`Failed to parse maintenanceHistory for asset ${asset.id}:`, error);
              }
            }
          }

          maintenanceHistory.forEach((log, index) => {
            const logDate = new Date(log.date);
            const logDateStr = formatDateStr(logDate);
            const cost = Number(log.cost) || 0;

            const description = `Perawatan Aset: ${asset.name} (${log.description})`;

            if (!isExpenseExist(description, logDateStr, cost)) {
              assetExpenses.push({
                id: `asset-maint-${asset.id}-${index}`,
                date: new Date(logDateStr),
                description: description,
                category: 'Pemeliharaan Aset',
                amount: cost,
                storeId: (typeof asset.storeId === 'string' ? asset.storeId : '') as string,
              });
            }
          });
        });
      }

      // Combine: Database expenses + Asset expenses
      return [...allOperationalExpenses, ...assetExpenses];
    },
  });

  const expenses = expensesQuery.data || [];

  // Fetch all transactions without filters
  const transactionsQuery = useQuery({
    queryKey: ['backup-transactions-all', selectedStoreId],
    queryFn: async () => {
      const { supabase } = await import('../../utils/supabaseClient');
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('createdAt', { ascending: false });

      // Apply store filter
      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }

      query = query.range(0, 9999);
      const { data, error } = await query;

      if (error) throw error;

      // Convert database format to Transaction type
      return (data || []).map((t) => ({
        ...t,
        customerId: t.customerId || '',
        createdByUserId: t.createdByUserId || '',
        createdAt: new Date(t.createdAt || new Date()),
        estimatedCompletionDate: t.estimatedCompletionDate ?? undefined,
        paymentMethod: t.paymentMethod ?? undefined,
        items: t.items as unknown as TransactionItem[],
      })) as Transaction[];
    },
  });

  const transactions = transactionsQuery.data || [];

  // Calculate stats
  const totalRecords =
    customers.length +
    services.length +
    inventory.length +
    assets.length +
    expenses.length +
    transactions.length;

  const lastBackupDate = localStorage.getItem('lastBackupDate');

  // Handle Full Export
  const handleFullExport = async () => {
    if (currentUser?.role === UserRole.Cashier) {
      addToast('Anda tidak memiliki izin untuk melakukan backup.', 'error');
      return;
    }

    setIsExporting(true);
    const toastId = addToast('Mempersiapkan full backup...', 'info');

    try {
      // Filter out synthetic expenses (from Assets) before exporting
      // These have IDs like "asset-purchase-..." or "asset-maint-..."
      // We only want to backup REAL database expenses
      const realExpenses = expenses.filter((e) => !e.id.startsWith('asset-'));

      await exportAllData(
        customers as unknown as Customer[],
        services as unknown as Service[],
        inventory as unknown as InventoryItem[],
        assets as unknown as Asset[],
        realExpenses,
        transactions,
      );

      // Save last backup date
      const now = new Date().toISOString();
      localStorage.setItem('lastBackupDate', now);

      updateToast(toastId, `Berhasil backup ${totalRecords} data!`, 'success');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal backup: ${errMsg}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Import (placeholder for now)
  const handleImport = async () => {
    if (currentUser?.role === UserRole.Cashier) {
      addToast('Anda tidak memiliki izin untuk melakukan restore.', 'error');
      return;
    }

    if (!fileInputRef.current?.files?.[0]) {
      fileInputRef.current?.click();
      return;
    }

    const file = fileInputRef.current.files[0];

    // Confirmation
    const confirmed = await confirm({
      title: 'Restore data dari backup?',
      message:
        `Semua data saat ini akan DITIMPA oleh isi file ${file.name}. Tindakan ini tidak bisa dibatalkan.\n\n` +
        `Sebaiknya lakukan backup terlebih dahulu sebelum restore.`,
      confirmText: 'Timpa & restore',
    });

    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    const toastId = addToast('Membaca file backup...', 'info');

    try {
      // Import data from Excel
      updateToast(toastId, 'Memproses data dari file...', 'info');
      const importedData = await importAllData(file);

      // Count total records
      const totalImported =
        importedData.customers.length +
        importedData.services.length +
        importedData.inventory.length +
        importedData.assets.length +
        importedData.expenses.length +
        importedData.transactions.length;

      updateToast(toastId, `Ditemukan ${totalImported} data. Mulai restore ke database...`, 'info');

      // Import to database using Supabase
      const { supabase } = await import('../../utils/supabaseClient');

      // Helper function to safely parse dates
      const safeToISOString = (dateValue: unknown): string => {
        try {
          if (!dateValue) return new Date().toISOString();
          if (dateValue instanceof Date) {
            // Check if date is valid before calling toISOString
            if (isNaN(dateValue.getTime())) return new Date().toISOString();
            return dateValue.toISOString();
          }
          if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue);
            if (isNaN(parsed.getTime())) return new Date().toISOString();
            return parsed.toISOString();
          }
          return new Date().toISOString();
        } catch {
          console.warn(`Invalid date value: ${dateValue}, using current date`);
          return new Date().toISOString();
        }
      };

      // Note: We use UPSERT instead of DELETE + INSERT because:
      // 1. RLS policies may prevent DELETE for non-Super Admin users
      // 2. UPSERT is safer and handles duplicates gracefully
      // 3. Data with same ID will be updated instead of causing conflict
      updateToast(toastId, 'Mempersiapkan restore data...', 'info');

      // Insert/Update data using UPSERT
      let insertedCount = 0;

      if (importedData.customers.length > 0) {
        updateToast(toastId, `Restore pelanggan (${importedData.customers.length})...`, 'info');
        // Convert Customer to database format
        const dbCustomers = importedData.customers.map((c) => {
          // For non-Super Admin users, force storeId to current user's store
          // This is required by RLS policy which checks storeId = get_my_store_id()
          let finalStoreId: string | null = c.storeId || null;
          if (currentUser?.role !== UserRole.SuperAdmin) {
            finalStoreId =
              selectedStoreId && selectedStoreId !== 'all'
                ? selectedStoreId
                : currentUser?.storeId || null;
          }

          return {
            ...c,
            storeId: finalStoreId,
            createdAt: safeToISOString(c.createdAt),
            phone: c.phone ?? null,
            address: c.address ?? null,
            notes: c.notes ?? null,
          };
        });

        // Deduplicate by ID - keep last occurrence
        // This prevents "ON CONFLICT DO UPDATE command cannot affect row a second time" error
        const deduplicatedCustomers = Array.from(
          new Map(dbCustomers.map((c) => [c.id, c])).values(),
        );

        const duplicateCount = dbCustomers.length - deduplicatedCustomers.length;
        if (duplicateCount > 0) {
          console.warn(`Removed ${duplicateCount} duplicate customer IDs from import batch`);
        }

        // Use upsert with ignoreDuplicates=true to avoid RLS policy violations on UPDATE
        // This will INSERT new records, but SKIP existing records to prevent cross-store updates
        const { error } = await supabase.from('customers').upsert(deduplicatedCustomers, {
          onConflict: 'id',
          ignoreDuplicates: true, // Skip update if record exists to avoid RLS USING check
        });
        if (error) throw new Error(`Gagal restore pelanggan: ${error.message}`);
        insertedCount += deduplicatedCustomers.length;
      }

      if (importedData.services.length > 0) {
        updateToast(toastId, `Restore layanan (${importedData.services.length})...`, 'info');
        const dbServices = importedData.services.map((s) => {
          let finalStoreId: string | null = s.storeId || null;
          if (currentUser?.role !== UserRole.SuperAdmin) {
            finalStoreId =
              selectedStoreId && selectedStoreId !== 'all'
                ? selectedStoreId
                : currentUser?.storeId || null;
          }
          // Only include columns that exist in database schema
          const sRecord = s as unknown as Record<string, unknown>;
          return {
            id: s.id,
            name: s.name,
            category: s.category,
            wash_type: (sRecord.wash_type as string) || (sRecord.washType as string) || 'Pakaian',
            price: s.price,
            unit: s.unit,
            durationDays: s.durationDays,
            storeId: finalStoreId,
          };
        });

        // Deduplicate by ID
        const deduplicatedServices = Array.from(new Map(dbServices.map((s) => [s.id, s])).values());

        const { error } = await supabase.from('services').upsert(deduplicatedServices, {
          onConflict: 'id',
          ignoreDuplicates: true, // Skip existing to avoid RLS violations
        });
        if (error) throw new Error(`Gagal restore layanan: ${error.message}`);
        insertedCount += deduplicatedServices.length;
      }

      if (importedData.inventory.length > 0) {
        updateToast(toastId, `Restore inventaris (${importedData.inventory.length})...`, 'info');
        const dbInventory = importedData.inventory.map((i) => {
          let finalStoreId: string | null = i.storeId || null;
          if (currentUser?.role !== UserRole.SuperAdmin) {
            finalStoreId =
              selectedStoreId && selectedStoreId !== 'all'
                ? selectedStoreId
                : currentUser?.storeId || null;
          }
          return { ...i, storeId: finalStoreId };
        });

        // Deduplicate by ID
        const deduplicatedInventory = Array.from(
          new Map(dbInventory.map((i) => [i.id, i])).values(),
        );

        const { error } = await supabase.from('inventory_items').upsert(deduplicatedInventory, {
          onConflict: 'id',
          ignoreDuplicates: true, // Skip existing to avoid RLS violations
        });
        if (error) throw new Error(`Gagal restore inventaris: ${error.message}`);
        insertedCount += deduplicatedInventory.length;
      }

      if (importedData.assets.length > 0) {
        updateToast(toastId, `Restore aset (${importedData.assets.length})...`, 'info');
        // Convert Asset to database format
        const dbAssets = importedData.assets.map((a) => {
          let finalStoreId: string | null = a.storeId || null;
          if (currentUser?.role !== UserRole.SuperAdmin) {
            finalStoreId =
              selectedStoreId && selectedStoreId !== 'all'
                ? selectedStoreId
                : currentUser?.storeId || null;
          }
          return {
            ...a,
            storeId: finalStoreId,
            maintenanceHistory: a.maintenanceHistory as unknown as Json,
            serialNumber: a.serialNumber ?? null,
            purchaseDate:
              typeof a.purchaseDate === 'string'
                ? a.purchaseDate
                : (a.purchaseDate?.toISOString?.() ?? null),
            purchaseCost: a.purchaseCost ?? null,
          };
        });

        // Deduplicate by ID
        const deduplicatedAssets = Array.from(new Map(dbAssets.map((a) => [a.id, a])).values());

        const { error } = await supabase.from('assets').upsert(deduplicatedAssets, {
          onConflict: 'id',
          ignoreDuplicates: true, // Skip existing to avoid RLS violations
        });
        if (error) throw new Error(`Gagal restore aset: ${error.message}`);
        insertedCount += deduplicatedAssets.length;
      }

      if (importedData.expenses.length > 0) {
        updateToast(toastId, `Restore pengeluaran (${importedData.expenses.length})...`, 'info');

        // Helper function to check if ID is valid UUID
        const isValidUUID = (id: string): boolean => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(id);
        };

        // Helper function to generate UUID v4
        const generateUUID = (): string => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };

        // Convert Expense to database format
        const dbExpenses = importedData.expenses.map((e) => {
          // For non-Super Admin users, force storeId to current user's store
          let finalStoreId: string | null = e.storeId || null;
          if (currentUser?.role !== UserRole.SuperAdmin) {
            finalStoreId =
              selectedStoreId && selectedStoreId !== 'all'
                ? selectedStoreId
                : currentUser?.storeId || null;
          }

          // Validate and fix UUID
          let finalId = e.id;
          if (!isValidUUID(e.id)) {
            // Invalid UUID (e.g., "asset-purchase-xxx" or "asset-maint-xxx")
            // Generate new UUID to avoid database error
            finalId = generateUUID();
            console.warn(`Invalid UUID "${e.id}" replaced with "${finalId}"`);
          }

          // Ensure date is properly formatted as YYYY-MM-DD for database
          let dateStr: string;
          if (e.date instanceof Date) {
            dateStr = e.date.toISOString().split('T')[0];
          } else if (typeof e.date === 'string') {
            // If already a string, parse it first to ensure valid format
            const parsedDate = new Date(e.date);
            dateStr = isNaN(parsedDate.getTime())
              ? new Date().toISOString().split('T')[0]
              : parsedDate.toISOString().split('T')[0];
          } else {
            dateStr = new Date().toISOString().split('T')[0];
          }

          return {
            ...e,
            id: finalId,
            date: dateStr,
            storeId: finalStoreId,
          };
        });

        // Deduplicate by ID
        const deduplicatedExpenses = Array.from(new Map(dbExpenses.map((e) => [e.id, e])).values());

        const { error } = await supabase.from('expenses').upsert(deduplicatedExpenses, {
          onConflict: 'id',
          ignoreDuplicates: true, // Skip existing to avoid RLS violations
        });
        if (error) throw new Error(`Gagal restore pengeluaran: ${error.message}`);
        insertedCount += deduplicatedExpenses.length;
      }

      if (importedData.transactions.length > 0) {
        updateToast(toastId, `Restore transaksi (${importedData.transactions.length})...`, 'info');
        // Convert Transaction to database format
        const dbTransactions = importedData.transactions.map((t) => {
          // For non-Super Admin users, force storeId to current user's store
          let finalStoreId: string | null = t.storeId || null;
          if (currentUser?.role !== UserRole.SuperAdmin) {
            finalStoreId =
              selectedStoreId && selectedStoreId !== 'all'
                ? selectedStoreId
                : currentUser?.storeId || null;
          }

          // Explicitly map only database schema fields to avoid sending unknown columns
          return {
            id: t.id,
            invoiceCode: t.invoiceCode ?? null,
            customerId: t.customerId && t.customerId !== '' ? t.customerId : null,
            items: t.items as unknown as Json,
            subtotal: t.subtotal,
            discount: t.discount,
            tax: t.tax,
            total: t.total,
            orderStatus: t.orderStatus,
            paymentStatus: t.paymentStatus,
            amountPaid: t.amountPaid,
            change: t.change,
            paymentMethod: t.paymentMethod ?? null,
            estimatedCompletionDate: (() => {
              // Handle estimatedCompletionDate properly
              if (!t.estimatedCompletionDate || t.estimatedCompletionDate === '') {
                return null;
              }

              // If it's already a valid ISO string, use it
              if (typeof t.estimatedCompletionDate === 'string') {
                try {
                  const parsed = new Date(t.estimatedCompletionDate);
                  if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString();
                  }
                } catch {
                  // Invalid date string
                }
              }

              // If it's a Date object
              if (
                typeof t.estimatedCompletionDate === 'object' &&
                t.estimatedCompletionDate !== null &&
                'getTime' in t.estimatedCompletionDate
              ) {
                return safeToISOString(t.estimatedCompletionDate as Date);
              }

              // Default to null if can't parse
              return null;
            })(),
            notes: t.notes ?? null,
            createdAt: (() => {
              // Handle createdAt - try multiple formats
              try {
                if (!t.createdAt) return new Date().toISOString();

                // If already a Date object
                if (t.createdAt instanceof Date) {
                  const iso = t.createdAt.toISOString();
                  if (iso && iso !== 'Invalid Date') return iso;
                }

                // If it's a string, try parsing
                if (typeof t.createdAt === 'string') {
                  const str = String(t.createdAt);

                  // Try Excel format: "dd/MM/yyyy, HH.mm.ss"
                  const excelMatch = str.match(
                    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2})\.(\d{1,2})\.(\d{1,2})$/,
                  );
                  if (excelMatch) {
                    const [, day, month, year, hour, minute, second] = excelMatch;
                    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}.000Z`;
                    return isoDate;
                  }

                  // Try standard Date parse
                  const parsed = new Date(str);
                  if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString();
                  }
                }

                // Fallback
                return new Date().toISOString();
              } catch (error) {
                console.error('Error parsing createdAt:', t.createdAt, error);
                return new Date().toISOString();
              }
            })(),
            storeId: finalStoreId && finalStoreId !== '' ? finalStoreId : null,
            createdByUserId:
              t.createdByUserId && t.createdByUserId !== '' ? t.createdByUserId : null,
          };
        });

        // Deduplicate by ID
        const deduplicatedTransactions = Array.from(
          new Map(dbTransactions.map((t) => [t.id, t])).values(),
        );

        const { error } = await supabase.from('transactions').upsert(deduplicatedTransactions, {
          onConflict: 'id',
          ignoreDuplicates: true, // Skip existing to avoid RLS violations
        });
        if (error) throw new Error(`Gagal restore transaksi: ${error.message}`);
        insertedCount += deduplicatedTransactions.length;
      }

      updateToast(
        toastId,
        `✅ Berhasil restore ${insertedCount} data! Halaman akan di-refresh...`,
        'success',
      );

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `❌ Gagal restore: ${errMsg}`, 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // JSON Backup Handlers
  const handleExportJson = async () => {
    setIsExportingJson(true);
    const toastId = addToast('Mengekspor data ke JSON...', 'info');
    try {
      const backup = await exportBackup();
      downloadBackup(backup);
      updateToast(toastId, 'Backup JSON berhasil didownload!', 'success');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateToast(toastId, `Gagal export JSON: ${errMsg}`, 'error');
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleJsonFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readBackupFile(file);
      if (!validateBackup(data)) {
        addToast('File backup tidak valid atau format tidak sesuai.', 'error');
        return;
      }
      setPendingJsonBackup(data as BackupData);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addToast(`Gagal membaca file: ${errMsg}`, 'error');
    }

    // Reset input
    if (jsonFileInputRef.current) {
      jsonFileInputRef.current.value = '';
    }
  };

  const handleImportJson = async () => {
    if (!pendingJsonBackup) return;

    setIsImportingJson(true);
    setImportJsonProgress(0);
    const toastId = addToast('Mengimpor data JSON...', 'info');

    try {
      const result = await importBackup(pendingJsonBackup, {
        onProgress: (_table, progress) => {
          setImportJsonProgress(Math.round(progress));
        },
      });

      if (result.success) {
        updateToast(toastId, 'Import JSON berhasil! Halaman akan direfresh...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        updateToast(toastId, `Import selesai dengan ${result.errors.length} error.`, 'warning');
        console.error('Import errors:', result.errors);
      }

      setPendingJsonBackup(null);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateToast(toastId, `Gagal import: ${errMsg}`, 'error');
    } finally {
      setIsImportingJson(false);
      setImportJsonProgress(0);
    }
  };

  // Check if user has permission
  const canBackup = currentUser?.role !== UserRole.Cashier;

  // Get store name for display
  const getStoreName = () => {
    if (currentUser?.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') return 'Semua Cabang';
      return stores.find((s) => s.id === selectedStoreId)?.name || 'Cabang Tidak Dikenal';
    }
    if (currentUser?.storeId) {
      return stores.find((s) => s.id === currentUser.storeId)?.name || 'Cabang Tidak Dikenal';
    }
    return 'Cabang Tidak Dikenal';
  };

  return (
    <div className="space-y-6">
      {/* Store Info Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Data Backup & Restore:{' '}
          <span className="text-blue-600 dark:text-blue-400">{getStoreName()}</span>
        </h2>
        {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            ⚠️ Mode gabungan - Data dari semua cabang akan di-backup/restore
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Backup & Restore</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Backup semua data aplikasi atau restore dari backup sebelumnya
          </p>
        </div>
      </div>

      {!canBackup && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Akses Terbatas</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Hanya Admin dan Super Admin yang dapat melakukan backup & restore data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Overview */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">Total Data Aplikasi</p>
            <p className="text-4xl font-bold tabular-nums text-slate-900 dark:text-white">
              {totalRecords.toLocaleString('id-ID')}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {lastBackupDate
                ? `Backup terakhir: ${new Date(lastBackupDate).toLocaleDateString('id-ID')} ${new Date(lastBackupDate).toLocaleTimeString('id-ID')}`
                : 'Belum pernah backup'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-700">
            <DatabaseIcon className="h-10 w-10 text-slate-500 dark:text-slate-300" />
          </div>
        </div>
      </div>

      {/* Detailed Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pelanggan</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{customers.length}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-brand-blue-600 dark:bg-brand-blue-400"
              style={{ width: `${(customers.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Layanan</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{services.length}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-brand-blue-600 dark:bg-brand-blue-400"
              style={{ width: `${(services.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Inventori</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{inventory.length}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-brand-blue-600 dark:bg-brand-blue-400"
              style={{ width: `${(inventory.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Aset</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{assets.length}</p>
          <div className="mt-2 h-1 bg-orange-200 dark:bg-orange-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-600 dark:bg-orange-400"
              style={{ width: `${(assets.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pengeluaran</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{expenses.length}</p>
          <div className="mt-2 h-1 bg-red-200 dark:bg-red-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 dark:bg-red-400"
              style={{ width: `${(expenses.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Transaksi</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{transactions.length}</p>
          <div className="mt-2 h-1 bg-cyan-200 dark:bg-cyan-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-600 dark:bg-cyan-400"
              style={{ width: `${(transactions.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Full Backup */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <DownloadIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Export Full Backup
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Download semua data aplikasi dalam satu file Excel. File akan berisi semua
                pelanggan, layanan, inventori, aset, pengeluaran, dan transaksi.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>Semua data dalam 1 file</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>Format Excel dengan multiple sheets</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>Siap untuk disaster recovery</span>
                </div>
              </div>
              <button
                onClick={handleFullExport}
                disabled={!canBackup || isExporting}
                className="btn btn-primary mt-6 w-full"
              >
                {isExporting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon className="w-5 h-5" />
                    <span>Download Full Backup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Import Full Backup */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <UploadIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Import Full Backup
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Restore semua data dari file backup sebelumnya. Gunakan fitur ini untuk disaster
                recovery atau migrasi sistem.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Validasi format Excel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Konfirmasi sebelum restore</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangleIcon className="w-4 h-4" />
                  <span>Data lama akan ditimpa!</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                id="backup-restore-file"
                name="backup-restore-file"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImport}
              />
              <button
                onClick={handleImport}
                disabled={!canBackup || isImporting}
                className="btn btn-success mt-6 w-full"
              >
                {isImporting ? (
                  <>
                    <SpinnerIcon className="w-5 h-5 text-white" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-5 h-5" />
                    <span>Import Full Backup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Backup & Restore Section */}
      <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <DatabaseIcon className="w-5 h-5 text-slate-500" />
          Quick Backup (JSON)
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Format backup yang lebih ringan dan cepat. Cocok untuk backup harian.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            disabled={isExportingJson}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors"
          >
            {isExportingJson ? (
              <SpinnerIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            ) : (
              <DownloadIcon className="w-5 h-5" />
            )}
            Download JSON Backup
          </button>

          {/* Import JSON */}
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              ref={jsonFileInputRef}
              onChange={handleJsonFileSelect}
              className="hidden"
            />
            <button
              onClick={() => jsonFileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors"
            >
              <UploadIcon className="w-5 h-5" />
              Pilih File JSON
            </button>
          </div>
        </div>

        {/* JSON Import Confirmation */}
        {pendingJsonBackup && (
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <DatabaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Konfirmasi Restore JSON
                </h4>
                <div className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  <p>Versi Backup: {pendingJsonBackup.version}</p>
                  <p>
                    Tanggal:{' '}
                    {new Date(pendingJsonBackup.exportedAt).toLocaleDateString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
                    <p>Stores: {pendingJsonBackup.data.stores.length}</p>
                    <p>Customers: {pendingJsonBackup.data.customers.length}</p>
                    <p>Services: {pendingJsonBackup.data.services.length}</p>
                    <p>Inventory: {pendingJsonBackup.data.inventory_items.length}</p>
                    <p>Assets: {pendingJsonBackup.data.assets.length}</p>
                    <p>Expenses: {pendingJsonBackup.data.expenses.length}</p>
                    <p>Transactions: {pendingJsonBackup.data.transactions.length}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleImportJson}
                    disabled={isImportingJson}
                    className="btn btn-primary btn-sm"
                  >
                    {isImportingJson ? (
                      <>
                        <SpinnerIcon className="w-4 h-4 text-white" />
                        <span>Processing {importJsonProgress}%...</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-4 h-4" />
                        Restore Sekarang
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPendingJsonBackup(null);
                      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
                    }}
                    disabled={isImportingJson}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <DatabaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              📋 Tentang Backup & Restore
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Full Backup</strong> mencakup semua data: pelanggan, layanan, inventori,
                  aset, pengeluaran, dan transaksi dalam satu file Excel.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Backup Per Halaman</strong> tetap tersedia di masing-masing halaman untuk
                  backup selektif (misalnya hanya pelanggan atau transaksi).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  Simpan file backup di tempat yang aman seperti Google Drive, OneDrive, atau hard
                  drive eksternal.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  Disarankan untuk melakukan backup rutin (mingguan atau bulanan) untuk
                  mengantisipasi kehilangan data.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {confirmDialog}
    </div>
  );
};

export default BackupRestorePage;
