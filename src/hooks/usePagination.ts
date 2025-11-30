import { useState, useMemo, useEffect } from 'react';

const DEFAULT_ITEMS_PER_PAGE = 15;

const usePagination = <T>(data: T[], itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Reset to page 1 if the current page becomes invalid (e.g., after filtering data)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
    paginatedData,
    currentData: paginatedData, // Alias for clarity
  };
};

export default usePagination;
export { usePagination };
