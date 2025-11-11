import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Settings } from '../types';
import { supabase } from '../utils/supabaseClient';

interface SettingsContextType {
  settings: Settings | null;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (!error && data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const updateSettings = async (data: Partial<Settings>) => {
    if (!settings) return;
    const { data: updated, error } = await supabase.from('settings').update(data).eq('id', settings.id).select();
    if (!error && updated) setSettings(updated[0]);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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
