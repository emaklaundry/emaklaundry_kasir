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
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchTerm(customer.name);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" id={id}>
      <label htmlFor="customerName" className="form-label">
        Pelanggan
      </label>
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            id="customerName"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
            className="form-input pl-10"
            placeholder="Cari nama atau no. HP"
            required
            autoComplete="off"
          />
          {isDropdownOpen && filteredCustomers.length > 0 && (
            <div className="absolute z-40 w-full mt-1 bg-white rounded-md shadow-lg dark:bg-slate-700 border dark:border-slate-600 max-h-60 overflow-auto">
              <ul>
                {filteredCustomers.map((customer: Customer) => (
                  <li
                    key={customer.id}
                    className="px-4 py-2 text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                    onClick={() => handleSelectCustomer(customer)}
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
        <button type="button" onClick={onAddNewCustomer} className="btn btn-success">
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
