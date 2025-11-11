import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Asset } from '../types';
import { supabase } from '../utils/supabaseClient';

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => Promise<void>;
  updateAsset: (id: string, data: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      const { data, error } = await supabase.from('assets').select('*');
      if (!error && data) setAssets(data);
    };
    fetchAssets();
  }, []);

  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    const { data, error } = await supabase.from('assets').insert([asset]).select();
    if (!error && data) setAssets((prev) => [...prev, ...data]);
  };

  const updateAsset = async (id: string, data: Partial<Asset>) => {
    const { data: updated, error } = await supabase.from('assets').update(data).eq('id', id).select();
    if (!error && updated) setAssets((prev) => prev.map(a => a.id === id ? { ...a, ...updated[0] } : a));
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw error;
    setAssets((prev) => prev.filter(a => a.id !== id));
  };

  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset, deleteAsset }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = (): AssetContextType => {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};
