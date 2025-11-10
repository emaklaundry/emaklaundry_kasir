import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Asset } from '../types';
import { mockAssets } from '../data/mockData';

interface AssetContextType {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

const ASSETS_STORAGE_KEY = 'laundry_assets';

// Function to revive date objects from JSON
const reviveDates = (key: string, value: any) => {
  const isDate = ['purchaseDate', 'date'].includes(key);
  if (isDate && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>(() => {
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
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
    } catch (error) {
      console.error("Error saving assets to localStorage", error);
    }
  }, [assets]);

  return (
    <AssetContext.Provider value={{ assets, setAssets }}>
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
