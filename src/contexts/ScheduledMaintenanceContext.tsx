import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduledMaintenance } from '../../types';
import { useAssets } from './AssetContext';
import { supabase } from '../utils/supabaseClient';

const fetchScheduledMaintenances = async (): Promise<ScheduledMaintenance[]> => {
  const { data, error } = await supabase.from('scheduled_maintenances').select('*');
  if (error) throw error;
  return data || [];
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
      const { error } = await supabase.from('scheduled_maintenances').insert([sm]);
      if (error) throw error;
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled_maintenances'] }),
  });

  const updateScheduledMaintenance = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<ScheduledMaintenance> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase
        .from('scheduled_maintenances')
        .update(data)
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
