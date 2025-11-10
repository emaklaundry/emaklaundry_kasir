import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { ScheduledMaintenance } from '../types';
import { mockScheduledMaintenance } from '../data/mockData';
import { useAssets } from './AssetContext';
import { usePersistentState } from '../hooks/usePersistentState';

interface ScheduledMaintenanceContextType {
  scheduledMaintenances: ScheduledMaintenance[];
  setScheduledMaintenances: React.Dispatch<React.SetStateAction<ScheduledMaintenance[]>>;
}

const ScheduledMaintenanceContext = createContext<ScheduledMaintenanceContextType | undefined>(undefined);

const SCHEDULED_MAINTENANCE_STORAGE_KEY = 'laundry_scheduled_maintenance';

const reviveDates = (key: string, value: any) => {
  const isDate = ['nextDueDate', 'lastCompletedDate'].includes(key);
  if (isDate && value) {
    return new Date(value);
  }
  return value;
};

export const ScheduledMaintenanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allScheduledMaintenances, setAllScheduledMaintenances] = usePersistentState<ScheduledMaintenance[]>(
    SCHEDULED_MAINTENANCE_STORAGE_KEY,
    mockScheduledMaintenance,
    reviveDates
  );

  const { assets } = useAssets();
  
  const assetIdsInScope = useMemo(() => new Set(assets.map((a) => a.id)), [assets]);

  const scheduledMaintenances = useMemo(() => {
    return allScheduledMaintenances.filter(sm => assetIdsInScope.has(sm.assetId));
  }, [allScheduledMaintenances, assetIdsInScope]);

  return (
    <ScheduledMaintenanceContext.Provider value={{ scheduledMaintenances, setScheduledMaintenances: setAllScheduledMaintenances }}>
      {children}
    </ScheduledMaintenanceContext.Provider>
  );
};

export const useScheduledMaintenances = (): ScheduledMaintenanceContextType => {
  const context = useContext(ScheduledMaintenanceContext);
  if (!context) {
    throw new Error('useScheduledMaintenances must be used within a ScheduledMaintenanceProvider');
  }
  return context;
};
