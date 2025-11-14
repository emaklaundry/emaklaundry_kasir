import React from 'react';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sortConfig?: { key: string; direction: 'ascending' | 'descending' };
  onSort: (key: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  sortConfig,
  onSort,
  className = '',
  children,
}) => {
  const isActive = sortConfig?.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 ${className}`}
    >
      {label}
      {isActive &&
        (sortConfig?.direction === 'ascending' ? (
          <span aria-label="asc" className="ml-1">
            ▲
          </span>
        ) : (
          <span aria-label="desc" className="ml-1">
            ▼
          </span>
        ))}
      {children}
    </button>
  );
};

export default SortableHeader;
