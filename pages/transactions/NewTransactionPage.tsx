import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionItem, PaymentStatus, OrderStatus, Customer, ServiceCategory, UserRole, PaymentMethod, Service } from '../../types';
import { Trash2Icon, MessageSquareIcon, PlusCircleIcon } from '../../components/icons';
import SuccessModal from '../../components/SuccessModal';
import { useSettings } from '../../contexts/SettingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useServices } from '../../contexts/ServiceContext';
import ItemNotesModal from '../../components/ItemNotesModal';
import { useAppContext } from '../../contexts/AppContext';
import { formatRupiah, parseRupiah } from '../../utils/formatting';
import CustomerSelector from '../../components/CustomerSelector';
import ServiceSelector from '../../components/ServiceSelector';
import CustomerFormModal from '../../components/CustomerFormModal';
import ServiceFormModal from '../../components/ServiceFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';

const NewTransactionPage: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { setTransactions } = useTransactions();
    const { customers, setCustomers } = useCustomers();
    const { services, setServices } = useServices();
    const { currentUser, selectedStoreId } = useAppContext();
    const { addAuditLog } = useAuditLogs();
    const { addToast } = useToasts();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [items, setItems] = useState<TransactionItem[]>([]);
    const [notes, setNotes] = useState('');
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState(0);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    
    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
    const [amountPaidStr, setAmountPaidStr] = useState('0');

    const hasAdminAccess = currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.BranchAdmin;

    useEffect(() => {
        setDiscountValue(settings.discountRate);
        setDiscountType('percent');
    }, [settings.discountRate]);

    const resetForm = () => {
        setSelectedCustomer(null);
        setItems([]);
        setNotes('');
        setDiscountValue(settings.discountRate);
        setDiscountType('percent');
        setPaymentMethod(undefined);
        setAmountPaidStr('0');
    };

    const handleAddService = (service: typeof services[0]) => {
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
                itemDetails: service.category === ServiceCategory.Satuan ? [{ note: '' }] : undefined,
            };
            setItems([...items, newItem]);
        }
    };

    const handleItemChange = (index: number, field: 'quantity', value: number) => {
        const newItems = [...items];
        const item = newItems[index];
        const service = services.find(s => s.id === item.serviceId);
        
        if (field === 'quantity') {
            const newQuantity = value >= 0 ? value : 0;
            item.quantity = newQuantity;
            item.subtotal = item.price * item.quantity;

            if (service && service.category === ServiceCategory.Satuan) {
                const currentNotes = item.itemDetails || [];
                const newNotes = Array.from({ length: newQuantity }, (_, i) => currentNotes[i] || { note: '' });
                item.itemDetails = newNotes;
            }
        }
        setItems(newItems);
    };

    const handleOpenNotesModal = (index: number) => {
        setEditingItemIndex(index);
        setIsNotesModalOpen(true);
    };

    const handleSaveNotes = (notes: { note: string }[]) => {
        if (editingItemIndex !== null) {
            const newItems = [...items];
            newItems[editingItemIndex].itemDetails = notes;
            setItems(newItems);
        }
        setEditingItemIndex(null);
        setIsNotesModalOpen(false);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    }, [items]);

    const discountAmount = useMemo(() => {
        if (discountType === 'percent') {
            return subtotal * (discountValue / 100);
        }
        return Math.min(discountValue, subtotal); // Ensure discount isn't more than subtotal
    }, [subtotal, discountValue, discountType]);

    const taxAmount = useMemo(() => {
        const taxableAmount = subtotal - discountAmount;
        return taxableAmount * (settings.taxRate / 100);
    }, [subtotal, discountAmount, settings.taxRate]);
    
    const grandTotal = useMemo(() => {
        return subtotal - discountAmount + taxAmount;
    }, [subtotal, discountAmount, taxAmount]);

    const amountPaid = useMemo(() => parseRupiah(amountPaidStr), [amountPaidStr]);

    const changeAmount = useMemo(() => {
        if (paymentMethod === PaymentMethod.Cash && amountPaid > grandTotal) {
            return amountPaid - grandTotal;
        }
        return 0;
    }, [amountPaid, grandTotal, paymentMethod]);

    const actualAmountPaid = useMemo(() => {
        return Math.min(amountPaid, grandTotal);
    }, [amountPaid, grandTotal]);

    const paymentStatus = useMemo(() => {
        if (grandTotal <= 0) return PaymentStatus.Paid; // For free items
        if (actualAmountPaid <= 0) return PaymentStatus.Unpaid;
        if (actualAmountPaid >= grandTotal) return PaymentStatus.Paid;
        return PaymentStatus.PartiallyPaid;
    }, [actualAmountPaid, grandTotal]);

    const estimatedCompletionDate = useMemo(() => {
        if (items.length === 0) {
            const today = new Date();
            today.setDate(today.getDate() + 1); // Default to tomorrow if no items
            return today;
        }

        const maxDuration = Math.max(
            ...items.map(item => {
                const service = services.find(s => s.id === item.serviceId);
                return service ? service.durationDays : 0;
            })
        );

        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + maxDuration);
        return completionDate;
    }, [items, services]);

    const currentStoreId = useMemo(() => {
        return currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
    }, [currentUser, selectedStoreId]);

    const handleSaveCustomer = (customer: Omit<Customer, 'id' | 'storeId'>) => {
        if (!currentStoreId || currentStoreId === 'all') {
            addToast('Silakan pilih cabang spesifik untuk menambah pelanggan.', 'warning');
            return;
        }
        const newCustomer = { ...customer, id: `CUST${Date.now()}`, storeId: currentStoreId };
        setCustomers(prev => [...prev, newCustomer]);
        setSelectedCustomer(newCustomer);
        setIsCustomerModalOpen(false);
    };

    const handleSaveService = (serviceData: Omit<Service, 'id'>) => {
        const newService = { ...serviceData, id: `S${Date.now()}` };
        setServices(prev => [...prev, newService]);
        setIsServiceModalOpen(false);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentStoreId || currentStoreId === 'all') {
            addToast('Super Admin harus memilih cabang spesifik untuk membuat transaksi.', 'warning');
            return;
        }
        if(!selectedCustomer) {
            addToast('Pelanggan harus dipilih.', 'warning');
            return;
        }
        if (items.length === 0) {
             addToast('Minimal satu layanan harus ditambahkan.', 'warning');
            return;
        }
        if (actualAmountPaid > 0 && !paymentMethod) {
            addToast('Silakan pilih metode pembayaran.', 'warning');
            return;
        }
        
        const newTransaction = {
            id: `TRX${Date.now()}`,
            customerId: selectedCustomer.id,
            items,
            subtotal,
            discount: discountAmount,
            tax: taxAmount,
            total: grandTotal,
            paymentStatus,
            orderStatus: OrderStatus.Processing,
            createdAt: new Date(),
            estimatedCompletionDate: estimatedCompletionDate,
            notes,
            amountPaid: actualAmountPaid,
            change: changeAmount,
            paymentMethod: actualAmountPaid > 0 ? paymentMethod : undefined,
            createdByUserId: currentUser.id,
            storeId: currentStoreId,
        };
        
        setTransactions(prev => [...prev, newTransaction]);
        addAuditLog(`Membuat transaksi baru ${newTransaction.id} untuk pelanggan ${selectedCustomer.name}.`, newTransaction.storeId);
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

    const handleDiscountTypeChange = (type: 'percent' | 'fixed') => {
        setDiscountType(type);
        setDiscountValue(0); // Reset value when type changes to avoid confusion
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Pilih Layanan</h2>
                                {hasAdminAccess &&
                                    <button 
                                        type="button" 
                                        onClick={() => setIsServiceModalOpen(true)}
                                        className="flex items-center justify-center text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-4 py-2"
                                    >
                                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                                        Layanan Baru
                                    </button>
                                }
                            </div>
                            <ServiceSelector services={services} onSelectService={handleAddService} />
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Item Transaksi</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-lg text-left text-slate-500 dark:text-slate-400">
                                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3">Layanan</th>
                                            <th className="px-4 py-3">Jumlah</th>
                                            <th className="px-4 py-3 text-center">Aksi</th>
                                            <th className="px-4 py-3 text-right">Subtotal</th>
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
                                                            step={item.unit === 'kg' ? "0.1" : "1"}
                                                            value={item.quantity} 
                                                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} 
                                                            className="w-24 bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                                                        />
                                                        <span className="ml-2 text-base text-slate-500 dark:text-slate-400">{item.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <div className="flex items-center justify-center">
                                                        {services.find(s => s.id === item.serviceId)?.category === ServiceCategory.Satuan && (
                                                            <button type="button" onClick={() => handleOpenNotesModal(index)} title="Tambah Catatan per Item" className="p-2 text-blue-600 hover:text-blue-900 relative rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                                                <MessageSquareIcon className="w-6 h-6"/>
                                                                {item.itemDetails?.some(d => d.note) && (
                                                                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800"></span>
                                                                )}
                                                            </button>
                                                        )}
                                                        <button type="button" onClick={() => handleRemoveItem(index)} title="Hapus Item" className="p-2 text-red-600 hover:text-red-900 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-6 h-6"/></button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right">Rp {item.subtotal.toLocaleString('id-ID')}</td>
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
                                    <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"></textarea>
                                </div>
                                <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="text-slate-600 dark:text-slate-300">Subtotal:</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">Rp {subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg">
                                        <label htmlFor="discountValue" className="text-slate-600 dark:text-slate-300">Diskon:</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                                <button type="button" onClick={() => handleDiscountTypeChange('percent')} className={`px-2 py-1 text-sm rounded-md ${discountType === 'percent' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>%</button>
                                                <button type="button" onClick={() => handleDiscountTypeChange('fixed')} className={`px-2 py-1 text-sm rounded-md ${discountType === 'fixed' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Rp</button>
                                            </div>
                                            <input 
                                                type="number"
                                                id="discountValue"
                                                value={discountValue}
                                                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                                className="w-24 bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg p-1.5 text-right dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-lg">
                                        <span/>
                                        <span className="font-medium text-red-600 dark:text-red-400">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="text-slate-600 dark:text-slate-300">Pajak ({settings.taxRate}%):</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">+ Rp {taxAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-2xl font-semibold text-slate-900 dark:text-white pt-3 border-t dark:border-slate-600">
                                        <span>Grand Total:</span>
                                        <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                                
                                <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-4 mt-4 space-y-4">
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Pembayaran</h3>
                                    <div>
                                        <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Metode Pembayaran</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.values(PaymentMethod).map(m => (
                                                <button 
                                                    type="button" 
                                                    key={m} 
                                                    onClick={() => setPaymentMethod(m)} 
                                                    className={`p-3 rounded-lg text-base border-2 ${paymentMethod === m ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600'}`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="amountPaid" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Jumlah Bayar (Rp)</label>
                                        <input 
                                            type="text" 
                                            id="amountPaid" 
                                            value={amountPaidStr}
                                            onChange={e => setAmountPaidStr(formatRupiah(parseRupiah(e.target.value)))}
                                            className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            placeholder="0"
                                        />
                                    </div>
                                    {changeAmount > 0 && (
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="text-slate-600 dark:text-slate-300">Kembalian:</span>
                                            <span className="font-medium text-green-600 dark:text-green-400">Rp {formatRupiah(changeAmount)}</span>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all'}
                                    className="w-full text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-xl px-8 py-4 text-center transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    Simpan Transaksi
                                </button>
                                 {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                                    <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">Pilih cabang spesifik di header untuk membuat transaksi.</p>
                                )}
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
            <ItemNotesModal
                isOpen={isNotesModalOpen}
                onClose={() => setIsNotesModalOpen(false)}
                item={editingItemIndex !== null ? items[editingItemIndex] : null!}
                onSave={handleSaveNotes}
            />
             <ServiceFormModal
                isOpen={isServiceModalOpen}
                onClose={() => setIsServiceModalOpen(false)}
                onSave={handleSaveService}
                service={null}
            />
        </>
    );
};

export default NewTransactionPage;
