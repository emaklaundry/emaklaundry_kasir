import { useState, useCallback } from 'react';

export type SortDirection = 'ascending' | 'descending';

export interface ServerSortConfig<K extends string = string> {
  key: K;
  direction: SortDirection;
}

/**
 * State urutan untuk tabel dengan paginasi server.
 * Berbeda dengan useSortableData (urut di klien), hook ini hanya menyimpan
 * kolom & arah urutan; pengurutan dikerjakan query Supabase (`.order()`)
 * sehingga berlaku untuk SEMUA data, bukan hanya halaman yang sedang tampil.
 */
export function useServerSort<K extends string>(
  initialConfig: ServerSortConfig<K>,
  onChange?: () => void,
) {
  const [sortConfig, setSortConfig] = useState<ServerSortConfig<K>>(initialConfig);

  const requestSort = useCallback(
    (key: K) => {
      setSortConfig((prev) => ({
        key,
        direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
      }));
      onChange?.();
    },
    [onChange],
  );

  return { sortConfig, requestSort };
}

export default useServerSort;
