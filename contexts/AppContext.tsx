
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { User, UserRole, Store } from '../types';
import { mockUsers } from '../data/mockData';
import { useStores } from './StoreContext';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[]; // Filtered list
  allUsers: User[]; // Unfiltered list
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  stores: Store[];
  selectedStoreId: string; // 'all' or a specific store ID
  setSelectedStoreId: (storeId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'laundry_users';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        return storedUsers ? JSON.parse(storedUsers) : mockUsers;
    } catch (error) {
        console.error("Error reading users from localStorage", error);
        return mockUsers;
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    } catch (error) {
        console.error("Error saving users to localStorage", error);
    }
  }, [allUsers]);

  const [currentUser, setCurrentUser] = useState<User>(() => {
      // Ensure currentUser is always valid, even after refresh
      const superAdmin = allUsers.find(u => u.role === UserRole.SuperAdmin);
      return superAdmin || allUsers[0];
  });
  
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  const users = useMemo(() => {
    // SuperAdmin can see users based on the store filter
    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') {
        return allUsers;
      }
      // Show users for the selected store, plus all Super Admins
      return allUsers.filter(u => u.storeId === selectedStoreId || u.role === UserRole.SuperAdmin);
    }
    // Other roles see users from their own store, plus all Super Admins
    return allUsers.filter(u => u.storeId === currentUser.storeId || u.role === UserRole.SuperAdmin);
  }, [allUsers, currentUser, selectedStoreId]);

  const contextValue = {
    currentUser,
    setCurrentUser,
    users,
    allUsers,
    setAllUsers,
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
