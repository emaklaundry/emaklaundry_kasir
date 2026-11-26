import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

const Harness = ({ onResult }: { onResult: (value: boolean) => void }) => {
  const [confirm, dialog] = useConfirmDialog();
  return (
    <>
      <button
        onClick={async () =>
          onResult(await confirm({ title: 'Hapus SOP', message: 'Yakin?', confirmText: 'Ya' }))
        }
      >
        buka
      </button>
      {dialog}
    </>
  );
};

describe('useConfirmDialog', () => {
  it('resolves true when the confirm button is clicked', async () => {
    const onResult = vi.fn();
    render(<Harness onResult={onResult} />);
    fireEvent.click(screen.getByText('buka'));
    expect(screen.getByText('Hapus SOP')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ya' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
    expect(screen.queryByText('Hapus SOP')).not.toBeInTheDocument();
  });

  it('resolves false when cancelled', async () => {
    const onResult = vi.fn();
    render(<Harness onResult={onResult} />);
    fireEvent.click(screen.getByText('buka'));
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });
});
