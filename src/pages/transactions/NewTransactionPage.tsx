import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- KOMPONEN MODAL & UI ---
import WhatsAppModal from '../../components/WhatsAppModal';
import Modal from '../../components/Modal';
import SuccessModal from '../../components/SuccessModal';
import ItemNotesModal from '../../components/ItemNotesModal';
import KiloanTaggingModal from '../../components/KiloanTaggingModal';
import ServiceSelector from '../../components/ServiceSelector';
import CustomerSelector from '../../components/CustomerSelector';
import CustomerFormModal from '../../components/CustomerFormModal';
import {
  SpinnerIcon,
  Trash2Icon,
  MessageSquareIcon,
  TagIcon,
  ShoppingCartIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';

// --- HOOKS KONTEKS & UTILITAS ---
import { useToasts } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAppContext } from '../../contexts/AppContext';
import { useServices } from '../../contexts/ServiceContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { formatRupiah, parseRupiah } from '@/utils/formatting';
import {
  Transaction,
  Service,
  Customer,
  TransactionItem,
  UserRole,
  PaymentStatus,
  PaymentMethod,
  ServiceCategory,
  Settings,
  TransactionItemDetail,
  OrderStatus,
} from '@/types';

// --- KOMPONEN LOKAL (DIPINDAHKAN KE LUAR FUNGSI UTAMA) ---

// Komponen internal untuk detail keranjang (reusable di desktop & modal mobile)
const CartDetails: React.FC<{
  items: TransactionItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  isMobileCartOpen?: boolean;
  onCloseMobileCart?: () => void;
}> = ({
  items,
  subtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  paymentStatus,
  isMobileCartOpen = false,
  onCloseMobileCart = () => {},
}) => (
  <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg p-6 shadow-md overflow-x-auto flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between mb-4 flex-shrink-0">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Detail Pesanan</h2>
      {isMobileCartOpen && (
        <button
          onClick={onCloseMobileCart}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-2xl font-bold px-2 focus:outline-none"
          aria-label="Tutup"
        >
          ×
        </button>
      )}
    </div>

    {/* Area Konten (Scrollable) */}
    <div className="space-y-3 pr-2 overflow-y-auto max-h-[60vh] min-h-[25vh] flex-grow flex flex-col">
      {items.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <EmptyState
            icon={<ShoppingCartIcon className="mx-auto w-12 h-12 text-slate-400" />}
            title="Keranjang kosong"
            description="Silakan pilih layanan untuk menambah item."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {item.serviceName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {item.quantity} x Rp {item.price.toLocaleString('id-ID')} / {item.unit}
                </div>
              </div>
              <div className="font-semibold text-right text-slate-700 dark:text-slate-200 min-w-[90px]">
                Rp {item.subtotal.toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Area Total (Selalu di Bawah) */}
    {items.length > 0 && (
      <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4 space-y-2 text-sm flex-shrink-0">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-red-600 dark:text-red-400">
          <span>Diskon</span>
          <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span>Pajak</span>
          <span>+ Rp {taxAmount.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-slate-200 dark:border-slate-700 pt-2">
          <span>Total</span>
          <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span>Status Pembayaran</span>
          <span
            className={
              paymentStatus === PaymentStatus.Paid
                ? 'text-green-600 font-semibold'
                : 'text-red-600 font-semibold'
            }
          >
            {paymentStatus === PaymentStatus.Paid ? 'Lunas' : 'Belum Lunas'}
          </span>
        </div>
      </div>
    )}
  </div>
);

// --- KOMPONEN UTAMA ---

function NewTransactionPage() {
  // WhatsApp modal state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const { settings, isLoading: isLoadingSettings } = useSettings();
  const { currentUser, selectedStoreId } = useAppContext();
  const { services, isLoading: isLoadingServices, error: servicesError } = useServices();
  const { customers, addCustomer } = useCustomers();
  const { addTransaction } = useTransactions();
  const { addAuditLog } = useAuditLogs();

  // --- STATE LOKAL ---
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [isPayingNow, setIsPayingNow] = useState(false);
  const [amountPaidStr, setAmountPaidStr] = useState('');
  const [tenderedAmountStr, setTenderedAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newlyCreatedTransaction, setNewlyCreatedTransaction] = useState<Transaction | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isKiloanTaggingModalOpen, setIsKiloanTaggingModalOpen] = useState(false);

  // --- MEMO & EFFECT UNTUK KALKULASI ---

  const currentStoreId = useMemo(() => {
    return currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
  }, [currentUser, selectedStoreId]);

  const canApplyDiscount = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.SuperAdmin) return true;
    if (currentUser.role === UserRole.Admin) return true;
    if (currentUser.role === UserRole.Cashier) return currentUser.canGiveDiscount;
    return false;
  }, [currentUser]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (discountType === 'percent') {
      return subtotal * (val / 100);
    }
    return Math.min(val, subtotal);
  }, [subtotal, discountValue, discountType]);

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
    } else {
      setAmountPaidStr('');
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
    if (grandTotal <= 0) return PaymentStatus.Paid; // Lunas jika total 0
    if (actualAmountPaid <= 0) return PaymentStatus.Unpaid;
    if (actualAmountPaid >= grandTotal) return PaymentStatus.Paid;
    return PaymentStatus.Unpaid; // Tidak ada bayar sebagian
  }, [isPayingNow, actualAmountPaid, grandTotal]);

  const estimatedCompletionDate = useMemo(() => {
    if (items.length === 0) {
      const today = new Date();
      today.setDate(today.getDate() + 1); // Default 1 hari
      return today;
    }
    const maxDuration = Math.max(
      ...items.map((item) => services.find((s) => s.id === item.serviceId)?.durationDays || 0),
    );
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + maxDuration);
    return completionDate;
  }, [items, services]);

  // Efek untuk diskon default
  useEffect(() => {
    let applied = false;
    if (
      selectedCustomer &&
      selectedCustomer.defaultDiscount &&
      selectedCustomer.defaultDiscount > 0
    ) {
      setDiscountType('percent');
      setDiscountValue(selectedCustomer.defaultDiscount);
      // Tampilkan toast HANYA jika diskon pelanggan diterapkan
      const timerId = setTimeout(() => {
        if (selectedCustomer) {
          addToast(
            `Diskon ${selectedCustomer.defaultDiscount}% otomatis diterapkan untuk ${selectedCustomer.name}.`,
            'info',
          );
        }
      }, 0);
      return () => clearTimeout(timerId);
    } else {
      setDiscountType('percent');
      setDiscountValue(settings?.discountRate ?? 0);
    }
  }, [selectedCustomer, settings?.discountRate, addToast]);

  // --- HANDLER ---

  const handleAddService = useCallback(
    (service: Service) => {
      const existingItemIndex = items.findIndex((item) => item.serviceId === service.id);
      const isKiloan = service.category === ServiceCategory.Kiloan;

      if (existingItemIndex > -1 && isKiloan) {
        addToast('Item kiloan sudah ada. Ubah beratnya di keranjang.', 'info');
        return;
      }

      setItems((currentItems) => {
        if (existingItemIndex > -1 && !isKiloan) {
          // Item satuan, tambah jumlah
          const updatedItems = [...currentItems];
          const currentItem = updatedItems[existingItemIndex];
          currentItem.quantity += 1;
          currentItem.subtotal = currentItem.price * currentItem.quantity;
          return updatedItems;
        } else {
          // Item baru
          const newItem: TransactionItem = {
            serviceId: service.id,
            serviceName: service.name,
            price: service.price,
            unit: service.unit,
            quantity: 1,
            subtotal: service.price * 1,
            itemDetails: [], // Inisialisasi
          };
          return [...currentItems, newItem];
        }
      });
    },
    [items, addToast],
  );

  const handleItemChange = (index: number, field: 'quantity', value: number) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      const item = updatedItems[index];
      if (field === 'quantity') {
        item.quantity = value;
        item.subtotal = item.price * value;
      }
      return updatedItems;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const handleOpenNotesModal = (index: number) => {
    setEditingItemIndex(index);
    setIsNotesModalOpen(true);
  };

  const handleSaveNotes = (itemDetails: TransactionItemDetail[]) => {
    if (editingItemIndex === null) return;
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[editingItemIndex].itemDetails = itemDetails;
      return updatedItems;
    });
    setIsNotesModalOpen(false);
    setEditingItemIndex(null);
  };

  const handleOpenKiloanTaggingModal = (index: number) => {
    setEditingItemIndex(index);
    setIsKiloanTaggingModalOpen(true);
  };

  const handleSaveKiloanTags = (tags: string) => {
    if (editingItemIndex === null) return;
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[editingItemIndex].taggedItems = tags;
      return updatedItems;
    });
    setIsKiloanTaggingModalOpen(false);
    setEditingItemIndex(null);
  };

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'storeId'>) => {
    if (!currentStoreId || currentStoreId === 'all') {
      addToast('Cabang tidak valid untuk menambah pelanggan.', 'error');
      return;
    }
    const toastId = addToast('Menyimpan pelanggan...', 'info');
    setIsSubmitting(true);
    try {
      const newCustomer = await addCustomer({ ...customerData, storeId: currentStoreId });
      if (newCustomer) {
        addAuditLog(`Menambahkan pelanggan baru: "${newCustomer.name}".`, currentStoreId);
        addToast('Pelanggan baru berhasil ditambahkan!', 'success');
        setSelectedCustomer(newCustomer);
        setIsCustomerModalOpen(false);
      } else {
        throw new Error('Gagal mengembalikan data pelanggan baru.');
      }
    } catch (error: any) {
      addToast(`Gagal menyimpan: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomer) {
      addToast('Silakan pilih pelanggan.', 'error');
      return;
    }
    if (items.length === 0) {
      addToast('Keranjang masih kosong.', 'error');
      return;
    }
    if (!currentStoreId || currentStoreId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk membuat transaksi.', 'error');
      return;
    }
    if (isPayingNow && amountToPay < grandTotal) {
      addToast('Jumlah bayar tidak boleh kurang dari sisa tagihan.', 'error');
      return;
    }
    if (isPayingNow && paymentMethod === PaymentMethod.Cash && tenderedAmount < amountToPay) {
      addToast('Uang tunai yang diterima kurang.', 'error');
      return;
    }

    setIsSubmitting(true);
    const toastId = addToast('Menyimpan transaksi...', 'info');

    const newTransaction: Omit<Transaction, 'id'> = {
      customerId: selectedCustomer.id,
      items: items,
      subtotal: subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paymentStatus: paymentStatus,
      orderStatus: OrderStatus.Processing, // Sesuaikan dengan tipe OrderStatus
      createdAt: new Date(),
      estimatedCompletionDate: estimatedCompletionDate,
      amountPaid: actualAmountPaid,
      change: changeAmount,
      paymentMethod: isPayingNow ? paymentMethod : undefined,
      createdByUserId: currentUser.id,
      storeId: currentStoreId,
      notes: notes || undefined,
    };

    try {
      const createdTx = await addTransaction(newTransaction);
      if (createdTx) {
        addAuditLog(
          `Membuat transaksi baru: ${createdTx.id} untuk ${selectedCustomer.name}.`,
          currentStoreId,
        );
        addToast('Transaksi berhasil disimpan!', 'success');
        setNewlyCreatedTransaction(createdTx);
        setIsSuccessModalOpen(true);
      } else {
        throw new Error('Gagal membuat transaksi.');
      }
    } catch (error: any) {
      addToast(`Gagal menyimpan: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler untuk modal sukses
  const handleNewTransaction = () => {
    setItems([]);
    setSelectedCustomer(null);
    setDiscountValue(0);
    setDiscountType('percent');
    setIsPayingNow(false);
    setAmountPaidStr('');
    setTenderedAmountStr('');
    setPaymentMethod(PaymentMethod.Cash);
    setNotes('');
    setNewlyCreatedTransaction(null);
    setIsSuccessModalOpen(false);
  };

  const handleViewTransactions = () => {
    navigate('/transactions');
  };

  const handleCloseWhatsAppModal = () => {
    setIsWhatsAppModalOpen(false);
    setNewlyCreatedTransaction(null);
  };

  // --- RENDER LOGIC ---

  let content: React.ReactNode = null;
  if (isLoadingServices || isLoadingSettings) {
    content = (
      <div className="flex justify-center items-center w-full h-96">
        <SpinnerIcon className="w-16 h-16" />
        <span className="sr-only">Memuat data...</span>
      </div>
    );
  } else if (servicesError || !settings) {
    content = (
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Gagal Memuat Data
        </h2>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          {servicesError
            ? 'Tidak dapat memuat daftar layanan.'
            : 'Tidak dapat memuat pengaturan aplikasi.'}
          <br />
          Pastikan koneksi internet dan database Supabase Anda aktif.
        </p>
      </div>
    );
  } else {
    // --- INI ADALAH KONTEN HALAMAN JIKA SUKSES LOAD ---
    content = (
      <>
        <form onSubmit={handleSubmit}>
          {/* PERBAIKAN LAYOUT: 
            1. Menghapus 'h-screen' dan 'overflow-hidden' dari grid utama.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PERBAIKAN LAYOUT: 
              2. Kolom kiri (lg:col-span-2) sekarang tidak memiliki 'overflow-y-auto'.
                 Seluruh halaman akan scroll jika kontennya panjang.
            */}
            <div className="lg:col-span-2 flex flex-col gap-6 p-4 pb-32 lg:pb-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md mb-0">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                  Pilih Layanan
                </h2>
                <ServiceSelector services={services} onAddService={handleAddService} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">
                  Item Transaksi
                </h2>
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
                      {items.length > 0 ? (
                        items.map((item, index) => {
                          const service = services.find((s) => s.id === item.serviceId);
                          const isSatuan = service?.category === ServiceCategory.Satuan;
                          const isKiloan = service?.category === ServiceCategory.Kiloan;
                          return (
                            <tr key={index} className="border-b dark:border-slate-700">
                              <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                                {item.serviceName}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    step={item.unit === 'kg' ? '0.01' : '1'}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        'quantity',
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-24 bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                  />
                                  <span className="ml-2 text-base text-slate-500 dark:text-slate-400">
                                    {item.unit}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex items-center justify-center">
                                  {isSatuan && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNotesModal(index)}
                                      title="Catatan per Item"
                                      className="p-2 text-blue-600 hover:text-blue-900 relative rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                      <MessageSquareIcon className="w-6 h-6" />
                                      {item.itemDetails
                                        ?.slice(0, item.quantity)
                                        .some((d) => d.note) && (
                                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800"></span>
                                      )}
                                    </button>
                                  )}
                                  {isKiloan && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKiloanTaggingModal(index)}
                                      title="Tag Item Kiloan"
                                      className="p-2 text-purple-600 hover:text-purple-900 relative rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                      <TagIcon className="w-6 h-6" />
                                      {item.taggedItems && (
                                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800"></span>
                                      )}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    title="Hapus Item"
                                    className="p-2 text-red-600 hover:text-red-900 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                  >
                                    <Trash2Icon className="w-6 h-6" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                Rp {item.subtotal.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-4 text-slate-500 dark:text-slate-400"
                          >
                            Belum ada layanan yang ditambahkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* PERBAIKAN LAYOUT: 
              3. Kolom kanan (lg:col-span-1) sekarang menjadi wrapper untuk container sticky.
                 - Diberi padding `p-4` agar sejajar dengan kolom kiri.
                 - 'hidden lg:block' untuk menyembunyikannya di mobile.
            */}
            <div className="lg:col-span-1 p-4 hidden lg:block">
              <div className="sticky top-6 flex flex-col gap-6">
                {/* --- UI YANG HILANG DITAMBAHKAN DI SINI --- */}

                {/* 1. Customer Selector */}
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
                  <CustomerSelector
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={setSelectedCustomer}
                    onAddNewCustomer={() => setIsCustomerModalOpen(true)}
                  />
                </div>

                {/* 2. Cart Details (Sudah ada) */}
                <CartDetails
                  items={items}
                  subtotal={subtotal}
                  discountAmount={discountAmount}
                  taxAmount={taxAmount}
                  grandTotal={grandTotal}
                  paymentStatus={paymentStatus}
                />

                {/* 3. Kolom Diskon & Catatan */}
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-4">
                  <div>
                    <label
                      htmlFor="notes"
                      className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                    >
                      Catatan Transaksi (Opsional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="Contoh: Ambil setelah jam 5 sore"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="discountValue"
                      className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                    >
                      Diskon
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        id="discountValue"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        disabled={!canApplyDiscount}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-l-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-600"
                      />
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
                        disabled={!canApplyDiscount}
                        className="bg-slate-100 border border-l-0 border-slate-300 text-slate-900 text-base rounded-r-lg block p-3 dark:bg-slate-600 dark:border-slate-600 dark:text-white"
                      >
                        <option value="percent">%</option>
                        <option value="amount">Rp</option>
                      </select>
                    </div>
                    {!canApplyDiscount && (
                      <p className="text-xs text-slate-500 mt-1">
                        Hanya Admin yang bisa mengubah diskon.
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Kolom Pembayaran */}
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-4">
                  <div className="flex items-center">
                    <input
                      id="isPayingNow"
                      type="checkbox"
                      checked={isPayingNow}
                      onChange={(e) => setIsPayingNow(e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <label
                      htmlFor="isPayingNow"
                      className="ml-3 text-lg font-medium text-slate-900 dark:text-white"
                    >
                      Bayar Sekarang
                    </label>
                  </div>

                  {isPayingNow && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="paymentMethod"
                          className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                        >
                          Metode Bayar
                        </label>
                        <select
                          id="paymentMethod"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        >
                          {Object.values(PaymentMethod).map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="amountPaid"
                          className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                        >
                          Jumlah Bayar (Rp)
                        </label>
                        <input
                          type="text"
                          id="amountPaid"
                          value={amountPaidStr}
                          onChange={(e) =>
                            setAmountPaidStr(formatRupiah(parseRupiah(e.target.value)))
                          }
                          className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      </div>
                      {paymentMethod === PaymentMethod.Cash && (
                        <div>
                          <label
                            htmlFor="tenderedAmount"
                            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                          >
                            Uang Diterima (Rp)
                          </label>
                          <input
                            type="text"
                            id="tenderedAmount"
                            value={tenderedAmountStr}
                            onChange={(e) =>
                              setTenderedAmountStr(formatRupiah(parseRupiah(e.target.value)))
                            }
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="Jumlah uang tunai"
                          />
                        </div>
                      )}
                      {changeAmount > 0 && (
                        <div className="flex justify-between text-lg font-medium text-green-700 dark:text-green-400">
                          <span>Kembalian:</span>
                          <span>Rp {formatRupiah(changeAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Tombol Submit */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !selectedCustomer ||
                    items.length === 0 ||
                    !currentStoreId ||
                    currentStoreId === 'all'
                  }
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-4 rounded-lg text-lg flex items-center justify-center disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <SpinnerIcon className="w-6 h-6" /> : 'Simpan Transaksi'}
                </button>
                {(!currentStoreId || currentStoreId === 'all') && (
                  <p className="text-xs text-red-500 text-center">
                    Pilih cabang spesifik di header untuk menyimpan.
                  </p>
                )}
              </div>
            </div>

            {/* PERBAIKAN LAYOUT: 
              4. Mobile Bottom Bar. Ini sudah 'fixed' jadi posisinya di DOM tidak masalah.
            */}
            <div
              className="lg:hidden flex justify-between items-center cursor-pointer bg-slate-50 dark:bg-slate-800 p-4 rounded-t-lg shadow-md border-t border-slate-200 dark:border-slate-700 fixed bottom-0 left-0 right-0 z-40"
              onClick={() => setIsMobileCartOpen(true)}
            >
              <div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {items.length} Item
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                className="text-blue-600 dark:text-blue-400 font-semibold px-4 py-2"
              >
                Lihat Detail & Bayar
              </button>
            </div>
          </div>
        </form>

        {/* --- MODALS --- */}

        {/* Modal keranjang mobile (Sekarang berisi SEMUA field, bukan hanya CartDetails) */}
        <Modal
          isOpen={isMobileCartOpen}
          onClose={() => setIsMobileCartOpen(false)}
          title="Detail & Pembayaran"
        >
          {/* PERBAIKAN: Modal mobile sekarang berisi semua field yang relevan 
            dari kolom kanan versi desktop.
          */}
          <div className="w-full max-w-lg mx-auto p-0">
            <div className="flex flex-col gap-4">
              {/* 1. Customer Selector */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <CustomerSelector
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  onAddNewCustomer={() => setIsCustomerModalOpen(true)}
                />
              </div>

              {/* 2. Cart Details (Versi non-mobile) */}
              <CartDetails
                items={items}
                subtotal={subtotal}
                discountAmount={discountAmount}
                taxAmount={taxAmount}
                grandTotal={grandTotal}
                paymentStatus={paymentStatus}
              />

              {/* 3. Kolom Diskon & Catatan */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm space-y-4">
                <div>
                  <label
                    htmlFor="notes-mobile"
                    className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                  >
                    Catatan Transaksi (Opsional)
                  </label>
                  <textarea
                    id="notes-mobile"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Contoh: Ambil setelah jam 5 sore"
                  />
                </div>
                <div>
                  <label
                    htmlFor="discountValue-mobile"
                    className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                  >
                    Diskon
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      id="discountValue-mobile"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      disabled={!canApplyDiscount}
                      className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-l-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-600"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
                      disabled={!canApplyDiscount}
                      className="bg-slate-100 border border-l-0 border-slate-300 text-slate-900 text-base rounded-r-lg block p-3 dark:bg-slate-600 dark:border-slate-600 dark:text-white"
                    >
                      <option value="percent">%</option>
                      <option value="amount">Rp</option>
                    </select>
                  </div>
                  {!canApplyDiscount && (
                    <p className="text-xs text-slate-500 mt-1">
                      Hanya Admin yang bisa mengubah diskon.
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Kolom Pembayaran */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm space-y-4">
                <div className="flex items-center">
                  <input
                    id="isPayingNow-mobile"
                    type="checkbox"
                    checked={isPayingNow}
                    onChange={(e) => setIsPayingNow(e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <label
                    htmlFor="isPayingNow-mobile"
                    className="ml-3 text-lg font-medium text-slate-900 dark:text-white"
                  >
                    Bayar Sekarang
                  </label>
                </div>

                {isPayingNow && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="paymentMethod-mobile"
                        className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                      >
                        Metode Bayar
                      </label>
                      <select
                        id="paymentMethod-mobile"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      >
                        {Object.values(PaymentMethod).map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="amountPaid-mobile"
                        className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                      >
                        Jumlah Bayar (Rp)
                      </label>
                      <input
                        type="text"
                        id="amountPaid-mobile"
                        value={amountPaidStr}
                        onChange={(e) =>
                          setAmountPaidStr(formatRupiah(parseRupiah(e.target.value)))
                        }
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                    {paymentMethod === PaymentMethod.Cash && (
                      <div>
                        <label
                          htmlFor="tenderedAmount-mobile"
                          className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                        >
                          Uang Diterima (Rp)
                        </label>
                        <input
                          type="text"
                          id="tenderedAmount-mobile"
                          value={tenderedAmountStr}
                          onChange={(e) =>
                            setTenderedAmountStr(formatRupiah(parseRupiah(e.target.value)))
                          }
                          className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          placeholder="Jumlah uang tunai"
                        />
                      </div>
                    )}
                    {changeAmount > 0 && (
                      <div className="flex justify-between text-lg font-medium text-green-700 dark:text-green-400">
                        <span>Kembalian:</span>
                        <span>Rp {formatRupiah(changeAmount)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Tombol Submit (di dalam modal) */}
              <button
                type="submit"
                onClick={(e) => {
                  handleSubmit(e as any); // Tipu TypeScript karena ini 'onClick' bukan 'onSubmit'
                  setIsMobileCartOpen(false); // Tutup modal saat submit
                }}
                disabled={
                  isSubmitting ||
                  !selectedCustomer ||
                  items.length === 0 ||
                  !currentStoreId ||
                  currentStoreId === 'all'
                }
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-4 rounded-lg text-lg flex items-center justify-center disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <SpinnerIcon className="w-6 h-6" /> : 'Simpan Transaksi'}
              </button>
              {(!currentStoreId || currentStoreId === 'all') && (
                <p className="text-xs text-red-500 text-center">
                  Pilih cabang spesifik di header untuk menyimpan.
                </p>
              )}
            </div>
          </div>
        </Modal>

        {isCustomerModalOpen && (
          <CustomerFormModal
            customer={null}
            onClose={() => setIsCustomerModalOpen(false)}
            onSave={handleSaveCustomer}
            disabled={isSubmitting}
          />
        )}
        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleViewTransactions}
          title="Transaksi Berhasil!"
          message="Transaksi baru telah berhasil dibuat."
          actions={[
            { text: 'Buat Transaksi Baru Lagi', onClick: handleNewTransaction, type: 'primary' },
            { text: 'Lihat Daftar Transaksi', onClick: handleViewTransactions, type: 'secondary' },
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
  }

  return <>{content}</>;
}

export default NewTransactionPage;
