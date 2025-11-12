import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from '../types';
import { supabase } from '../utils/supabaseClient';

const fetchSettings = async (): Promise<Settings | null> => {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error) throw error;
  return data || null;
};

export function useSettings() {
  const queryClient = useQueryClient();
  const { data: settings = null, ...query } = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });

  const updateSettings = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      if (!settings) return;
      const { data: updated, error } = await supabase.from('settings').update(data).eq('id', settings.id).select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] })
  });

  return {
    settings,
    updateSettings: updateSettings.mutateAsync,
    ...query
  };
}
