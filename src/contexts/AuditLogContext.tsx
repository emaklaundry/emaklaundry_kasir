import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuditLog } from '../types';
import { supabase } from '../utils/supabaseClient';
import useAppContext from './useAppContext';

const fetchLogs = async (): Promise<AuditLog[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return (data || []).map((log) => ({
    id: log.id.toString(),
    timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
    user: log.user || 'Unknown',
    action: log.action || 'Unknown Action',
    storeId: log.storeId || undefined,
  }));
};

export function useAuditLogs() {
  const { currentUser } = useAppContext();
  const queryClient = useQueryClient();

  const query = useQuery<AuditLog[]>({
    queryKey: ['audit_logs'],
    queryFn: fetchLogs,
    staleTime: 30000,
    enabled: !!currentUser,
  });

  const addLogMutation = useMutation({
    mutationFn: async (newLog: { user: string; action: string; storeId: string | null }) => {
      const { error } = await supabase.from('audit_logs').insert([
        {
          user: newLog.user,
          action: newLog.action,
          timestamp: new Date().toISOString(),
          storeId: newLog.storeId,
        },
      ]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] });
    },
    onError: (error) => {
      console.error('Failed to add audit log:', error);
      // Silent fail untuk audit logs - tidak mengganggu UX
    },
  });

  const addAuditLog = (action: string, storeId?: string) => {
    if (!currentUser) return;
    
    const logData = {
      user: currentUser.name,
      action,
      storeId: storeId || currentUser.storeId || null,
    };
    
    // Fire and forget - tidak block UI
    addLogMutation.mutate(logData);
  };

  return {
    logs: query.data || [],
    addAuditLog,
    isLoading: query.isLoading,
    error: query.error,
  };
}
