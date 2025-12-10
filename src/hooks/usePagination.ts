import { useState, useMemo, useEffect } from 'react';

// Default tetap 15, tapi sekarang bisa diubah lewat parameter
const DEFAULT_ITEMS_PER_PAGE = 15;

const usePagination = <T>(data: T[], itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset ke halaman 1 jika data/filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  // Hitung total halaman berdasarkan itemsPerPage yang dinamis
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Reset ke halaman 1 jika halaman saat ini tidak valid (misal setelah filter)
  // Only reset currentPage if totalPages changes and currentPage is out of range
  useEffect(() => {
    // Jika currentPage di luar range, set ke halaman terakhir yang valid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
    paginatedData,
    currentData: paginatedData,
  };
};

export default usePagination;
export { usePagination };
