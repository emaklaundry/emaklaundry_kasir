import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { SearchIcon, PlusCircleIcon } from './icons';

interface CustomerSelectorProps {
    customers: Customer[];
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer | null) => void;
    onAddNewCustomer: () => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ customers, selectedCustomer, onSelectCustomer, onAddNewCustomer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    useEffect(() => {
      if (selectedCustomer) {
        setSearchTerm(selectedCustomer.name);
        setIsDropdownOpen(false);
      } else {
        const customerInput = document.getElementById('customerName') as HTMLInputElement;
        if(customerInput && customerInput.value !== searchTerm) {
            setSearchTerm('');
        }
      }
    }, [selectedCustomer]);


    return (
        <div className="relative">
            <label htmlFor="customerName" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Pelanggan</label>
            <div className="flex gap-2">
                 <div className="relative flex-grow">
                     <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                    <input 
                        type="text" 
                        id="customerName" 
                        value={searchTerm} 
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            onSelectCustomer(null);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        placeholder="Cari nama atau no. HP"
                        required
                        autoComplete="off"
                    />
                    {isDropdownOpen && filteredCustomers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg dark:bg-slate-700 border dark:border-slate-600 max-h-60 overflow-auto">
                            <ul>
                                {filteredCustomers.map(customer => (
                                    <li 
                                        key={customer.id} 
                                        className="px-4 py-2 text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                                        onMouseDown={() => onSelectCustomer(customer)}
                                    >
                                        <p className="font-semibold">{customer.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{customer.phone}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <button type="button" onClick={onAddNewCustomer} className="flex-shrink-0 text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-6 py-3">
                    <PlusCircleIcon className="w-5 h-5" />
                </button>
            </div>
             {selectedCustomer && (
                <div className="mt-2 text-sm p-2 bg-blue-50 dark:bg-blue-900/50 rounded-md text-blue-800 dark:text-blue-300">
                    <p>Terpilih: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.phone})</p>
                </div>
            )}
        </div>
    );
}

export default CustomerSelector;
