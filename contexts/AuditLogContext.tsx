import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { AuditLog } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAppContext } from './AppContext';

interface AuditLogContextType {
  logs: AuditLog[];
  addAuditLog: (action: string, storeId?: string) => void;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

const AUDIT_LOG_STORAGE_KEY = 'laundry_audit_logs';

const reviveDates = (key: string, value: any) => {
  if (key === 'timestamp' && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

export const AuditLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = usePersistentState<AuditLog[]>(AUDIT_LOG_STORAGE_KEY, [], reviveDates);
  const { currentUser } = useAppContext();

  const addAuditLog = useCallback((action: string, storeId?: string) => {
    const newLog: AuditLog = {
      id: Date.now(),
      timestamp: new Date(),
      user: currentUser.name,
      action: action,
    };
    if (storeId && storeId !== 'all') {
      newLog.storeId = storeId;
    }
    setLogs(prevLogs => [newLog, ...prevLogs]);
  }, [currentUser, setLogs]);


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
