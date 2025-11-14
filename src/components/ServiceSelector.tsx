import React, { useState } from 'react';
import { Service } from '@/types';
import { SearchIcon } from './icons';

interface ServiceSelectorProps {
  services: Service[];
  onAddService: (service: Service) => void;
}

function ServiceSelector({ services, onAddService }: ServiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari layanan..."
          className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          autoComplete="off"
        />
      </div>
      <div className="max-h-[45vh] overflow-y-auto space-y-2 pr-2 -mr-2">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-slate-700/50 hover:bg-brand-blue-50 dark:hover:bg-brand-blue-900/50 border-slate-300 dark:border-slate-600"
            >
              <div>
                <div className="font-semibold text-base text-slate-800 dark:text-slate-200">
                  {service.name}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Rp {service.price.toLocaleString('id-ID')} / {service.unit}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAddService(service)}
                className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Tambah
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-500 dark:text-slate-400 py-10">
            <p className="font-semibold text-lg">Layanan tidak ditemukan</p>
            <p>Coba kata kunci lain.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceSelector;
