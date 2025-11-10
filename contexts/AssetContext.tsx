import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Asset, UserRole } from '../types';
import { mockAssets } from '../data/mockData';
import { useAppContext } from './AppContext';

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
  const [allAssets, setAllAssets] = useState<Asset[]>(() => {
    try {
      const storedAssets = localStorage.getItem(ASSETS_STORAGE_KEY);
      if (storedAssets) {
        return JSON.parse(storedAssets, reviveDates);
      }
      return mockAssets;
    } catch (error) {
      console.error("Error reading assets from localStorage", error);
      return mockAssets;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(allAssets));
    } catch (error) {
      console.error("Error saving assets to localStorage", error);
    }
  }, [allAssets]);

  const { currentUser, selectedStoreId } = useAppContext();

  const assets = useMemo(() => {
    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') {
        return allAssets;
      }
      return allAssets.filter(a => a.storeId === selectedStoreId);
    }
    return allAssets.filter(a => a.storeId === currentUser.storeId);
  }, [allAssets, currentUser, selectedStoreId]);

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