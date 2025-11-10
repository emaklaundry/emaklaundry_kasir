import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatus, PaymentStatus, Expense, UserRole, Customer, Transaction } from '../types';
import { ShoppingCartIcon, PackageIcon, WrenchIcon, TruckIcon, PlusCircleIcon, DollarSignIcon, CalendarIcon, ChevronRightIcon } from '../components/icons';
import { useAppContext } from '../contexts/AppContext';
import { useInventory } from '../contexts/InventoryContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useCustomers } from '../contexts/CustomerContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useScheduledMaintenances } from '../contexts/ScheduledMaintenanceContext';
import { useAssets } from '../contexts/AssetContext';
import QuickStockUpdateModal from '../components/QuickStockUpdateModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import QuickMaintenanceModal from '../components/QuickMaintenanceModal';
import WhatsAppModal from '../components/WhatsAppModal';

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
    const { currentUser, selectedStoreId, stores } = useAppContext();
    const { inventory } = useInventory();
    const { transactions, setTransactions } = useTransactions();
    const { customers } = useCustomers();
    const { setExpenses } = useExpenses();
    const { scheduledMaintenances } = useScheduledMaintenances();
    const { assets } = useAssets();
    
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [transactionForWhatsApp, setTransactionForWhatsApp] = useState<Transaction | null>(null);

    const completedOrders = transactions.filter(t => t.orderStatus === OrderStatus.Completed).length;
    const pendingOrders = transactions.filter(t => t.orderStatus === OrderStatus.Processing).length;
    const lowStockItems = inventory.filter(i => i.stock <= i.lowStockThreshold).length;
    
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    const maintenanceDueCount = scheduledMaintenances.filter(sm => new Date(sm.nextDueDate) <= now).length;

    const maintenanceDue = useMemo(() => {
        return scheduledMaintenances
            .filter(sm => new Date(sm.nextDueDate) <= now)
            .map(sm => {
                const asset = assets.find(a => a.id === sm.assetId);
                return { ...sm, assetName: asset?.name || 'N/A' };
            })
            .sort((a,b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    }, [scheduledMaintenances, assets, now]);

    const customerMap = useMemo(() => {
        return customers.reduce((map, customer) => {
            map[customer.id] = customer;
            return map;
        }, {} as Record<string, Customer>);
    }, [customers]);

    const activeOrders = transactions
        .filter(t => t.orderStatus !== OrderStatus.Completed)
        .map(t => {
            const customer = customerMap[t.customerId];
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

    const handleSaveExpense = (expense: Expense) => {
        const storeId = currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
        // This check is now redundant due to the disabled button, but kept as a safeguard.
        if (!storeId || storeId === 'all') { 
            alert('Silakan pilih cabang spesifik untuk mencatat pengeluaran.');
            return;
        }
        setExpenses(prev => [...prev, { ...expense, id: Date.now(), storeId }]);
        setIsExpenseModalOpen(false);
    };
    
    const handleNextStatus = (transactionId: string) => {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        let nextStatus: OrderStatus;
        if (transaction.orderStatus === OrderStatus.Processing) {
            nextStatus = OrderStatus.Ready;
        } else if (transaction.orderStatus === OrderStatus.Ready) {
            nextStatus = OrderStatus.Completed;
        } else {
            return; // No next status from 'Completed'
        }

        const updatedTransaction = { ...transaction, orderStatus: nextStatus };
        setTransactions(prev => prev.map(t => (t.id === transactionId ? updatedTransaction : t)));

        // Trigger WhatsApp modal if status becomes 'Ready for Pickup'
        if (nextStatus === OrderStatus.Ready) {
            setTransactionForWhatsApp(updatedTransaction);
            setIsWhatsAppModalOpen(true);
        } 
        // Or trigger if the order is now completed and paid
        else if (nextStatus === OrderStatus.Completed && transaction.paymentStatus === PaymentStatus.Paid) {
            setTransactionForWhatsApp(updatedTransaction);
            setIsWhatsAppModalOpen(true);
        }
    };

    const customerForWhatsApp = useMemo(() => {
        if (!transactionForWhatsApp) return null;
        return customerMap[transactionForWhatsApp.customerId];
    }, [transactionForWhatsApp, customerMap]);


    const getStoreName = () => {
        if (currentUser.role === UserRole.SuperAdmin) {
            if (selectedStoreId === 'all') return 'Semua Cabang';
            return stores.find(s => s.id === selectedStoreId)?.name || 'Cabang Tidak Dikenal';
        }
        return stores.find(s => s.id === currentUser.storeId)?.name || 'Cabang Tidak Dikenal';
    };

    const isActionDisabled = currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all';

    return (
        <>
            <div className="space-y-6">
                 <div className="mb-4">
                    <h2 className="text-xl font-medium text-slate-600 dark:text-slate-400">Tampilan Data: <span className="font-semibold text-slate-800 dark:text-slate-200">{getStoreName()}</span></h2>
                </div>
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
                        icon={CalendarIcon} 
                        title="Perawatan Terjadwal" 
                        value={maintenanceDueCount}
                        color="border-red-500"
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Progres Pesanan Aktif</h2>
                        <div className="flex items-center gap-4 flex-wrap">
                                 <button onClick={() => setIsStockModalOpen(true)} disabled={isActionDisabled} className="flex items-center justify-center text-white bg-teal-600 hover:bg-teal-700 font-medium rounded-lg text-lg px-6 py-3 transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed">
                                    <WrenchIcon className="h-5 w-5 mr-2" />
                                    Update Stok Cepat
                                </button>
                                <button onClick={() => setIsExpenseModalOpen(true)} disabled={isActionDisabled} className="flex items-center justify-center text-white bg-purple-600 hover:bg-purple-700 font-medium rounded-lg text-lg px-6 py-3 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed">
                                    <DollarSignIcon className="h-5 w-5 mr-2" />
                                    Catat Pengeluaran
                                </button>
                                <button onClick={() => setIsMaintenanceModalOpen(true)} disabled={isActionDisabled} className="flex items-center justify-center text-white bg-orange-600 hover:bg-orange-700 font-medium rounded-lg text-lg px-6 py-3 transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed">
                                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                                    Laporkan Kerusakan
                                </button>
                            </div>
                    </div>
                     {isActionDisabled && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 text-right -mt-2">
                            Pilih cabang spesifik di header untuk melakukan aksi cepat.
                        </p>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">ID Transaksi</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3">Estimasi Selesai</th>
                                    <th className="px-4 py-3">Status Pesanan</th>
                                    <th className="px-4 py-3">Status Bayar</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeOrders.length > 0 ? activeOrders.map(t => {
                                    const isSelesaikanDisabled = t.orderStatus === OrderStatus.Ready && t.paymentStatus !== PaymentStatus.Paid;
                                    return (
                                    <tr key={t.id} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                            <Link to={`/transactions/${t.id}/details`} className="hover:underline">{t.id}</Link>
                                        </td>
                                        <td className="px-4 py-3">{t.customerName}</td>
                                        <td className="px-4 py-3">{new Date(t.estimatedCompletionDate).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(t.orderStatus)}`}>{t.orderStatus}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-sm font-medium rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}>{t.paymentStatus}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {t.orderStatus !== OrderStatus.Completed && (
                                                <button
                                                    onClick={() => handleNextStatus(t.id)}
                                                    disabled={isSelesaikanDisabled}
                                                    className="flex items-center justify-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                                                    title={
                                                        isSelesaikanDisabled
                                                        ? 'Pelunasan diperlukan sebelum menyelesaikan pesanan.'
                                                        : `Ubah ke status ${t.orderStatus === OrderStatus.Processing ? OrderStatus.Ready : OrderStatus.Completed}`
                                                    }
                                                >
                                                    {t.orderStatus === OrderStatus.Processing ? 'Siap Diambil' : 'Selesaikan'}
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4 text-slate-500 dark:text-slate-400">
                                            Tidak ada pesanan aktif.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Jadwal Perawatan Jatuh Tempo</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">Aset</th>
                                    <th className="px-4 py-3">Deskripsi Perawatan</th>
                                    <th className="px-4 py-3">Jatuh Tempo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenanceDue.length > 0 ? maintenanceDue.map(m => (
                                    <tr key={m.id} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.assetName}</td>
                                        <td className="px-4 py-3">{m.description}</td>
                                        <td className="px-4 py-3 text-red-600 dark:text-red-400 font-semibold">{new Date(m.nextDueDate).toLocaleDateString('id-ID')}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-4 text-slate-500 dark:text-slate-400">
                                            Tidak ada jadwal perawatan yang jatuh tempo.
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
            <ExpenseFormModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                expense={null}
            />
            <QuickMaintenanceModal
                isOpen={isMaintenanceModalOpen}
                onClose={() => setIsMaintenanceModalOpen(false)}
            />
            <WhatsAppModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                transaction={transactionForWhatsApp}
                customer={customerForWhatsApp}
            />
        </>
    );
};

export default Dashboard;