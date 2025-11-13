import { useMemo } from 'react';
import { UserRole } from '@/types';
import { useAppContext } from '../contexts/AppContext';

interface StoreDataItem {
    storeId?: string;
    [key: string]: any;
}

export function useStoreFilteredData<T extends StoreDataItem>(data: T[]): T[] {
    const { currentUser, selectedStoreId } = useAppContext();

    return useMemo(() => {
        if (currentUser.role === UserRole.SuperAdmin) {
            if (selectedStoreId === 'all') {
                return data;
            }
            return data.filter(item => item.storeId === selectedStoreId);
        }
        return data.filter(item => item.storeId === currentUser.storeId);
    }, [data, currentUser, selectedStoreId]);
}
