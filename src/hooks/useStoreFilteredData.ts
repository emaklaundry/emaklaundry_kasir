import { useMemo } from 'react';
import useAppContext from '../contexts/useAppContext';
import { UserRole } from '@/types';

// Use a generic type for storeId and index signature
interface StoreDataItem {
  storeId?: string;
  [key: string]: unknown;
}

/**
 * Filters data by current user's store.
 *
 * @warning DO NOT use this hook with paginated data (e.g., transactions).
 * Store filtering for paginated data MUST be done at the database query level
 * to avoid empty results when items on current page are from other stores.
 *
 * Use this hook ONLY for small, fully-loaded lookup data:
 * - Service categories
 * - Small inventory lists
 * - User lists
 */
const useStoreFilteredData = function <T extends StoreDataItem>(data: T[]): T[] {
  const { currentUser, selectedStoreId } = useAppContext();

  return useMemo(() => {
    if (!currentUser) return data;

    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') {
        return data;
      }
      return data.filter((item) => item.storeId === selectedStoreId);
    }
    // Untuk Admin/Kasir, pastikan storeId ada
    if (!currentUser.storeId) return [];
    return data.filter((item) => item.storeId === currentUser.storeId);
  }, [data, currentUser, selectedStoreId]);
};

export default useStoreFilteredData;
