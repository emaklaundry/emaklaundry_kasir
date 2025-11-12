import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuditLog } from '../types';
import { useAppContext } from './AppContext';
import { supabase } from '../utils/supabaseClient';

const fetchLogs = async (): Promise<AuditLog[]> => {
  const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return data || [];
};

export function useAuditLogs() {
  const { currentUser } = useAppContext();
  const queryClient = useQueryClient();
  const { data: logs = [], ...query } = useQuery({ queryKey: ['audit_logs'], queryFn: fetchLogs });

  const addAuditLog = useMutation({
    mutationFn: async ({ action, storeId }: { action: string; storeId?: string }) => {
      const newLog: Omit<AuditLog, 'id'> = {
        timestamp: new Date(),
        user: currentUser.name,
        action: action,
        ...(storeId && storeId !== 'all' ? { storeId } : {})
      };
      const { data, error } = await supabase.from('audit_logs').insert([newLog]).select();
      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit_logs'] })
  });

  return {
    logs,
    addAuditLog: (action: string, storeId?: string) => addAuditLog.mutateAsync({ action, storeId }),
    ...query
  };
}
