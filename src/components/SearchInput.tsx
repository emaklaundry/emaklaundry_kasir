import React, { forwardRef } from 'react';
import { SearchIcon, XIcon } from './icons';

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'aria-label'
>;

export interface SearchInputProps extends NativeInputProps {
  /** Nilai teks pencarian (controlled). */
  value: string;
  /** Dipanggil dengan teks baru; juga dipanggil dengan '' saat tombol × / Esc dipakai. */
  onValueChange: (value: string) => void;
  /** Label aksesibel; dibaca pembaca layar. Default: placeholder. */
  label?: string;
  /** Kelas tambahan untuk pembungkus (mis. lebar / col-span). */
  wrapperClassName?: string;
}

/**
 * Kotak pencarian standar: ikon kiri, tombol hapus (×) di kanan,
 * Esc mengosongkan, keyboard HP menampilkan tombol "Cari".
 */
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    value,
    onValueChange,
    label,
    placeholder,
    wrapperClassName = '',
    className = '',
    onKeyDown,
    autoComplete = 'off',
    ...rest
  },
  ref
) {
  const accessibleLabel = label ?? placeholder ?? 'Cari';

  const clear = () => onValueChange('');

  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            clear();
          }
          onKeyDown?.(e);
        }}
        placeholder={placeholder}
        title={placeholder}
        aria-label={accessibleLabel}
        autoComplete={autoComplete}
        spellCheck={false}
        className={`form-input search-input truncate pl-10 ${value ? 'pr-10' : 'pr-3'} ${className}`.trim()}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Hapus pencarian"
          title="Hapus pencarian"
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

export default SearchInput;
