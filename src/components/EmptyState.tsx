import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  /** Aksi lanjutan, misalnya tombol "Tambah …". */
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'Tidak Ada Data',
  description = 'Belum ada data untuk ditampilkan.',
  children,
}) => (
  <div className="mx-auto max-w-md px-4 py-12 text-center">
    {icon && (
      <div className="mx-auto mb-4 flex justify-center text-slate-400 dark:text-slate-500">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
    <p className="mt-1 text-base leading-relaxed text-slate-500 dark:text-slate-400">
      {description}
    </p>
    {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
  </div>
);

export default EmptyState;
