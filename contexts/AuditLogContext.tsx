import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { AuditLog } from '../types';
import { useAppContext } from './AppContext';
import { supabase } from '../utils/supabaseClient';

interface AuditLogContextType {
  logs: AuditLog[];
  addAuditLog: (action: string, storeId?: string) => Promise<void>;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

export const AuditLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const { currentUser } = useAppContext();

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (!error && data) setLogs(data);
    };
    fetchLogs();
  }, []);

  const addAuditLog = useCallback(async (action: string, storeId?: string) => {
    const newLog: Omit<AuditLog, 'id'> = {
      timestamp: new Date(),
      user: currentUser.name,
      action: action,
      ...(storeId && storeId !== 'all' ? { storeId } : {})
    };
    const { data, error } = await supabase.from('audit_logs').insert([newLog]).select();
    if (error) throw error;
    if (data) setLogs(prevLogs => [data[0], ...prevLogs]);
  }, [currentUser]);

  return (
    <AuditLogContext.Provider value={{ logs, addAuditLog }}>
      {children}
    </AuditLogContext.Provider>
  );
};

export const useAuditLogs = (): AuditLogContextType => {
  const context = useContext(AuditLogContext);
  if (!context) {
    throw new Error('useAuditLogs must be used within an AuditLogProvider');
  }
  return context;
};
