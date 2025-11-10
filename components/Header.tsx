import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../types';

interface HeaderProps {
  pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ pageTitle }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    stores, 
    selectedStoreId, 
    setSelectedStoreId 
  } = useAppContext();

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUser = users.find(u => u.id === parseInt(event.target.value, 10));
    if (selectedUser) {
      setCurrentUser(selectedUser);
      // Reset store selection if the new user is not a super admin
      if (selectedUser.role !== UserRole.SuperAdmin) {
        setSelectedStoreId('all');
      }
    }
  };

  const currentStore = stores.find(s => s.id === currentUser.storeId);
  const activeStores = stores.filter(s => s.isActive);

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm p-4 sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-white">{pageTitle}</h1>
        <div className="flex items-center space-x-4">
          {currentUser.role === UserRole.SuperAdmin && (
            <div>
              <label htmlFor="store-filter" className="sr-only">Filter Toko</label>
              <select 
                id="store-filter"
                value={selectedStoreId} 
                onChange={e => setSelectedStoreId(e.target.value)} 
                className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="all">Semua Cabang</option>
                {activeStores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center">
             <span className="text-base text-slate-600 dark:text-slate-300 mr-2">Login sebagai:</span>
            <select 
              value={currentUser.id} 
              onChange={handleUserChange} 
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
        </div>
      </div>
       {currentUser.role !== UserRole.SuperAdmin && currentStore && (
         <div className="text-right text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cabang: {currentStore.name}
         </div>
       )}
    </header>
  );
};

export default Header;