import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Service, ServiceCategory } from '../types';
import { SearchIcon } from './icons';

interface ServiceSelectorProps {
    services: Service[];
    onSelectService: (service: Service) => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ services, onSelectService }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const serviceButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const filteredServices = services.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const allVisibleServices = useMemo(() => {
        if (searchTerm) return filteredServices;
        return services;
    }, [searchTerm, filteredServices, services]);

    useEffect(() => {
        setActiveIndex(-1); // Reset active index when search term changes
        serviceButtonRefs.current = []; // Reset refs
    }, [searchTerm]);
    
    useEffect(() => {
        if (activeIndex !== -1 && serviceButtonRefs.current[activeIndex]) {
            serviceButtonRefs.current[activeIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [activeIndex]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % allVisibleServices.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + allVisibleServices.length) % allVisibleServices.length);
        } else if (e.key === 'Enter' && activeIndex !== -1) {
            e.preventDefault();
            onSelectService(allVisibleServices[activeIndex]);
        }
    };

    const groupedServices = useMemo(() => {
        const servicesToGroup = searchTerm ? filteredServices : services;
        return servicesToGroup.reduce((acc, service) => {
            (acc[service.category] = acc[service.category] || []).push(service);
            return acc;
        }, {} as Record<string, Service[]>);
    }, [filteredServices, services, searchTerm]);

    const categoryOrder = Object.values(ServiceCategory);

    const sortedCategories = Object.keys(groupedServices).sort((a, b) => {
        return categoryOrder.indexOf(a as ServiceCategory) - categoryOrder.indexOf(b as ServiceCategory);
    });

    const ServiceButton: React.FC<{service: Service, index: number}> = ({ service, index }) => (
        <button 
            type="button" 
            ref={el => { serviceButtonRefs.current[index] = el; }}
            key={service.id} 
            onClick={() => onSelectService(service)}
            onMouseOver={() => setActiveIndex(index)}
            className={`text-left p-3 border rounded-lg transition-all duration-200 h-full flex flex-col justify-between ${
                activeIndex === index 
                ? 'bg-brand-blue-100 dark:bg-brand-blue-900/70 border-brand-blue-400 dark:border-brand-blue-500 ring-2 ring-brand-blue-300' 
                : 'bg-white dark:bg-slate-700/50 hover:bg-brand-blue-50 dark:hover:bg-brand-blue-900/50 hover:border-brand-blue-300 dark:hover:border-brand-blue-600 border-slate-300 dark:border-slate-600'
            }`}
        >
            <p className="font-semibold text-base text-slate-800 dark:text-slate-200">{service.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Rp {service.price.toLocaleString('id-ID')}</p>
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10"/>
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Cari layanan (gunakan panah & Enter)..."
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    autoComplete="off"
                />
            </div>

            <div className="max-h-[45vh] overflow-y-auto space-y-4 pr-2 -mr-2" onMouseLeave={() => setActiveIndex(-1)}>
                {sortedCategories.length > 0 ? (
                    sortedCategories.map(category => (
                        <div key={category}>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2 sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm py-1 z-10">{category}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {groupedServices[category]
                                    .map(service => 
                                        <ServiceButton 
                                            key={service.id} 
                                            service={service} 
                                            index={allVisibleServices.indexOf(service)} 
                                        />
                                    )
                                }
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