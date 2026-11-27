import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Customer } from '../../types';
import { SearchIcon, PlusCircleIcon } from '../icons';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onAddNewCustomer: () => void;
  id?: string;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onAddNewCustomer,
  id,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = `${id ?? 'customer'}-listbox`;
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  const filteredCustomers = useMemo(() => {
    // customers is always an array based on the prop type
    return customers.filter(
      (c: Customer) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm),
    );
  }, [customers, searchTerm]);

  useEffect(() => {
    // Hindari cascading render: update state async
    if (selectedCustomer) {
      setTimeout(() => {
        setSearchTerm(selectedCustomer.name);
        setIsDropdownOpen(false);
      }, 0);
    } else {
      if (document.activeElement !== inputRef.current) {
        setTimeout(() => setSearchTerm(''), 0);
      }
    }
  }, [selectedCustomer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Deselect customer only if the input text is no longer a plausible part of their name
    if (selectedCustomer && !selectedCustomer.name.toLowerCase().startsWith(value.toLowerCase())) {
      onSelectCustomer(null);
    }

    if (!value) {
      onSelectCustomer(null);
    }

    setIsDropdownOpen(true);
    setActiveIndex(-1);
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchTerm(customer.name);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
  };

  const isListOpen = isDropdownOpen && filteredCustomers.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isDropdownOpen) {
        setIsDropdownOpen(true);
        return;
      }
      const last = filteredCustomers.length - 1;
      if (last < 0) return;
      setActiveIndex((i) =>
        e.key === 'ArrowDown' ? (i >= last ? 0 : i + 1) : i <= 0 ? last : i - 1,
      );
    } else if (e.key === 'Enter' && isListOpen && activeIndex >= 0) {
      // Pilih pelanggan, jangan submit form transaksi.
      e.preventDefault();
      handleSelectCustomer(filteredCustomers[activeIndex]);
    } else if (e.key === 'Escape' && isDropdownOpen) {
      e.preventDefault();
      setIsDropdownOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative" id={id}>
      <label htmlFor="customerName" className="form-label">
        Pelanggan
      </label>
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            id="customerName"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsDropdownOpen(true)}
            onBlur={() => {
              setIsDropdownOpen(false);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={isListOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              isListOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined
            }
            className="form-input pl-10"
            placeholder="Cari nama atau no. HP"
            required
            autoComplete="off"
          />
          {isListOpen && (
            <div className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-700">
              <ul id={listboxId} role="listbox" aria-label="Daftar pelanggan">
                {filteredCustomers.map((customer: Customer, index) => (
                  <li
                    key={customer.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    ref={
                      index === activeIndex
                        ? (el) => el?.scrollIntoView?.({ block: 'nearest' })
                        : undefined
                    }
                    className={`cursor-pointer px-4 py-2 text-base text-slate-700 dark:text-slate-200 ${
                      index === activeIndex
                        ? 'bg-slate-100 dark:bg-slate-600'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                    // mousedown agar pilihan tercatat sebelum input kehilangan fokus
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectCustomer(customer);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {customer.phone || 'Tidak ada nomor'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          aria-label="Tambah pelanggan baru"
          type="button"
          onClick={onAddNewCustomer}
          className="btn btn-secondary btn-icon"
        >
          <PlusCircleIcon className="w-5 h-5" />
        </button>
      </div>
      {selectedCustomer && (
        <div className="mt-2 text-sm p-2 bg-blue-50 dark:bg-blue-900/50 rounded-md text-blue-800 dark:text-blue-300">
          <p>
            Terpilih: <strong>{selectedCustomer.name}</strong>
            {selectedCustomer.phone &&
              selectedCustomer.phone !== '0' &&
              ` (${selectedCustomer.phone})`}
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;
