
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mockCustomers, mockTransactions } from '../../data/mockData';
import { Customer } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, SearchIcon } from '../../components/icons';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';

const CustomersPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const customerStats = useMemo(() => {
        return customers.map(customer => {
            const transactions = mockTransactions.filter(t => t.customerId === customer.id);
            const totalSpent = transactions.reduce((sum, t) => sum + t.total, 0);
            return {
                ...customer,
                transactionCount: transactions.length,
                totalSpent,
            };
        });
    }, [customers]);

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

    const handleSaveCustomer = (customer: Customer) => {
        if (currentCustomer && currentCustomer.id) {
            setCustomers(customers.map(c => c.id === customer.id ? customer : c));
        } else {
            setCustomers([...customers, { ...customer, id: `CUST${Date.now()}` }]);
        }
        handleCloseFormModal();
    };

    const handleDelete = (customer: Customer) => {
        setCustomerToDelete(customer);
    };

    const confirmDelete = () => {
        if (customerToDelete) {
            setCustomers(customers.filter(c => c.id !== customerToDelete.id));
            setCustomerToDelete(null);
        }
    };

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
                    <button onClick={() => handleOpenFormModal()} className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Tambah Pelanggan
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">No. Telepon</th>
                            <th className="px-4 py-3 text-center">Total Transaksi</th>
                            <th className="px-4 py-3 text-right">Total Belanja</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => (
                            <tr key={customer.id} className="border-b dark:border-slate-700">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                     <Link to={`/management/customers/${customer.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                        {customer.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3">{customer.phone}</td>
                                <td className="px-4 py-3 text-center">{customer.transactionCount}</td>
                                <td className="px-4 py-3 text-right">Rp {customer.totalSpent.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 flex items-center space-x-2">
                                    <button onClick={() => handleOpenFormModal(customer)} className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(customer)} className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
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


const CustomerFormModal: React.FC<{ customer: Customer | null, onClose: () => void, onSave: (customer: Customer) => void }> = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
        name: customer?.name || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        notes: customer?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: customer?.id || '' });
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={customer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
            footer={
                <>
                    <button type="button" onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
                    <button type="submit" onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
                </>
            }
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nama Pelanggan</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                <div>
                    <label htmlFor="phone" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nomor Telepon</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                <div>
                    <label htmlFor="address" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Alamat (Opsional)</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="notes" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Catatan (Opsional)</label>
                    <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"></textarea>
                </div>
            </form>
        </Modal>
    );
};

export default CustomersPage;