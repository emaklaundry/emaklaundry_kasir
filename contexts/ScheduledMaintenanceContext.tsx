import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { ScheduledMaintenance } from '../types';
import { mockScheduledMaintenance } from '../data/mockData';
import { useAssets } from './AssetContext';

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
  const [allScheduledMaintenances, setAllScheduledMaintenances] = useState<ScheduledMaintenance[]>(() => {
    try {
      const storedData = localStorage.getItem(SCHEDULED_MAINTENANCE_STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData, reviveDates);
      }
      return mockScheduledMaintenance;
    } catch (error) {
      console.error("Error reading scheduled maintenance from localStorage", error);
      return mockScheduledMaintenance;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SCHEDULED_MAINTENANCE_STORAGE_KEY, JSON.stringify(allScheduledMaintenances));
    } catch (error) {
      console.error("Error saving scheduled maintenance to localStorage", error);
    }
  }, [allScheduledMaintenances]);

  // Consume the AssetContext to get assets currently in scope for the user
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