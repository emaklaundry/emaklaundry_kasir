import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@/types';

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

// ...existing code...

// Seluruh kode revisi user akan menggantikan isi file ini

// ...kode revisi user...

// (Kode lengkap sudah diberikan user, akan ditempatkan di sini)

function NewTransactionPage() {
  // Handler for form submission
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: Implement transaction submission logic here
    addToast('Transaksi berhasil disimpan (dummy handler).', 'success');
  }
  const [newlyCreatedTransaction, setNewlyCreatedTransaction] = useState<any>(null);
  // Tutup modal WhatsApp
  function handleCloseWhatsAppModal() {
    setIsWhatsAppModalOpen(false);
  }
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  // Simpan tag item kiloan untuk item tertentu
  function handleSaveKiloanTags(tags: any) {
    if (editingItemIndex === null) return;
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      if (!updatedItems[editingItemIndex]) return updatedItems;
      updatedItems[editingItemIndex].taggedItems = tags;
      return updatedItems;
    });
    setIsKiloanTaggingModalOpen(false);
    setEditingItemIndex(null);
  }
  const [isKiloanTaggingModalOpen, setIsKiloanTaggingModalOpen] = useState(false);
  // Simpan catatan untuk item tertentu
  function handleSaveNotes(note: string) {
    if (editingItemIndex === null) return;
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      if (!updatedItems[editingItemIndex]) return updatedItems;
      // Asumsikan setiap item punya properti itemDetails: { note: string }[]
      if (!updatedItems[editingItemIndex].itemDetails) {
        updatedItems[editingItemIndex].itemDetails = [];
      }
      // Update note pada itemDetails[0] (atau sesuai kebutuhan)
      updatedItems[editingItemIndex].itemDetails[0] = {
        ...(updatedItems[editingItemIndex].itemDetails[0] || {}),
        note,
      };
      return updatedItems;
    });
    setIsNotesModalOpen(false);
    setEditingItemIndex(null);
  }
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  // Reset form untuk membuat transaksi baru lagi
  function handleNewTransaction() {
    setItems([]);
    setSelectedCustomer(null);
    setDiscountValue(0);
    setDiscountType('percent');
    setIsPayingNow(false);
    setAmountPaidStr('');
    setTenderedAmountStr('');
    setPaymentMethod(PaymentMethod.Cash);
    setIsSuccessModalOpen(false);
    // Tambahkan reset state lain jika diperlukan
  }
  // Navigasi ke daftar transaksi setelah transaksi berhasil
  function handleViewTransactions() {
    // Ganti dengan navigasi React Router jika tersedia
    window.location.href = '/transactions';
  }
  const { addToast } = useToasts();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { selectedStoreId } = useAppContext();
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const { settings, isLoading: isLoadingSettings, error: settingsError } = useSettings();
  const [isPayingNow, setIsPayingNow] = useState(false);
  const [amountPaidStr, setAmountPaidStr] = useState('');
  const [tenderedAmountStr, setTenderedAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const { services, isLoading: isLoadingServices, error: servicesError } = useServices();
  // Jangan return early, handle loading/error di variabel content
  const { currentUser } = useAppContext();
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  // Komponen internal untuk detail keranjang (reusable di desktop & modal mobile)
  // CartDetails baru: min-h-[45vh], flex-grow, area total sticky di bawah, EmptyState terpusat
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
      <div className="space-y-3 pr-2 overflow-y-auto max-h-[60vh] min-h-[45vh] flex-grow flex flex-col">
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

  // --- LOGIKA KONDISIONAL DIMULAI DI SINI ---
  let content: React.ReactNode = null;
  if (isLoadingServices) {
    content = (
      <div className="flex justify-center items-center w-full h-96">
        <SpinnerIcon className="w-16 h-16" />
        <span className="sr-only">Memuat layanan...</span>
      </div>
    );
  } else if (servicesError) {
    content = (
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Gagal Memuat Data Layanan
        </h2>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          Tidak dapat memuat daftar layanan. Pastikan koneksi internet dan database Supabase Anda
          aktif.
        </p>
      </div>
    );
  }

  const canApplyDiscount = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.SuperAdmin) return true;
    if (currentUser.role === UserRole.Admin || currentUser.role === UserRole.Cashier) {
      if (currentUser.canGiveDiscount) return true;
      if (
        selectedCustomer &&
        selectedCustomer.defaultDiscount &&
        selectedCustomer.defaultDiscount > 0
      )
        return true;
    }
    return false;
  }, [currentUser, selectedCustomer]);
  // Semua hook turunannya juga harus dipanggil di level atas
  // (dipindahkan dari bawah) agar Rules of Hooks tidak dilanggar.

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    let val = 0;
    let type = discountType;
    if (!canApplyDiscount) {
      // Pakai diskon dari pengaturan jika tidak boleh diskon
      val = settings?.discountRate ?? 0;
      type = 'percent';
    } else {
      val = Number(discountValue) || 0;
    }
    if (type === 'percent') {
      return subtotal * (val / 100);
    }
    return Math.min(val, subtotal);
  }, [subtotal, discountValue, discountType, canApplyDiscount, settings?.discountRate]);

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
    // Bayar sebagian hanya jika amountPaid > 0 dan < grandTotal
    // Jika jumlah bayar sama atau lebih besar dari total, Lunas.
    if (actualAmountPaid >= grandTotal) return PaymentStatus.Paid;
    // Jika kurang, dianggap Belum Lunas (Unpaid).
    return PaymentStatus.Unpaid;
  }, [isPayingNow, actualAmountPaid, grandTotal]);

  const estimatedCompletionDate = useMemo(() => {
    if (items.length === 0) {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      return today;
    }
    const maxDuration = Math.max(
      ...items.map((item) => services.find((s) => s.id === item.serviceId)?.durationDays || 0),
    );
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + maxDuration);
    return completionDate;
  }, [items, services]);

  const currentStoreId = useMemo(() => {
    return currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
  }, [currentUser, selectedStoreId]);

  useEffect(() => {
    if (!canApplyDiscount) {
      setDiscountType('percent');
      setDiscountValue(settings?.discountRate ?? 0);
      return;
    }
    if (
      selectedCustomer &&
      selectedCustomer.defaultDiscount &&
      selectedCustomer.defaultDiscount > 0
    ) {
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
        addToast(
          `Diskon ${selectedCustomer.defaultDiscount}% otomatis diterapkan untuk ${selectedCustomer.name}.`,
          'info',
        );
      }, 0);

      // Selalu bersihkan timer jika komponen unmount sebelum timeout berjalan
      return () => clearTimeout(timerId);
    }
  }, [canApplyDiscount, selectedCustomer, addToast]);

  const handleAddService = useCallback(
    (service: Service) => {
      // 1. Baca 'items' dari scope.
      const existingItemIndex = items.findIndex((item) => item.serviceId === service.id);
      const isKiloan = service.category === ServiceCategory.Kiloan;

      if (existingItemIndex > -1) {
        if (isKiloan) {
          // 2. Panggil addToast di luar 'setItems'. Ini adalah event handler biasa.
          addToast('Item kiloan sudah ada. Ubah beratnya di keranjang.', 'info');
          // 3. Tidak perlu update state, jadi kita 'return' lebih awal.
          return;
        }

        // Untuk item Satuan, kita update state seperti biasa.
        setItems((currentItems) => {
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
        setItems((currentItems) => [...currentItems, newItem]);
      }
    },
    [items, addToast],
  );

  // --- LOGIKA KONDISIONAL DIMULAI DI SINI ---
  // (Deklarasi duplikat dihapus)
  if (isLoadingServices) {
    content = (
      <div className="flex justify-center items-center w-full h-96">
        <SpinnerIcon className="w-16 h-16" />
        <span className="sr-only">Memuat layanan...</span>
      </div>
    );
  } else if (servicesError) {
    content = (
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Gagal Memuat Data Layanan
        </h2>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          Tidak dapat memuat daftar layanan. Pastikan koneksi internet dan database Supabase Anda
          aktif.
        </p>
      </div>
    );
  } else if (isLoadingSettings) {
    content = (
      <div className="flex justify-center items-center w-full h-96">
        <SpinnerIcon className="w-16 h-16" />
        <span className="sr-only">Memuat pengaturan...</span>
      </div>
    );
  } else if (!settings) {
    content = (
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Gagal Memuat Pengaturan Aplikasi
        </h2>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          Tidak dapat memuat data pajak, diskon, dan lainnya. Pastikan Anda memiliki koneksi dan hak
          akses yang benar untuk melihat tabel 'settings'.
        </p>
      </div>
    );
  } else {
    content = (
      <>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen overflow-hidden">
            {/* Kolom 1-2: Pilih Layanan & Item Transaksi */}
            <div className="lg:col-span-2 flex flex-col gap-6 p-4 overflow-y-auto pb-32 lg:pb-4">
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

            {/* Kolom 3: Cart/Detail - Sticky di desktop, bottom sheet di mobile */}
            <div className="lg:col-span-1 flex flex-col">
              {/* Desktop: sticky sidebar */}
              <div className="hidden lg:block h-full">
                <div className="sticky top-6">
                  <CartDetails
                    items={items}
                    subtotal={subtotal}
                    discountAmount={discountAmount}
                    taxAmount={taxAmount}
                    grandTotal={grandTotal}
                    paymentStatus={paymentStatus}
                  />
                </div>
              </div>
              {/* Mobile: sticky ringkasan & tombol (trigger modal) */}
              <div
                className="lg:hidden flex justify-between items-center cursor-pointer bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-md border-t fixed bottom-0 left-0 right-0 z-40"
                onClick={() => setIsMobileCartOpen(true)}
              >
                <div>
                  <span className="font-semibold text-blue-600">{items.length} Item</span>
                  <p className="text-lg font-bold">{formatRupiah(grandTotal)}</p>
                </div>
                <button className="text-blue-600 font-semibold px-4 py-2">Lihat Detail</button>
              </div>
            </div>
            {/* Modal keranjang mobile */}
            <Modal
              isOpen={isMobileCartOpen}
              onClose={() => setIsMobileCartOpen(false)}
              title="Detail Pesanan"
            >
              <div className="w-full max-w-sm mx-auto p-4">
                <CartDetails
                  items={items}
                  subtotal={subtotal}
                  discountAmount={discountAmount}
                  taxAmount={taxAmount}
                  grandTotal={grandTotal}
                  paymentStatus={paymentStatus}
                  isMobileCartOpen={isMobileCartOpen}
                  onCloseMobileCart={() => setIsMobileCartOpen(false)}
                />
              </div>
            </Modal>
          </div>
          {isCustomerModalOpen && (
            <CustomerFormModal
              customer={null}
              onClose={() => setIsCustomerModalOpen(false)}
              onSave={handleSaveCustomer}
            />
          )}
        </form>
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
