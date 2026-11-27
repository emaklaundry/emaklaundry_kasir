import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Asset, MaintenanceLog } from '../types';
import { supabase } from '../utils/supabaseClient';

const fetchAssets = async (): Promise<Asset[]> => {
  const { data, error } = await supabase.from('assets').select('*');
  if (error) throw error;
  // Convert null to undefined for optional fields
  return (data || []).map((a) => ({
    ...a,
    purchaseDate: a.purchaseDate ?? undefined,
    serialNumber: a.serialNumber ?? undefined,
    purchaseCost: a.purchaseCost ?? undefined,
    storeId: a.storeId ?? undefined,
    maintenanceHistory: Array.isArray(a.maintenanceHistory) ? a.maintenanceHistory : [],
  })) as unknown as Asset[];
};

export function useAssets() {
  const queryClient = useQueryClient();
  const { data: assets = [], ...query } = useQuery({ queryKey: ['assets'], queryFn: fetchAssets });

  const addAsset = useMutation({
    mutationFn: async (asset: Omit<Asset, 'id'>) => {
      // Convert undefined to null for Supabase
      const dbAsset = {
        ...asset,
        purchaseDate: asset.purchaseDate ?? null,
        serialNumber: asset.serialNumber ?? null,
        purchaseCost: asset.purchaseCost ?? null,
        storeId: asset.storeId ?? null,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('assets').insert([dbAsset as any]);
      if (error) throw error;
      // We invalidate and refetch the assets list, caller doesn't rely on returned row
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });

  const updateAsset = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Asset> }) => {
      const { id, data } = variables;
      // Convert undefined to null for Supabase
      const dbData: Record<string, unknown> = {};
      for (const key in data) {
        dbData[key] = (data as Record<string, unknown>)[key] ?? null;
      }
      const { data: updated, error } = await supabase
        .from('assets')
        .update(dbData)
        .eq('id', id)
        .select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });

  // Semua perubahan maintenanceHistory dibaca dari data TERBARU di DB lalu ditulis
  // ulang — bukan dari snapshot di UI — agar perubahan bersamaan tidak saling menimpa.
  const modifyMaintenanceHistory = useMutation({
    mutationFn: async (variables: {
      assetId: string;
      modify: (history: MaintenanceLog[]) => MaintenanceLog[];
    }) => {
      const { assetId, modify } = variables;
      const { data: current, error: fetchError } = await supabase
        .from('assets')
        .select('maintenanceHistory')
        .eq('id', assetId)
        .single();
      if (fetchError) throw fetchError;
      const history = Array.isArray(current?.maintenanceHistory)
        ? (current.maintenanceHistory as unknown as MaintenanceLog[])
        : [];
      const { error } = await supabase
        .from('assets')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ maintenanceHistory: modify(history) as any })
        .eq('id', assetId);
      if (error) throw error;
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });

  return {
    assets,
    addAsset: addAsset.mutateAsync,
    updateAsset: (id: string, data: Partial<Asset>) => updateAsset.mutateAsync({ id, data }),
    appendMaintenanceLog: (assetId: string, log: Omit<MaintenanceLog, 'id'>) =>
      modifyMaintenanceHistory.mutateAsync({
        assetId,
        modify: (history) => [...history, { ...log, id: crypto.randomUUID() }],
      }),
    updateMaintenanceLog: (assetId: string, logId: string, log: Omit<MaintenanceLog, 'id'>) =>
      modifyMaintenanceHistory.mutateAsync({
        assetId,
        modify: (history) => history.map((l) => (l.id === logId ? { ...log, id: logId } : l)),
      }),
    deleteMaintenanceLog: (assetId: string, logId: string) =>
      modifyMaintenanceHistory.mutateAsync({
        assetId,
        modify: (history) => history.filter((l) => l.id !== logId),
      }),
    deleteAsset: deleteAsset.mutateAsync,
    ...query,
  };
}
