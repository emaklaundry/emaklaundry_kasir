import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Service } from '../types';
import { supabase } from '../utils/supabaseClient';

const fetchServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase.from('services').select('*');
  if (error) throw error;
  return (data || []).map((s) => ({
    ...s,
    storeId: s.storeId ?? undefined,
    washType: s.wash_type, // Map snake_case to camelCase
  })) as Service[];
};

export function useServices() {
  const queryClient = useQueryClient();
  const { data: services = [], ...query } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    // Data services jarang berubah, cache 10 menit
    staleTime: 10 * 60 * 1000,
    // Jangan auto-refetch saat window focus (mencegah gangguan saat input)
    refetchOnWindowFocus: false,
  });

  const addService = useMutation({
    mutationFn: async (service: Omit<Service, 'id'>) => {
      // Map camelCase to snake_case for database
      const dbService = {
        ...service,
        wash_type: service.washType,
      };
      const { error } = await supabase.from('services').insert([dbService]);
      if (error) throw error;
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const updateService = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Service> }) => {
      const { id, data } = variables;
      // Map camelCase to snake_case for database
      const dbData: Record<string, unknown> = { ...data };
      if (data.washType !== undefined) {
        dbData.wash_type = data.washType;
        delete dbData.washType;
      }
      const { data: updated, error } = await supabase
        .from('services')
        .update(dbData)
        .eq('id', id)
        .select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  return {
    services,
    addService: addService.mutateAsync,
    updateService: (id: string, data: Partial<Service>) => updateService.mutateAsync({ id, data }),
    deleteService: deleteService.mutateAsync,
    ...query,
  };
}
