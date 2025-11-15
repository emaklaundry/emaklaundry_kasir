import { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '@/types';

interface StoreDataItem {
  storeId?: string;
  [key: string]: any;
}

const useStoreFilteredData = function <T extends StoreDataItem>(data: T[]): T[] {
  const { currentUser, selectedStoreId } = useAppContext();

  return useMemo(() => {
    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') {
        return data;
      }
      return data.filter((item) => item.storeId === selectedStoreId);
    }
    return data.filter((item) => item.storeId === currentUser.storeId);
  }, [data, currentUser, selectedStoreId]);
};

export default useStoreFilteredData;
