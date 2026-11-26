import * as React from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

/**
 * Pengganti `window.confirm` yang memakai ConfirmationModal aplikasi.
 *
 *   const [confirm, confirmDialog] = useConfirmDialog();
 *   if (!(await confirm({ title: 'Hapus?', message: '...' }))) return;
 *   ...
 *   return <>{...}{confirmDialog}</>;
 */
export function useConfirmDialog(): [
  (options: ConfirmOptions) => Promise<boolean>,
  React.ReactElement | null,
] {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const settle = React.useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = React.useCallback((next: ConfirmOptions) => {
    // Dialog sebelumnya yang belum dijawab dianggap batal.
    resolverRef.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  // Komponen dilepas saat dialog masih terbuka: jangan biarkan promise menggantung.
  React.useEffect(() => () => resolverRef.current?.(false), []);

  const dialog = options ? (
    <ConfirmationModal
      isOpen
      title={options.title}
      message={options.message}
      confirmText={options.confirmText}
      confirmVariant={options.confirmVariant}
      onClose={() => settle(false)}
      onConfirm={() => settle(true)}
    />
  ) : null;

  return [confirm, dialog];
}

export default useConfirmDialog;
