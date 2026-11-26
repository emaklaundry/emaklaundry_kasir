import { useCallback } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AuditLog } from '../types';
import { supabase } from '../utils/supabaseClient';
import { trackAudit, AuditCategory } from '../utils/auditTracker';
import useAppContext from './useAppContext';

/**
 * Pencatat log audit untuk aksi bisnis.
 * Tidak mengambil data log apa pun — halaman yang hanya perlu mencatat tidak
 * lagi ikut mengunduh seluruh tabel audit_logs.
 */
export function useAuditLogs() {
  const { currentUser } = useAppContext();

  const addAuditLog = useCallback(
    (action: string, storeId?: string, metadata?: Record<string, unknown>) => {
      if (!currentUser) return;
      trackAudit(
        {
          action,
          category: 'aktivitas',
          storeId: storeId || currentUser.storeId || null,
          metadata,
        },
        { immediate: true },
      );
    },
    [currentUser],
  );

  const logActivity = useCallback(
    (action: string, category: AuditCategory = 'aktivitas', metadata?: Record<string, unknown>) => {
      if (!currentUser) return;
      trackAudit({ action, category, metadata });
    },
    [currentUser],
  );

  return { addAuditLog, logActivity };
}

export interface AuditLogQuery {
  page: number;
  pageSize: number;
  search: string;
  category: AuditCategory | 'all';
  startDate: string;
  endDate: string;
  /** 'all' = semua cabang (hanya Super Admin); undefined = tanpa filter cabang */
  storeId?: string;
  sortKey: 'timestamp' | 'user';
  sortDirection: 'ascending' | 'descending';
}

interface AuditLogRow {
  id: number;
  timestamp: string | null;
  user: string | null;
  action: string | null;
  storeId: string | null;
  category: string | null;
  table_name: string | null;
  record_id: string | null;
  operation: string | null;
  changed_fields: string[] | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  page: string | null;
  metadata: Record<string, unknown> | null;
}

/** Hapus karakter yang punya arti khusus di filter PostgREST `.or()`. */
const sanitizeSearch = (value: string) => value.replace(/[,()%*\\]/g, ' ').trim();

export const toAuditLog = (log: AuditLogRow): AuditLog => ({
  id: String(log.id),
  timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
  user: log.user || 'Unknown',
  action: log.action || 'Unknown Action',
  storeId: log.storeId || undefined,
  category: (log.category as AuditCategory) || 'aktivitas',
  tableName: log.table_name || undefined,
  recordId: log.record_id || undefined,
  operation: log.operation || undefined,
  changedFields: log.changed_fields || undefined,
  oldData: log.old_data || undefined,
  newData: log.new_data || undefined,
  page: log.page || undefined,
  metadata: log.metadata || undefined,
});

/** Daftar log audit dengan paginasi, filter & urutan di server. */
export function useAuditLogList(params: AuditLogQuery) {
  const { currentUser } = useAppContext();

  return useQuery({
    queryKey: ['audit_logs', params],
    enabled: !!currentUser,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: params.page === 1 ? 30_000 : false,
    queryFn: async () => {
      let query = supabase.from('audit_logs').select('*', { count: 'exact' });

      if (params.storeId && params.storeId !== 'all') {
        query = query.eq('storeId', params.storeId);
      }
      if (params.category !== 'all') {
        query = query.eq('category', params.category);
      }
      const search = sanitizeSearch(params.search);
      if (search) {
        query = query.or(`user.ilike.*${search}*,action.ilike.*${search}*`);
      }
      if (params.startDate) {
        query = query.gte('timestamp', new Date(`${params.startDate}T00:00:00`).toISOString());
      }
      if (params.endDate) {
        query = query.lte('timestamp', new Date(`${params.endDate}T23:59:59.999`).toISOString());
      }

      const from = (params.page - 1) * params.pageSize;
      const { data, error, count } = await query
        .order(params.sortKey, { ascending: params.sortDirection === 'ascending' })
        .order('id', { ascending: params.sortDirection === 'ascending' })
        .range(from, from + params.pageSize - 1);

      if (error) throw error;
      return {
        logs: ((data || []) as AuditLogRow[]).map(toAuditLog),
        total: count ?? 0,
      };
    },
  });
}
