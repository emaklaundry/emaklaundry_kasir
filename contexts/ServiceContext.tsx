import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Service } from '../types';
import { mockServices } from '../data/mockData';

interface ServiceContextType {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const SERVICES_STORAGE_KEY = 'laundry_services';

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>(() => {
    try {
      const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
      return storedServices ? JSON.parse(storedServices) : mockServices;
    } catch (error) {
      console.error("Error reading services from localStorage", error);
      return mockServices;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
    } catch (error) {
      console.error("Error saving services to localStorage", error);
    }
  }, [services]);

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
