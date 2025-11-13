import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Service } from '../types';
import { supabase } from '../utils/supabaseClient';

const fetchServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase.from('services').select('*');
  if (error) throw error;
  return data || [];
};

export function useServices() {
  const queryClient = useQueryClient();
  const { data: services = [], ...query } = useQuery({ queryKey: ['services'], queryFn: fetchServices });

  const addService = useMutation({
    mutationFn: async (service: Omit<Service, 'id'>) => {
      const { error } = await supabase.from('services').insert([service]);
      if (error) throw error;
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
  });

  const updateService = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Service> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase.from('services').update(data).eq('id', id).select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
  });

  return {
    services,
    addService: addService.mutateAsync,
    updateService: (id: string, data: Partial<Service>) => updateService.mutateAsync({ id, data }),
    deleteService: deleteService.mutateAsync,
    ...query
  };
}
