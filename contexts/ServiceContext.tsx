import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Service } from '../types';
import { supabase } from '../utils/supabaseClient';

interface ServiceContextType {
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase.from('services').select('*');
      if (!error && data) setServices(data);
    };
    fetchServices();
  }, []);

  const addService = async (service: Omit<Service, 'id'>) => {
    const { data, error } = await supabase.from('services').insert([service]).select();
    if (!error && data) setServices((prev) => [...prev, ...data]);
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    const { data: updated, error } = await supabase.from('services').update(data).eq('id', id).select();
    if (!error && updated) setServices((prev) => prev.map(s => s.id === id ? { ...s, ...updated[0] } : s));
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    setServices((prev) => prev.filter(s => s.id !== id));
  };

  return (
    <ServiceContext.Provider value={{ services, addService, updateService, deleteService }}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};
