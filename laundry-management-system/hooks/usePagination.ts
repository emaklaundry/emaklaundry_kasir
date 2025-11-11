import { useState, useMemo, useEffect } from 'react';

const ITEMS_PER_PAGE = 15;

export const usePagination = <T,>(data: T[]) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return data.slice(startIndex, endIndex);
    }, [data, currentPage]);
    
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