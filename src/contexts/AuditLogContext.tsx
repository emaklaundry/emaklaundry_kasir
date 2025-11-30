import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuditLog } from '../../types';
import { supabase } from '../utils/supabaseClient';
import useAppContext from './useAppContext';

const fetchLogs = async (): Promise<AuditLog[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false });
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
        ...(storeId && storeId !== 'all' ? { storeId } : {}),
      };
      const { error } = await supabase.from('audit_logs').insert([newLog]);
      if (error) throw error;
      return null; // Kembalikan null karena operasi berhasil
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit_logs'] }),
  });

  return {
    logs,
    addAuditLog: (action: string, storeId?: string) => addAuditLog.mutateAsync({ action, storeId }),
    ...query,
  };
}
