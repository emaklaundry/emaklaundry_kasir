import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from '@/types';
import { supabase } from '@/utils/supabaseClient';

const fetchSettings = async (): Promise<Settings | null> => {
  // Use a safer fetch that returns the first row if multiple exist and doesn't fail
  // if the table accidentally contains more than one settings row.
  const { data, error } = await supabase.from('settings').select('*').limit(1);
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as Settings) : null;
};

export function useSettings() {
  const queryClient = useQueryClient();
  const { data: settings = null, ...query } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const updateSettings = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      // Prevent accidental updates to immutable primary key
      const payload = { ...data };

      // Re-fetch the current settings row at save time to avoid races
      const { data: existingRows, error: fetchErr } = await supabase
        .from('settings')
        .select('*')
        .limit(1);
      if (fetchErr) throw fetchErr;
      const existing =
        existingRows && existingRows.length > 0 ? (existingRows[0] as Settings) : null;

      if (existing && existing.id != null) {
        const { data: updated, error } = await supabase
          .from('settings')
          .update(payload)
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        return updated?.[0] || null;
      }

      // No existing row: insert one
      const { data: inserted, error: insertErr } = await supabase
        .from('settings')
        .insert(payload)
        .select();
      if (insertErr) throw insertErr;
      return inserted?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  return {
    settings,
    updateSettings: updateSettings.mutateAsync,
    ...query,
  };
}
