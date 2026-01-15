/**
 * Backup Utility Functions
 * Export and import application data in JSON format
 */

import { supabase } from '@/utils/supabaseClient';

export interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    stores: unknown[];
    customers: unknown[];
    services: unknown[];
    transactions: unknown[];
    inventory_items: unknown[];
    expenses: unknown[];
    assets: unknown[];
    settings: unknown[];
    audit_logs: unknown[];
  };
}

/**
 * Export all data from Supabase to JSON format
 */
export async function exportBackup(): Promise<BackupData> {
  const tables = [
    'stores',
    'customers',
    'services',
    'transactions',
    'inventory_items',
    'expenses',
    'assets',
    'settings',
    'audit_logs',
  ];

  const data: Record<string, unknown[]> = {};

  for (const table of tables) {
    const { data: tableData, error } = await supabase.from(table).select('*');

    if (error) {
      console.error(`Error fetching ${table}:`, error);
      data[table] = [];
    } else {
      data[table] = tableData || [];
    }
  }

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: data as BackupData['data'],
  };
}

/**
 * Download backup as JSON file
 */
export function downloadBackup(backup: BackupData, filename?: string): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const defaultFilename = `backup_emaklaundry_${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate backup file structure
 */
export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;

  const backup = data as BackupData;

  if (!backup.version || !backup.exportedAt || !backup.data) {
    return false;
  }

  const requiredTables = [
    'stores',
    'customers',
    'services',
    'transactions',
    'inventory_items',
    'expenses',
    'assets',
    'settings',
  ];

  for (const table of requiredTables) {
    if (!Array.isArray(backup.data[table as keyof BackupData['data']])) {
      return false;
    }
  }

  return true;
}

/**
 * Import backup data to Supabase
 * WARNING: This will replace existing data!
 */
export async function importBackup(
  backup: BackupData,
  options: {
    skipExistingIds?: boolean;
    onProgress?: (table: string, progress: number) => void;
  } = {},
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { onProgress } = options;

  // Order matters for foreign key constraints
  const importOrder = [
    'settings',
    'stores',
    'customers',
    'services',
    'inventory_items',
    'assets',
    'expenses',
    'transactions',
    // 'audit_logs', // Skip audit logs on import
  ];

  const totalTables = importOrder.length;
  let completedTables = 0;

  for (const table of importOrder) {
    const tableData = backup.data[table as keyof BackupData['data']];

    if (!tableData || tableData.length === 0) {
      completedTables++;
      onProgress?.(table, (completedTables / totalTables) * 100);
      continue;
    }

    try {
      // For each record, try to upsert
      for (const record of tableData) {
        const { error } = await supabase
          .from(table)
          .upsert(record as never, { onConflict: 'id' });

        if (error) {
          errors.push(`${table}: ${error.message}`);
        }
      }
    } catch (err) {
      errors.push(`${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    completedTables++;
    onProgress?.(table, (completedTables / totalTables) * 100);
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Read JSON file and parse
 */
export function readBackupFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        resolve(data);
      } catch {
        reject(new Error('File bukan format JSON yang valid'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Get backup statistics
 */
export function getBackupStats(backup: BackupData): Record<string, number> {
  const stats: Record<string, number> = {};

  for (const [key, value] of Object.entries(backup.data)) {
    if (Array.isArray(value)) {
      stats[key] = value.length;
    }
  }

  return stats;
}
