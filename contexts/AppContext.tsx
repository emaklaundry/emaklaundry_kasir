
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { mockUsers, mockStores } from '../data/mockData';
import { Store } from '../types';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  stores: Store[];
  selectedStoreId: string; // 'all' or a specific store ID
  setSelectedStoreId: (storeId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<User>(users.find(u => u.role === UserRole.SuperAdmin)!);
  const [stores] = useState<Store[]>(mockStores);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  const contextValue = {
    currentUser,
    setCurrentUser,
    users,
    stores,
    selectedStoreId,
    setSelectedStoreId,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};