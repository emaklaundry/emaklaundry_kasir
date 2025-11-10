import React, { createContext, useContext, ReactNode } from 'react';
import { Asset } from '../types';
import { mockAssets } from '../data/mockData';
import { usePersistentState } from '../hooks/usePersistentState';
import { useStoreFilteredData } from '../hooks/useStoreFilteredData';

interface AssetContextType {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

const ASSETS_STORAGE_KEY = 'laundry_assets_multistore';

const reviveDates = (key: string, value: any) => {
  const isDate = ['purchaseDate', 'date'].includes(key);
  if (isDate && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allAssets, setAllAssets] = usePersistentState<Asset[]>(ASSETS_STORAGE_KEY, mockAssets, reviveDates);
  const assets = useStoreFilteredData(allAssets);

  return (
    <AssetContext.Provider value={{ assets, setAssets: setAllAssets }}>
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
