import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockServices, mockCustomers } from '../../data/mockData';
import { Service, TransactionItem, PaymentStatus, OrderStatus, Customer } from '../../types';
import { Trash2Icon, PlusCircleIcon, SearchIcon } from '../../components/icons';
import Modal from '../../components/Modal';
import SuccessModal from '../../components/SuccessModal';

const NewTransactionPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [items, setItems] = useState<TransactionItem[]>([]);
    const [notes, setNotes] = useState('');
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

    const resetForm = () => {
        setSelectedCustomer(null);
        setItems([]);
        setNotes('');
        // This is a workaround to clear the customer selector input
        const customerInput = document.getElementById('customerName') as HTMLInputElement;
        if (customerInput) customerInput.value = '';
    };

    const handleAddService = (service: Service) => {
        const existingItem = items.find(i => i.serviceId === service.id);
        if(existingItem) {
            handleItemChange(items.indexOf(existingItem), 'quantity', existingItem.quantity + 1);
        } else {
            const newItem: TransactionItem = {
                serviceId: service.id,
                serviceName: service.name,
                quantity: 1,
                price: service.price,
                subtotal: service.price,
                unit: service.unit,
            };
            setItems([...items, newItem]);
        }
    };

    const handleItemChange = (index: number, field: 'quantity', value: number) => {
        const newItems = [...items];
        const item = newItems[index];
        if (field === 'quantity') {
            item.quantity = value >= 0 ? value : 0;
            item.subtotal = item.price * item.quantity;
        }
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const total = useMemo(() => {
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    }, [items]);

    const handleSaveCustomer = (customer: Customer) => {
        const newCustomer = { ...customer, id: `CUST${Date.now()}`};
        setCustomers([...customers, newCustomer]);
        setSelectedCustomer(newCustomer);
        setIsCustomerModalOpen(false);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedCustomer || items.length === 0) {
            alert('Pelanggan dan minimal satu layanan harus dipilih.');
            return;
        }
        
        const newTransaction = {
            id: `TRX${Date.now()}`,
            customerId: selectedCustomer.id,
            items,
            total,
            paymentStatus: PaymentStatus.Unpaid,
            orderStatus: OrderStatus.Processing,
            createdAt: new Date(),
            estimatedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dummy 3 days
            notes,
        };
        console.log('New Transaction:', newTransaction);
        // mockTransactions.push(newTransaction); // This would add to the mock data
        setIsSuccessModalOpen(true);
    };
    
    const handleNewTransaction = () => {
        resetForm();
        setIsSuccessModalOpen(false);
    }
    
    const handleViewTransactions = () => {
        setIsSuccessModalOpen(false);
        navigate('/transactions');
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Pilih Layanan</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {mockServices.map(service => (
                                    <button type="button" key={service.id} onClick={() => handleAddService(service)} className="p-6 border rounded-lg text-left hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors">
                                        <p className="font-semibold text-lg text-slate-900 dark:text-white">{service.name}</p>
                                        <p className="text-base text-slate-600 dark:text-slate-300">Rp {service.price.toLocaleString('id-ID')} / {service.unit}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Item Transaksi</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-lg text-left text-slate-500 dark:text-slate-400">
                                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3">Layanan</th>
                                            <th className="px-4 py-3">Jumlah</th>
                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length > 0 ? items.map((item, index) => (
                                            <tr key={index} className="border-b dark:border-slate-700">
                                                <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{item.serviceName}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center">
                                                        <input 
                                                            type="number" 
                                                            min="0" 
                                                            step="any"
                                                            value={item.quantity} 
                                                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} 
                                                            className="w-24 bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                                                        />
                                                        <span className="ml-2 text-base text-slate-500 dark:text-slate-400">{item.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-600 hover:text-red-900 p-2"><Trash2Icon className="w-6 h-6"/></button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="text-center py-4 text-slate-500 dark:text-slate-400">Belum ada layanan yang ditambahkan.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md sticky top-24">
                            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Detail & Total</h2>
                            <div className="space-y-4">
                                <CustomerSelector 
                                    customers={customers}
                                    selectedCustomer={selectedCustomer}
                                    onSelectCustomer={setSelectedCustomer}
                                    onAddNewCustomer={() => setIsCustomerModalOpen(true)}
                                />
                                 <div>
                                    <label htmlFor="notes" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Catatan (Opsional)</label>
                                    <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"></textarea>
                                </div>
                                <div className="pt-4 border-t dark:border-slate-700">
                                    <div className="flex justify-between items-center text-2xl font-semibold text-slate-900 dark:text-white">
                                        <span>Total Biaya:</span>
                                        <span>Rp {total.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                                <button type="submit" className="w-full text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-xl px-8 py-4 text-center transition-colors">
                                    Simpan Transaksi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {isCustomerModalOpen && <CustomerFormModal customer={null} onClose={() => setIsCustomerModalOpen(false)} onSave={handleSaveCustomer} />}
            </form>
            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={handleViewTransactions}
                title="Transaksi Berhasil!"
                message="Transaksi baru telah berhasil dibuat."
                actions={[
                    { text: 'Buat Transaksi Baru Lagi', onClick: handleNewTransaction, type: 'primary' },
                    { text: 'Lihat Daftar Transaksi', onClick: handleViewTransactions, type: 'secondary' }
                ]}
            />
        </>
    );
};


const CustomerSelector: React.FC<{
    customers: Customer[];
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer | null) => void;
    onAddNewCustomer: () => void;
}> = ({ customers, selectedCustomer, onSelectCustomer, onAddNewCustomer }) => {
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
        // Clear search term if customer is deselected from outside
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


export default NewTransactionPage;