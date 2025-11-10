import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Settings } from '../types';
import { mockSettings } from '../data/mockData';

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'laundry_settings';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
        const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        const loadedSettings = storedSettings ? JSON.parse(storedSettings) : {};
        return { ...mockSettings, ...loadedSettings };
    } catch (error) {
        console.error("Error reading settings from localStorage", error);
        return mockSettings;
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Error saving settings to localStorage", error);
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};