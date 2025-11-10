import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { User, UserRole, Store } from '../types';
import { mockUsers } from '../data/mockData';
import { useStores } from './StoreContext';
import { usePersistentState } from '../hooks/usePersistentState';

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
const CURRENT_USER_ID_KEY = 'laundry_current_user_id';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = usePersistentState<User[]>(USERS_STORAGE_KEY, mockUsers);

  const [currentUserId, setCurrentUserId] = usePersistentState<number>(
      CURRENT_USER_ID_KEY,
      allUsers.find(u => u.role === UserRole.SuperAdmin)?.id || allUsers[0].id
  );
  
  const currentUser = useMemo(() => allUsers.find(u => u.id === currentUserId) || allUsers[0], [allUsers, currentUserId]);
  
  const setCurrentUser = (user: User) => {
      setCurrentUserId(user.id);
  };
  
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  const users = useMemo(() => {
    // This logic is specific to users (showing all Super Admins), so it's not using the generic hook.
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
