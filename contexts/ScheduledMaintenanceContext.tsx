import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { ScheduledMaintenance } from '../types';
import { useAssets } from './AssetContext';
import { supabase } from '../utils/supabaseClient';

interface ScheduledMaintenanceContextType {
  scheduledMaintenances: ScheduledMaintenance[];
  addScheduledMaintenance: (sm: Omit<ScheduledMaintenance, 'id'>) => Promise<void>;
  updateScheduledMaintenance: (id: string, data: Partial<ScheduledMaintenance>) => Promise<void>;
  deleteScheduledMaintenance: (id: string) => Promise<void>;
}

const ScheduledMaintenanceContext = createContext<ScheduledMaintenanceContextType | undefined>(undefined);

export const ScheduledMaintenanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allScheduledMaintenances, setAllScheduledMaintenances] = useState<ScheduledMaintenance[]>([]);
  const { assets } = useAssets();

  useEffect(() => {
    const fetchScheduledMaintenances = async () => {
      const { data, error } = await supabase.from('scheduled_maintenances').select('*');
      if (!error && data) setAllScheduledMaintenances(data);
    };
    fetchScheduledMaintenances();
  }, []);

  const assetIdsInScope = useMemo(() => new Set(assets.map((a) => a.id)), [assets]);

  const scheduledMaintenances = useMemo(() => {
    return allScheduledMaintenances.filter(sm => assetIdsInScope.has(sm.assetId));
  }, [allScheduledMaintenances, assetIdsInScope]);

  const addScheduledMaintenance = async (sm: Omit<ScheduledMaintenance, 'id'>) => {
    const { data, error } = await supabase.from('scheduled_maintenances').insert([sm]).select();
    if (error) throw error;
    if (data) setAllScheduledMaintenances((prev) => [...prev, ...data]);
  };

  const updateScheduledMaintenance = async (id: string, data: Partial<ScheduledMaintenance>) => {
    const { data: updated, error } = await supabase.from('scheduled_maintenances').update(data).eq('id', id).select();
    if (error) throw error;
    if (updated) setAllScheduledMaintenances((prev) => prev.map(sm => sm.id === id ? { ...sm, ...updated[0] } : sm));
  };
  
  const deleteScheduledMaintenance = async (id: string) => {
    const { error } = await supabase.from('scheduled_maintenances').delete().eq('id', id);
    if (error) throw error;
    setAllScheduledMaintenances((prev) => prev.filter(sm => sm.id !== id));
  };

  return (
    <ScheduledMaintenanceContext.Provider value={{ scheduledMaintenances, addScheduledMaintenance, updateScheduledMaintenance, deleteScheduledMaintenance }}>
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
