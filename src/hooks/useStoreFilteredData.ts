import { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '@/types';


// Use a generic type for storeId and index signature
interface StoreDataItem {
  storeId?: string;
  [key: string]: unknown;
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
    // Untuk Admin/Kasir, pastikan storeId ada
    if (currentUser.storeId) {
      return data.filter((item) => item.storeId === currentUser.storeId);
    }
    // Jika tidak ada storeId, jangan tampilkan data apa pun
    return [];
  }, [data, currentUser, selectedStoreId]);
};

export default useStoreFilteredData;
