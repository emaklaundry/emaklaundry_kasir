import React, { createContext, useContext, ReactNode } from 'react';
import { Service } from '../types';
import { mockServices } from '../data/mockData';
import { usePersistentState } from '../hooks/usePersistentState';

interface ServiceContextType {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const SERVICES_STORAGE_KEY = 'laundry_services';

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = usePersistentState<Service[]>(SERVICES_STORAGE_KEY, mockServices);

  return (
    <ServiceContext.Provider value={{ services, setServices }}>
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
