import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Customer, UserRole } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, SearchIcon, UsersIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useCustomers } from '../../contexts/CustomerContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useAppContext } from '../../contexts/AppContext';
import CustomerFormModal from '../../components/CustomerFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';

const CustomersPage: React.FC = () => {
    const { customers, setCustomers } = useCustomers();
    const { transactions } = useTransactions();
    const { currentUser, selectedStoreId, stores } = useAppContext();
    const { addAuditLog } = useAuditLogs();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const customerStats = useMemo(() => {
        const stats: { [key: string]: { transactionCount: number, totalSpent: number } } = {};

        customers.forEach(customer => {
            stats[customer.id] = { transactionCount: 0, totalSpent: 0 };
        });

        transactions.forEach(transaction => {
            if (stats[transaction.customerId]) {
                stats[transaction.customerId].transactionCount += 1;
                stats[transaction.customerId].totalSpent += transaction.total;
            }
        });

        return customers.map(customer => {
            const store = stores.find(s => s.id === customer.storeId);
            return {
                ...customer,
                transactionCount: stats[customer.id].transactionCount,
                totalSpent: stats[customer.id].totalSpent,
                storeName: store ? store.name : 'N/A'
            };
        });
    }, [customers, transactions, stores]);

    const filteredCustomers = customerStats.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const handleOpenFormModal = (customer: Customer | null = null) => {
        setCurrentCustomer(customer);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentCustomer(null);
    };

    const handleSaveCustomer = (customer: Omit<Customer, 'id' | 'storeId'>) => {
        const storeId = currentCustomer?.storeId || (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
         if (!storeId || storeId === 'all') {
            alert('Silakan pilih cabang spesifik untuk menambah atau mengedit pelanggan.');
            return;
        }

        if (currentCustomer && currentCustomer.id) {
            setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? { ...c, ...customer, storeId } : c));
            addAuditLog(`Memperbarui data pelanggan: "${customer.name}".`, storeId);
        } else {
            setCustomers(prev => [...prev, { ...customer, id: `CUST${Date.now()}`, storeId }]);
            addAuditLog(`Menambahkan pelanggan baru: "${customer.name}".`, storeId);
        }
        handleCloseFormModal();
    };

    const handleDelete = (customer: Customer) => {
        setCustomerToDelete(customer);
    };

    const confirmDelete = () => {
        if (customerToDelete) {
            setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
            addAuditLog(`Menghapus pelanggan: "${customerToDelete.name}".`, customerToDelete.storeId);
            setCustomerToDelete(null);
        }
    };
    
    const canAddNewCustomer = !(currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all');

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Pelanggan</h1>
                <div className="w-full md:w-auto flex items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari pelanggan..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <button onClick={() => handleOpenFormModal()} className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5 disabled:bg-blue-400 disabled:cursor-not-allowed" disabled={!canAddNewCustomer}>
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Tambah Pelanggan
                    </button>
                </div>
            </div>
            {!canAddNewCustomer && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 -mt-2">Pilih cabang spesifik di header untuk menambah pelanggan baru.</p>
            )}
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">No. Telepon</th>
                            {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && <th className="px-4 py-3">Toko</th>}
                            <th className="px-4 py-3 text-center">Total Transaksi</th>
                            <th className="px-4 py-3 text-right">Total Belanja</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => (
                                <tr key={customer.id} className="border-b dark:border-slate-700">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                        <Link to={`/management/customers/${customer.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                            {customer.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">{customer.phone}</td>
                                    {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && <td className="px-4 py-3">{customer.storeName}</td>}
                                    <td className="px-4 py-3 text-center">{customer.transactionCount}</td>
                                    <td className="px-4 py-3 text-right">Rp {customer.totalSpent.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 flex items-center space-x-2">
                                        <button onClick={() => handleOpenFormModal(customer)} className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(customer)} className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 6 : 5} className="text-center py-12">
                                    <UsersIcon className="mx-auto w-12 h-12 text-slate-400" />
                                    <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">Belum Ada Pelanggan</h3>
                                    <p className="mt-1 text-base text-slate-500">Mulai dengan menambahkan pelanggan pertama Anda.</p>
                                    <div className="mt-6">
                                        <button onClick={() => handleOpenFormModal()} disabled={!canAddNewCustomer} className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5 mx-auto disabled:bg-blue-400 disabled:cursor-not-allowed">
                                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                                            Tambah Pelanggan
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <CustomerFormModal
                    customer={currentCustomer}
                    onClose={handleCloseFormModal}
                    onSave={handleSaveCustomer}
                />
            )}

            {customerToDelete && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setCustomerToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Pelanggan"
                    message={`Apakah Anda yakin ingin menghapus pelanggan "${customerToDelete.name}"? Semua data transaksi terkait akan tetap ada.`}
                />
            )}
        </div>
    );
};

export default CustomersPage;