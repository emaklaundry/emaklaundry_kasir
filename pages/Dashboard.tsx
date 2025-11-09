

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockCustomers } from '../data/mockData';
import { OrderStatus, PaymentStatus, UserRole } from '../types';
import { ShoppingCartIcon, PackageIcon, WrenchIcon, TruckIcon, PlusCircleIcon, DollarSignIcon } from '../components/icons';
import { useAppContext } from '../contexts/AppContext';
import { useInventory } from '../contexts/InventoryContext';
import { useTransactions } from '../contexts/TransactionContext';
import QuickStockUpdateModal from '../components/QuickStockUpdateModal';

const StatCard: React.FC<{ icon: React.FC<{className?: string}>, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 ${color}`}>
        <Icon className="w-10 h-10 text-slate-500" />
        <div>
            <p className="text-base text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { userRole } = useAppContext();
    const { inventory } = useInventory();
    const { transactions } = useTransactions();
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    
    const completedOrders = transactions.filter(t => t.orderStatus === OrderStatus.Completed).length;
    const pendingOrders = transactions.filter(t => t.orderStatus === OrderStatus.Processing).length;
    const lowStockItems = inventory.filter(i => i.stock <= i.lowStockThreshold).length;
    const readyForPickup = transactions.filter(t => t.orderStatus === OrderStatus.Ready).length;

    const activeOrders = transactions
        .filter(t => t.orderStatus !== OrderStatus.Completed)
        .map(t => {
            const customer = mockCustomers.find(c => c.id === t.customerId);
            return {
                ...t,
                customerName: customer ? customer.name : 'N/A',
            };
        })
        .sort((a, b) => new Date(a.estimatedCompletionDate).getTime() - new Date(b.estimatedCompletionDate).getTime());
        
    const getStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Processing: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case OrderStatus.Ready: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case OrderStatus.Completed: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
        }
    };

    const getPaymentStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Paid: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case PaymentStatus.Unpaid: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
        }
    };


    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        icon={PackageIcon} 
                        title="Pesanan Selesai" 
                        value={completedOrders}
                        color="border-green-500"
                    />
                    <StatCard 
                        icon={ShoppingCartIcon} 
                        title="Pesanan Diproses" 
                        value={pendingOrders}
                        color="border-blue-500"
                    />
                    <StatCard 
                        icon={WrenchIcon} 
                        title="Stok Menipis" 
                        value={lowStockItems}
                        color="border-orange-500"
                    />
                     <StatCard 
                        icon={TruckIcon} 
                        title="Siap Diambil" 
                        value={readyForPickup}
                        color="border-yellow-500"
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Progres Pesanan Aktif</h2>
                        {userRole === UserRole.Admin && (
                            <div className="flex items-center gap-4">
                                 <button onClick={() => setIsStockModalOpen(true)} className="flex items-center justify-center text-white bg-teal-600 hover:bg-teal-700 font-medium rounded-lg text-lg px-6 py-3 transition-colors">
                                    <WrenchIcon className="h-5 w-5 mr-2" />
                                    Lapor Inventaris Habis
                                </button>
                                <Link to="/management/expenses" state={{ openModal: true }} className="flex items-center justify-center text-white bg-purple-600 hover:bg-purple-700 font-medium rounded-lg text-lg px-6 py-3 transition-colors">
                                    <DollarSignIcon className="h-5 w-5 mr-2" />
                                    Catat Pengeluaran
                                </Link>
                                <Link to="/management/assets" className="flex items-center justify-center text-white bg-orange-600 hover:bg-orange-700 font-medium rounded-lg text-lg px-6 py-3 transition-colors">
                                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                                    Laporkan Kerusakan
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">ID Transaksi</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3">Estimasi Selesai</th>
                                    <th className="px-4 py-3">Status Pesanan</th>
                                    <th className="px-4 py-3">Status Bayar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeOrders.length > 0 ? activeOrders.map(t => (
                                    <tr key={t.id} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                                        <td className="px-4 py-3">{t.customerName}</td>
                                        <td className="px-4 py-3">{new Date(t.estimatedCompletionDate).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(t.orderStatus)}`}>{t.orderStatus}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-sm font-medium rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}>{t.paymentStatus}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4 text-slate-500 dark:text-slate-400">
                                            Tidak ada pesanan aktif.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <QuickStockUpdateModal 
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
            />
        </>
    );
};

export default Dashboard;