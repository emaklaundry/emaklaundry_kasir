import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchInput from '../../components/SearchInput';

const Harness: React.FC<{ initial?: string }> = ({ initial = '' }) => {
  const [value, setValue] = useState(initial);
  return (
    <SearchInput label="Cari pelanggan" placeholder="Cari..." value={value} onValueChange={setValue} />
  );
};

describe('SearchInput', () => {
  it('punya label aksesibel dan bertipe search', () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'Cari pelanggan' });
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('tombol hapus hanya muncul saat ada teks dan mengosongkan input', () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox');
    expect(screen.queryByRole('button', { name: 'Hapus pencarian' })).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'budi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Hapus pencarian' }));

    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Hapus pencarian' })).not.toBeInTheDocument();
  });

  it('tombol Esc mengosongkan input', () => {
    render(<Harness initial="budi" />);
    const input = screen.getByRole('searchbox');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
  });
});
