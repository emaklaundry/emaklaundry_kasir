import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduledMaintenance } from '../types';
import { supabase } from '../utils/supabaseClient';
import { useAssets } from './AssetContext';
import { getLocalDateString, parseLocalDate } from '../utils/dateHelpers';

// Kolom DB bertipe DATE. Gunakan komponen tanggal LOKAL (bukan toISOString/UTC)
// agar tanggal tidak mundur sehari di zona WIB/WITA/WIT.
const toDbDate = (value: Date | string): string => getLocalDateString(value);
const fromDbDate = (value: string): Date =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseLocalDate(value) : new Date(value);

const fetchScheduledMaintenances = async (): Promise<ScheduledMaintenance[]> => {
  const { data, error } = await supabase.from('scheduled_maintenances').select('*');
  if (error) throw error;
  return (data || []).map((s) => ({
    ...s,
    assetId: s.assetId ?? undefined,
    lastCompletedDate: s.lastCompletedDate ? fromDbDate(s.lastCompletedDate) : null,
    nextDueDate: fromDbDate(s.nextDueDate),
  })) as ScheduledMaintenance[];
};

export function useScheduledMaintenances() {
  const { assets } = useAssets();
  const assetIdsInScope = useMemo(() => new Set(assets.map((a) => a.id)), [assets]);
  const queryClient = useQueryClient();
  const { data: allScheduledMaintenances = [], ...query } = useQuery({
    queryKey: ['scheduled_maintenances'],
    queryFn: fetchScheduledMaintenances,
  });

  const scheduledMaintenances = useMemo(
    () => allScheduledMaintenances.filter((sm) => assetIdsInScope.has(sm.assetId)),
    [allScheduledMaintenances, assetIdsInScope],
  );

  const addScheduledMaintenance = useMutation({
    mutationFn: async (sm: Omit<ScheduledMaintenance, 'id'>) => {
      // Convert Date to string and undefined to null for Supabase
      const dbSM = {
        ...sm,
        assetId: sm.assetId ?? null,
        nextDueDate: toDbDate(sm.nextDueDate),
        lastCompletedDate: sm.lastCompletedDate ? toDbDate(sm.lastCompletedDate) : null,
      };
      const { error } = await supabase.from('scheduled_maintenances').insert([dbSM]);
      if (error) throw error;
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled_maintenances'] }),
  });

  const updateScheduledMaintenance = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<ScheduledMaintenance> }) => {
      const { id, data } = variables;
      // Convert Date to string and undefined to null for Supabase
      const dbData: Record<string, unknown> = {};
      for (const key in data) {
        const value = (data as Record<string, unknown>)[key];
        if (value instanceof Date) {
          dbData[key] = toDbDate(value);
        } else {
          dbData[key] = value ?? null;
        }
      }
      const { data: updated, error } = await supabase
        .from('scheduled_maintenances')
        .update(dbData)
        .eq('id', id)
        .select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled_maintenances'] }),
  });

  const deleteScheduledMaintenance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scheduled_maintenances').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled_maintenances'] }),
  });

  return {
    scheduledMaintenances,
    addScheduledMaintenance: addScheduledMaintenance.mutateAsync,
    updateScheduledMaintenance: (id: string, data: Partial<ScheduledMaintenance>) =>
      updateScheduledMaintenance.mutateAsync({ id, data }),
    deleteScheduledMaintenance: deleteScheduledMaintenance.mutateAsync,
    ...query,
  };
}
