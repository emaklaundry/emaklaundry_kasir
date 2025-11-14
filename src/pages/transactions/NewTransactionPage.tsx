import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionItem, PaymentStatus, OrderStatus, Customer, ServiceCategory, UserRole, PaymentMethod, Transaction, Service } from '../../../types';
import { Trash2Icon, MessageSquareIcon, PlusCircleIcon, TagIcon, SpinnerIcon } from '../../components/icons';
import SuccessModal from '../../components/SuccessModal';
import { useSettings } from '../../contexts/SettingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useServices } from '../../contexts/ServiceContext';
import ItemNotesModal from '../../components/ItemNotesModal';
import { useAppContext } from '../../contexts/AppContext';
import { formatRupiah, parseRupiah } from '../../../utils/formatting';
import CustomerSelector from '../../components/CustomerSelector';
import ServiceSelector from '../../components/ServiceSelector';
import CustomerFormModal from '../../components/CustomerFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';
import WhatsAppModal from '../../components/WhatsAppModal';
import KiloanTaggingModal from '../../components/KiloanTaggingModal';

const NewTransactionPage: React.FC = () => {
    // --- SEMUA HOOK HARUS DI ATAS SINI ---
    const navigate = useNavigate();
    const { settings, isLoading: isLoadingSettings } = useSettings();
    const { transactions, addTransaction } = useTransactions();
    const { customers, addCustomer } = useCustomers();
    const { services } = useServices();
    const { currentUser, selectedStoreId } = useAppContext();
    const { addAuditLog } = useAuditLogs();
    const { addToast, updateToast } = useToasts();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [items, setItems] = useState<TransactionItem[]>([]);
    const [notes, setNotes] = useState('');
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState(0);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [isKiloanTaggingModalOpen, setIsKiloanTaggingModalOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [newlyCreatedTransaction, setNewlyCreatedTransaction] = useState<Transaction | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isPayingNow, setIsPayingNow] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
    const [amountPaidStr, setAmountPaidStr] = useState('0');
    const [tenderedAmountStr, setTenderedAmountStr] = useState('');

    // Semua useMemo, useEffect, useCallback juga di sini
    const canApplyDiscount = useMemo(() => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.SuperAdmin) return true;
        if ((currentUser.role === UserRole.BranchAdmin || currentUser.role === UserRole.Cashier)) {
            if (currentUser.canGiveDiscount) return true;
            if (selectedCustomer && selectedCustomer.defaultDiscount && selectedCustomer.defaultDiscount > 0) return true;
        }
        return false;
    }, [currentUser, selectedCustomer]);
    // Semua hook turunannya juga harus dipanggil di level atas
    // (dipindahkan dari bawah) agar Rules of Hooks tidak dilanggar.



    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    }, [items]);

    const discountAmount = useMemo(() => {
        if (!canApplyDiscount) return 0;
        if (discountType === 'percent') {
            return subtotal * (discountValue / 100);
        }
        return Math.min(discountValue, subtotal);
    }, [subtotal, discountValue, discountType, canApplyDiscount]);

    const taxAmount = useMemo(() => {
        const taxableAmount = subtotal - discountAmount;
        return taxableAmount * ((settings?.taxRate ?? 0) / 100);
    }, [subtotal, discountAmount, settings?.taxRate]);
    
    const grandTotal = useMemo(() => {
        return subtotal - discountAmount + taxAmount;
    }, [subtotal, discountAmount, taxAmount]);

    useEffect(() => {
        if (isPayingNow) {
            setAmountPaidStr(formatRupiah(grandTotal));
        }
    }, [grandTotal, isPayingNow]);

    const amountToPay = useMemo(() => parseRupiah(amountPaidStr), [amountPaidStr]);
    const tenderedAmount = useMemo(() => parseRupiah(tenderedAmountStr), [tenderedAmountStr]);

    const changeAmount = useMemo(() => {
        if (!isPayingNow || paymentMethod !== PaymentMethod.Cash || tenderedAmount < amountToPay) {
            return 0;
        }
        return tenderedAmount - amountToPay;
    }, [isPayingNow, paymentMethod, tenderedAmount, amountToPay]);
    
    const actualAmountPaid = useMemo(() => {
        if (!isPayingNow) return 0;
        return amountToPay;
    }, [isPayingNow, amountToPay]);

    const paymentStatus = useMemo(() => {
        if (!isPayingNow) return PaymentStatus.Unpaid;
        if (grandTotal <= 0) return PaymentStatus.Paid;
        if (actualAmountPaid <= 0) return PaymentStatus.Unpaid;
        if (actualAmountPaid >= grandTotal) return PaymentStatus.Paid;
        return PaymentStatus.PartiallyPaid;
    }, [isPayingNow, actualAmountPaid, grandTotal]);

    const estimatedCompletionDate = useMemo(() => {
        if (items.length === 0) {
            const today = new Date();
            today.setDate(today.getDate() + 1);
            return today;
        }
        const maxDuration = Math.max(...items.map(item => services.find(s => s.id === item.serviceId)?.durationDays || 0));
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + maxDuration);
        return completionDate;
    }, [items, services]);

    const currentStoreId = useMemo(() => {
        return currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
    }, [currentUser, selectedStoreId]);

    useEffect(() => {
        if (!canApplyDiscount) {
            setDiscountValue(0);
            return;
        }
        if (selectedCustomer && selectedCustomer.defaultDiscount && selectedCustomer.defaultDiscount > 0) {
            setDiscountType('percent');
            setDiscountValue(selectedCustomer.defaultDiscount);
        } else {
            setDiscountType('percent');
            setDiscountValue(settings?.discountRate ?? 0);
        }
    }, [selectedCustomer, settings?.discountRate, canApplyDiscount]);

    // Efek terpisah untuk toast diskon otomatis, agar tidak menyebabkan setState saat render
    useEffect(() => {
        if (
            canApplyDiscount &&
            selectedCustomer &&
            selectedCustomer.defaultDiscount &&
            selectedCustomer.defaultDiscount > 0
        ) {
            // Bungkus pemanggilan addToast dalam setTimeout(0)
            // Ini akan memindahkannya ke antrian makro (macro-task queue),
            // memastikan pemanggilan terjadi SETELAH render saat ini selesai.
            const timerId = setTimeout(() => {
                addToast(`Diskon ${selectedCustomer.defaultDiscount}% otomatis diterapkan untuk ${selectedCustomer.name}.`, 'info');
            }, 0);

            // Selalu bersihkan timer jika komponen unmount sebelum timeout berjalan
            return () => clearTimeout(timerId);
        }
    }, [canApplyDiscount, selectedCustomer, addToast]);

    const handleAddService = useCallback((service: Service) => {
        // 1. Baca 'items' dari scope.
        const existingItemIndex = items.findIndex(item => item.serviceId === service.id);
        const isKiloan = service.category === ServiceCategory.Kiloan;

        if (existingItemIndex > -1) {
            if (isKiloan) {
                // 2. Panggil addToast di luar 'setItems'. Ini adalah event handler biasa.
                addToast('Item kiloan sudah ada. Ubah beratnya di keranjang.', 'info');
                // 3. Tidak perlu update state, jadi kita 'return' lebih awal.
                return;
            }

            // Untuk item Satuan, kita update state seperti biasa.
            setItems(currentItems => {
                const updatedItems = [...currentItems];
                const currentItem = updatedItems[existingItemIndex];
                currentItem.quantity += 1;
                currentItem.subtotal = currentItem.price * currentItem.quantity;
                return updatedItems;
            });
        } else {
            // Untuk item baru
            const newItem: TransactionItem = {
                serviceId: service.id,
                serviceName: service.name,
                price: service.price,
                unit: service.unit,
                quantity: 1,
                subtotal: service.price * 1,
            };
            setItems(currentItems => [...currentItems, newItem]);
        }
    }, [items, addToast]);

    // --- LOGIKA KONDISIONAL DIMULAI DI SINI ---
    if (isLoadingSettings) {
        return (
            <div className="flex justify-center items-center w-full h-96">
                <SpinnerIcon className="w-16 h-16" />
                <span className="sr-only">Memuat pengaturan...</span>
            </div>
        );
    }

    if (!settings) {
         return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">Gagal Memuat Pengaturan Aplikasi</h2>
                <p className="text-lg text-slate-700 dark:text-slate-300">
                    Tidak dapat memuat data pajak, diskon, dan lainnya. 
                    Pastikan Anda memiliki koneksi dan hak akses yang benar untuk melihat tabel 'settings'.
                </p>
            </div>
        );
    }


    

    const resetForm = () => {
        setSelectedCustomer(null);
        setItems([]);
        setNotes('');
        setDiscountValue(settings?.discountRate ?? 0);
        setDiscountType('percent');
        setPaymentMethod(undefined);
        setAmountPaidStr('0');
        setTenderedAmountStr('');
        setIsPayingNow(false);
        setNewlyCreatedTransaction(null);
    };

    const handleItemChange = (index: number, field: 'quantity' | 'taggedItems' | 'itemDetails', value: number | string | { note: string }[]) => {
        const newItems = [...items];
        const item = newItems[index];
        const service = services.find(s => s.id === item.serviceId);

        if (field === 'quantity' && typeof value === 'number') {
            const newQuantity = value >= 0 ? value : 0;
            item.quantity = newQuantity;
            item.subtotal = item.price * item.quantity;

            if (service && service.category === ServiceCategory.Satuan) {
                // Only extend itemDetails, never truncate
                const currentNotes = item.itemDetails || [];
                if (currentNotes.length < newQuantity) {
                    // Add new empty notes if increasing quantity
                    const newNotes = [
                        ...currentNotes,
                        ...Array.from({ length: newQuantity - currentNotes.length }, () => ({ note: '' }))
                    ];
                    item.itemDetails = newNotes;
                } else {
                    // Do not truncate, keep all notes
                    item.itemDetails = currentNotes;
                }
            }
        } else if (field === 'taggedItems' && typeof value === 'string') {
            item.taggedItems = value;
        } else if (field === 'itemDetails' && Array.isArray(value)) {
            item.itemDetails = value as { note: string }[];
        }
        setItems(newItems);
    };

    const handleOpenNotesModal = (index: number) => {
        setEditingItemIndex(index);
        setIsNotesModalOpen(true);
    };

    const handleOpenKiloanTaggingModal = (index: number) => {
        setEditingItemIndex(index);
        setIsKiloanTaggingModalOpen(true);
    }

    const handleSaveNotes = (notes: { note: string }[]) => {
        if (editingItemIndex !== null) {
            handleItemChange(editingItemIndex, 'itemDetails', notes);
        }
        setEditingItemIndex(null);
        setIsNotesModalOpen(false);
    };
    
    const handleSaveKiloanTags = (tags: string) => {
        if (editingItemIndex !== null) {
            handleItemChange(editingItemIndex, 'taggedItems', tags);
        }
        setEditingItemIndex(null);
        setIsKiloanTaggingModalOpen(false);
    }

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSaveCustomer = async (customer: Omit<Customer, 'id' | 'storeId'>) => {
        if (!currentStoreId || currentStoreId === 'all') {
            addToast('Silakan pilih cabang spesifik untuk menambah pelanggan.', 'warning');
            return;
        }
        const toastId = addToast('Menambah pelanggan...', 'info');
        try {
            const newCustomer = await addCustomer({ ...customer, storeId: currentStoreId });
            if (newCustomer) {
                setSelectedCustomer(newCustomer);
                setIsCustomerModalOpen(false);
                updateToast(toastId, 'Pelanggan berhasil ditambahkan!', 'success');
            } else {
                updateToast(toastId, 'Gagal menambah pelanggan: Data tidak valid.', 'error');
            }
        } catch (error: any) {
            updateToast(toastId, `Gagal menambah pelanggan: ${error.message}`, 'error');
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

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
        if (isPayingNow && actualAmountPaid > 0 && !paymentMethod) {
            addToast('Silakan pilih metode pembayaran.', 'warning');
            return;
        }

        setIsSaving(true);
        const toastId = addToast('Menyimpan transaksi...', 'info');
        try {
            const newTransaction: Omit<Transaction, 'id'> = {
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
                paymentMethod: (isPayingNow && actualAmountPaid > 0) ? paymentMethod : undefined,
                createdByUserId: currentUser.id,
                storeId: currentStoreId,
            };
            const savedTransaction = await addTransaction(newTransaction);
            if (savedTransaction) {
                addAuditLog(`Membuat transaksi baru untuk pelanggan ${selectedCustomer.name}.`, currentStoreId);
                setNewlyCreatedTransaction(savedTransaction);
                setIsWhatsAppModalOpen(true);
                updateToast(toastId, 'Transaksi berhasil disimpan.', 'success');
            } else {
                updateToast(toastId, 'Gagal menyimpan transaksi: Tidak ada data yang dikembalikan.', 'error');
            }
        } catch (error: any) {
            updateToast(toastId, `Gagal menyimpan transaksi: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCloseWhatsAppModal = () => {
        setIsWhatsAppModalOpen(false);
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
        setDiscountValue(0);
    };
    
    const handlePaymentOptionChange = (paying: boolean) => {
        setIsPayingNow(paying);
        if (paying) {
            setAmountPaidStr(formatRupiah(grandTotal));
        } else {
            setAmountPaidStr('0');
            setPaymentMethod(undefined);
            setTenderedAmountStr('');
        }
    };

    const handleAmountToPayChange = (valueStr: string) => {
        const rawValue = parseRupiah(valueStr);
        const cappedValue = rawValue > grandTotal ? grandTotal : rawValue;
        setAmountPaidStr(formatRupiah(cappedValue));
    };
    
    const quickCashButtons = [50000, 100000];

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Pilih Layanan</h2>
                            <ServiceSelector 
                                services={services} 
                                onAddService={handleAddService}
                            />
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
                                        {items.length > 0 ? items.map((item, index) => {
                                            const service = services.find(s => s.id === item.serviceId);
                                            const isSatuan = service?.category === ServiceCategory.Satuan;
                                            const isKiloan = service?.category === ServiceCategory.Kiloan;

                                            return (
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
                                                            {isSatuan && (
                                                                <button type="button" onClick={() => handleOpenNotesModal(index)} title="Catatan per Item" className="p-2 text-blue-600 hover:text-blue-900 relative rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                                                    <MessageSquareIcon className="w-6 h-6"/>
                                                                    {item.itemDetails?.slice(0, item.quantity).some(d => d.note) && (
                                                                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800"></span>
                                                                    )}
                                                                </button>
                                                            )}
                                                            {isKiloan && (
                                                                 <button type="button" onClick={() => handleOpenKiloanTaggingModal(index)} title="Tag Item Kiloan" className="p-2 text-purple-600 hover:text-purple-900 relative rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                                                    <TagIcon className="w-6 h-6"/>
                                                                    {item.taggedItems && (
                                                                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800"></span>
                                                                    )}
                                                                </button>
                                                            )}
                                                            <button type="button" onClick={() => handleRemoveItem(index)} title="Hapus Item" className="p-2 text-red-600 hover:text-red-900 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-6 h-6"/></button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                                                </tr>
                                            )
                                        }) : (
                                            <tr><td colSpan={4} className="text-center py-4 text-slate-500 dark:text-slate-400">Belum ada layanan yang ditambahkan.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md sticky top-24 overflow-visible">
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
                                    <div 
                                        className={`flex justify-between items-center text-lg ${!canApplyDiscount ? 'opacity-50' : ''}`}
                                        title={!canApplyDiscount ? 'Anda tidak memiliki izin untuk memberikan diskon.' : ''}
                                    >
                                        <label htmlFor="discountValue" className="text-slate-600 dark:text-slate-300">Diskon:</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                                <button type="button" disabled={!canApplyDiscount} onClick={() => handleDiscountTypeChange('percent')} className={`px-2 py-1 text-sm rounded-md ${discountType === 'percent' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>%</button>
                                                <button type="button" disabled={!canApplyDiscount} onClick={() => handleDiscountTypeChange('fixed')} className={`px-2 py-1 text-sm rounded-md ${discountType === 'fixed' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Rp</button>
                                            </div>
                                            <input 
                                                type="number"
                                                id="discountValue"
                                                min="0"
                                                value={discountValue}
                                                onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                                                className="w-24 bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg p-1.5 text-right dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-600" 
                                                disabled={!canApplyDiscount}
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
                                
                                <div>
                                    <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Opsi Pembayaran</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => handlePaymentOptionChange(false)} 
                                            className={`p-3 rounded-lg text-base border-2 ${!isPayingNow ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600'}`}
                                        >
                                            Bayar Nanti
                                        </button>
                                         <button 
                                            type="button" 
                                            onClick={() => handlePaymentOptionChange(true)} 
                                            className={`p-3 rounded-lg text-base border-2 ${isPayingNow ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600'}`}
                                        >
                                            Bayar Sekarang
                                        </button>
                                    </div>
                                </div>

                                {isPayingNow && (
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
                                            onChange={e => handleAmountToPayChange(e.target.value)}
                                            className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            placeholder="0"
                                        />
                                    </div>
                                    {paymentMethod === PaymentMethod.Cash && (
                                        <div>
                                            <label htmlFor="tenderedAmount" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Uang Diterima (Rp)</label>
                                            <input 
                                                type="text" 
                                                id="tenderedAmount" 
                                                value={tenderedAmountStr}
                                                onChange={e => setTenderedAmountStr(formatRupiah(parseRupiah(e.target.value)))}
                                                className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                placeholder="0"
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button type="button" onClick={() => handleAmountToPayChange(formatRupiah(grandTotal))} className="px-3 py-1.5 text-sm font-medium text-blue-800 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800">Uang Pas</button>
                                        {paymentMethod === PaymentMethod.Cash && quickCashButtons.map(amount => (
                                            <button type="button" key={amount} onClick={() => setTenderedAmountStr(formatRupiah(amount))} className="px-3 py-1.5 text-sm font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">
                                                {formatRupiah(amount)}
                                            </button>
                                        ))}
                                    </div>
                                    {changeAmount > 0 && (
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="text-slate-600 dark:text-slate-300">Kembalian:</span>
                                            <span className="font-medium text-green-600 dark:text-green-400">Rp {formatRupiah(changeAmount)}</span>
                                        </div>
                                    )}
                                </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isSaving || (currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all')}
                                    className="w-full flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-xl px-8 py-4 text-center transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <SpinnerIcon className="w-7 h-7" /> : 'Simpan Transaksi'}
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
             <KiloanTaggingModal
                isOpen={isKiloanTaggingModalOpen}
                onClose={() => setIsKiloanTaggingModalOpen(false)}
                item={editingItemIndex !== null ? items[editingItemIndex] : null!}
                onSave={handleSaveKiloanTags}
            />
            <WhatsAppModal
                isOpen={isWhatsAppModalOpen}
                onClose={handleCloseWhatsAppModal}
                transaction={newlyCreatedTransaction}
                customer={selectedCustomer}
            />
        </>
    );
};

export default NewTransactionPage;