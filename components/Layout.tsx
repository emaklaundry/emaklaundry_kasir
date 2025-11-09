import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { mockCustomers } from '../data/mockData';

const getPageTitle = (pathname: string, params: any): string => {
    const staticTitles: { [key: string]: string } = {
        '/': 'Dashboard',
        '/transactions': 'Transaksi',
        '/transactions/new': 'Buat Transaksi Baru',
        '/management/customers': 'Manajemen Pelanggan',
        '/management/services': 'Manajemen Layanan',
        '/management/inventory': 'Manajemen Inventaris',
        '/management/assets': 'Manajemen Aset & Pemeliharaan',
        '/management/expenses': 'Manajemen Pengeluaran',
        '/management/users': 'Manajemen Pengguna',
        '/reports': 'Laporan',
        '/audit-log': 'Log Audit',
        '/settings': 'Pengaturan',
    };

    if (staticTitles[pathname]) {
        return staticTitles[pathname];
    }

    if (pathname.startsWith('/management/customers/')) {
        const customer = mockCustomers.find(c => c.id === params.id);
        return customer ? `Detail Pelanggan: ${customer.name}` : 'Detail Pelanggan';
    }
    
    return 'Laundry POS';
};


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const params = useParams();
    const pageTitle = getPageTitle(location.pathname, params);

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen">
            <Sidebar />
            <div className="sm:ml-64">
                <Header pageTitle={pageTitle} />
                <main className="p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
