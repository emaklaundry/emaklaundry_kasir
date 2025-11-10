import React, { useState, useMemo } from 'react';
import { Service, ServiceCategory } from '../types';
import { SearchIcon } from './icons';

interface ServiceSelectorProps {
    services: Service[];
    onSelectService: (service: Service) => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ services, onSelectService }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredServices = services.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedServices = useMemo(() => {
        return filteredServices.reduce((acc, service) => {
            (acc[service.category] = acc[service.category] || []).push(service);
            return acc;
        }, {} as Record<string, Service[]>);
    }, [filteredServices]);

    const categoryOrder = Object.values(ServiceCategory);

    const sortedCategories = Object.keys(groupedServices).sort((a, b) => {
        return categoryOrder.indexOf(a as ServiceCategory) - categoryOrder.indexOf(b as ServiceCategory);
    });

    return (
        <div className="space-y-4">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10"/>
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari layanan berdasarkan nama..."
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    autoComplete="off"
                />
            </div>

            <div className="max-h-[45vh] overflow-y-auto space-y-4 pr-2 -mr-2">
                {sortedCategories.length > 0 ? (
                    sortedCategories.map(category => (
                        <div key={category}>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2 sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm py-1 z-10">{category}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {groupedServices[category].map(service => (
                                    <button 
                                        type="button" 
                                        key={service.id} 
                                        onClick={() => onSelectService(service)}
                                        className="text-left p-3 border rounded-lg bg-white dark:bg-slate-700/50 hover:bg-brand-blue-50 dark:hover:bg-brand-blue-900/50 hover:border-brand-blue-300 dark:hover:border-brand-blue-600 border-slate-300 dark:border-slate-600 transition-all duration-200 h-full flex flex-col justify-between"
                                    >
                                        <p className="font-semibold text-base text-slate-800 dark:text-slate-200">{service.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Rp {service.price.toLocaleString('id-ID')}</p>
                                    </button>
                                ))}
                            </div>
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
};

export default ServiceSelector;
