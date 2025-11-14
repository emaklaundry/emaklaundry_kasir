import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title = 'Tidak Ada Data', description = 'Belum ada data untuk ditampilkan.', children }) => (
  <div className="text-center py-12">
    {icon && <div className="mx-auto mb-4">{icon}</div>}
    <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
    <p className="mt-1 text-base text-slate-500">{description}</p>
    {children && <div className="mt-6">{children}</div>}
  </div>
);

export default EmptyState;
