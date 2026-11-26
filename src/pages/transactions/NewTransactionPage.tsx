import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { generateUUID } from '../../utils';
import { supabase } from '../../utils/supabaseClient';
import { EditIcon, SpinnerIcon } from '../../components/icons';
import { can } from '../../config/permissions';
import SuccessModal from '../../components/SuccessModal';
import { useTransactions } from '../../contexts/TransactionContext';
import {
  ALL_CUSTOMERS_QUERY_KEY,
  fetchAllCustomers,
  findCustomerByPhone,
  useCustomerMutations,
} from '../../contexts/CustomerContext';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useServices } from '../../contexts/ServiceContext';
import ItemNotesModal from '../../components/ItemNotesModal';
import useAppContext from '../../contexts/useAppContext';
import { formatRupiah, parseRupiah } from '../../utils/formatting';
import CustomerSelector from '../../components/features/CustomerSelector';
import ServiceSelector from '../../components/features/ServiceSelector';
import TransactionItemsTable from '../../components/features/TransactionItemsTable';
import CustomerFormModal from '../../components/CustomerFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';
import WhatsAppModal from '../../components/WhatsAppModal';
import KiloanTaggingModal from '../../components/KiloanTaggingModal';
import {
  ExtendedTransactionItem,
  PaymentStatus,
  OrderStatus,
  Customer,
  ServiceCategory,
  UserRole,
  PaymentMethod,
  Transaction,
  Service,
} from '@/types';

const NewTransactionPage: React.FC = () => {
  // --- SEMUA HOOK HARUS DI ATAS SINI ---
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const queryClient = useQueryClient();
  const { data: customersData } = useQuery({
    queryKey: ALL_CUSTOMERS_QUERY_KEY,
    queryFn: fetchAllCustomers,
    // PENTING: nonaktifkan auto-refetch saat user sedang input data
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 menit - data customer jarang berubah
  });
  const customers: Customer[] = Array.isArray(customersData)
    ? customersData
    : (customersData?.data ?? []);
  const { addCustomer, updateCustomer } = useCustomerMutations();
  const [confirm, confirmDialog] = useConfirmDialog();
  const { services } = useServices();
  const { currentUser, selectedStoreId } = useAppContext();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  // Ganti tipe state items menjadi ExtendedTransactionItem[]
  const [items, setItems] = useState<ExtendedTransactionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  // Pelanggan terpilih yang sedang diubah datanya (nama, nomor HP, dll).
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState<{ note: string }[]>([]);
  const [isKiloanTaggingModalOpen, setIsKiloanTaggingModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [newlyCreatedTransaction, setNewlyCreatedTransaction] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPayingNow, setIsPayingNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [tenderedAmountStr, setTenderedAmountStr] = useState('');
  // State untuk idempotencyKey
  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateUUID());
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  // Total = jumlah harga layanan. Tidak ada diskon, pajak, maupun pembulatan.
  const grandTotal = subtotal;

  // Place handleAddService after all hooks, before conditional rendering
  const [showKiloanToast, setShowKiloanToast] = useState(false);
  // --- MODIFIKASI: handleAddService ---
  const handleAddService = useCallback((service: Service) => {
    const isKiloan = service.category === ServiceCategory.Kiloan;
    const isMeter = service.unit.toLowerCase() === 'm2' || service.unit.toLowerCase() === 'meter';
    let shouldShowToast = false;
    setItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex((item) => item.serviceId === service.id);
      if (existingItemIndex > -1) {
        if (isKiloan) {
          shouldShowToast = true;
          return currentItems;
        }
        const updatedItems = [...currentItems];
        const currentItem = updatedItems[existingItemIndex];
        currentItem.quantity += 1;
        currentItem.subtotal = currentItem.price * currentItem.quantity;
        // FIX: Sinkronkan itemDetails jika kategori Satuan
        if (!isKiloan && !isMeter) {
          const currentNotes = currentItem.itemDetails || [];
          if (currentNotes.length < currentItem.quantity) {
            currentItem.itemDetails = [...currentNotes, { note: '' }];
          }
        }
        return updatedItems;
      } else {
        const newItem: ExtendedTransactionItem = {
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          unit: service.unit,
          quantity: 1,
          subtotal: service.price * 1,
          length: isMeter ? 1 : undefined,
          width: isMeter ? 1 : undefined,
          // Tambahkan itemDetails kosong jika Satuan
          ...(!isKiloan && !isMeter ? { itemDetails: [{ note: '' }] } : {}),
        };
        return [...currentItems, newItem];
      }
    });
    if (isKiloan) setShowKiloanToast(shouldShowToast);
  }, []);

  useEffect(() => {
    if (showKiloanToast) {
      addToast('Item kiloan sudah ada. Ubah beratnya di keranjang.', 'info');
      setShowKiloanToast(false);
    }
  }, [showKiloanToast, addToast]);

  const tenderedAmount = useMemo(() => parseRupiah(tenderedAmountStr), [tenderedAmountStr]);

  const changeAmount = useMemo(() => {
    if (!isPayingNow || paymentMethod !== PaymentMethod.Cash || tenderedAmount < grandTotal) {
      return 0;
    }
    return tenderedAmount - grandTotal;
  }, [isPayingNow, paymentMethod, tenderedAmount, grandTotal]);

  const actualAmountPaid = isPayingNow ? grandTotal : 0;

  const paymentStatus = useMemo(() => {
    if (!isPayingNow) return PaymentStatus.Unpaid;
    if (grandTotal <= 0) return PaymentStatus.Paid;

    // Toleransi untuk floating point arithmetic
    const paid = actualAmountPaid;
    const total = grandTotal;

    if (Math.abs(paid - total) < 0.01) return PaymentStatus.Paid;
    if (paid >= total) return PaymentStatus.Paid;
    if (paid > 0) return PaymentStatus.Unpaid; // Partial payment still counts as Unpaid

    return PaymentStatus.Unpaid;
  }, [isPayingNow, grandTotal, actualAmountPaid]);

  const currentStoreId = useMemo(() => {
    return currentUser && currentUser.role === UserRole.SuperAdmin
      ? selectedStoreId
      : currentUser?.storeId;
  }, [currentUser, selectedStoreId]);

  // --- MODIFIKASI: handleItemChange ---
  const handleItemChange = (
    index: number,
    field: 'quantity' | 'taggedItems' | 'itemDetails' | 'length' | 'width',
    value: number | string | Array<{ note: string }>,
  ) => {
    const newItems = [...items];
    const item = newItems[index];
    const service = services.find((s) => s.id === item.serviceId);

    if ((field === 'length' || field === 'width') && typeof value === 'number') {
      const val = value >= 0 ? value : 0;
      if (field === 'length') item.length = val;
      if (field === 'width') item.width = val;
      const l = item.length || 0;
      const w = item.width || 0;
      // FIXED: Prevent submitting with zero area
      const area = l > 0 && w > 0 ? parseFloat((l * w).toFixed(2)) : 0;
      item.quantity = area;
      item.subtotal = item.price * item.quantity;
    } else if (field === 'quantity' && typeof value === 'number') {
      const newQuantity = value >= 0 ? value : 0;
      item.quantity = newQuantity;
      const price = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
      item.subtotal = price * item.quantity;
      if (service && service.category === ServiceCategory.Satuan) {
        const currentNotes = item.itemDetails || [];
        if (currentNotes.length < newQuantity) {
          const newNotes = [
            ...currentNotes,
            ...Array.from({ length: newQuantity - currentNotes.length }, () => ({ note: '' })),
          ];
          item.itemDetails = newNotes;
        } else {
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
    const item = items[index];
    const allNotes = item?.itemDetails || [];
    const initialNotes = Array.from(
      { length: item.quantity },
      (_, i) => allNotes[i] || { note: '' },
    );
    setEditingNotes(initialNotes);
    setIsNotesModalOpen(true);
  };

  const handleOpenKiloanTaggingModal = (index: number) => {
    setEditingItemIndex(index);
    setIsKiloanTaggingModalOpen(true);
  };

  const handleSaveNotes = (notes: { note: string }[]) => {
    if (editingItemIndex !== null) {
      handleItemChange(editingItemIndex, 'itemDetails', notes);
    }
    setEditingItemIndex(null);
    setIsNotesModalOpen(false);
    setEditingNotes([]);
  };

  const handleSaveKiloanTags = (tags: string) => {
    if (editingItemIndex !== null) {
      handleItemChange(editingItemIndex, 'taggedItems', tags);
    }
    setEditingItemIndex(null);
    setIsKiloanTaggingModalOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveCustomer = async (customer: Omit<Customer, 'id' | 'storeId' | 'createdAt'>) => {
    if (!currentStoreId || currentStoreId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk menambah pelanggan.', 'warning');
      return;
    }
    // Nomor HP sudah terdaftar? Tawarkan pakai pelanggan lama daripada gagal disimpan.
    try {
      const existing = await findCustomerByPhone(customer.phone, currentStoreId);
      if (existing) {
        const usePrevious = await confirm({
          title: 'Nomor Sudah Terdaftar',
          message: `Nomor ${existing.phone} sudah terdaftar atas nama "${existing.name}". Pakai pelanggan ini untuk transaksi?`,
          confirmText: 'Pakai Pelanggan Ini',
          confirmVariant: 'primary',
        });
        if (usePrevious) {
          setSelectedCustomer(existing);
          setIsCustomerModalOpen(false);
          addToast(`Pelanggan "${existing.name}" dipilih.`, 'success');
        }
        // Batal: form tetap terbuka agar nomor bisa dibetulkan.
        return;
      }
    } catch {
      // Pengecekan gagal (mis. koneksi): lanjut simpan, database tetap menolak nomor ganda.
    }

    const toastId = addToast('Menambah pelanggan...', 'info');
    try {
      const newCustomer = await addCustomer({
        ...customer,
        createdAt: new Date(),
        storeId: currentStoreId,
      });
      if (newCustomer) {
        // Map Supabase customer (nullable fields) to app Customer type
        setSelectedCustomer({
          id: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone ?? '',
          address: newCustomer.address ?? '',
          notes: newCustomer.notes ?? '',
          storeId: newCustomer.storeId ?? '',
          createdAt: newCustomer.createdAt ? new Date(newCustomer.createdAt) : new Date(),
        });
        setIsCustomerModalOpen(false);
        updateToast(toastId, 'Pelanggan berhasil ditambahkan!', 'success');
      } else {
        updateToast(toastId, 'Gagal menambah pelanggan: Data tidak valid.', 'error');
      }
    } catch (error: unknown) {
      let msg = 'Unknown error';
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string'
      ) {
        msg = (error as { message: string }).message;
      }
      updateToast(toastId, `Gagal menambah pelanggan: ${msg}`, 'error');
    }
  };

  const handleUpdateSelectedCustomer = async (
    data: Omit<Customer, 'id' | 'storeId' | 'createdAt'>,
  ) => {
    const target = editingCustomer;
    if (!target) return;
    const storeId = target.storeId || currentStoreId;

    // Nomor baru dipakai pelanggan lain? Beri tahu pemiliknya sebelum database menolak.
    if (storeId && storeId !== 'all') {
      const owner = await findCustomerByPhone(data.phone, storeId).catch(() => null);
      if (owner && owner.id !== target.id) {
        addToast(
          `Nomor ${owner.phone} sudah terdaftar atas nama "${owner.name}". Gunakan nomor lain.`,
          'error',
        );
        return;
      }
    }

    const toastId = addToast('Menyimpan perubahan pelanggan...', 'info');
    try {
      const updated = await updateCustomer(target.id, {
        name: data.name,
        phone: data.phone || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
      });
      setSelectedCustomer({
        ...target,
        name: updated?.name ?? data.name,
        phone: updated?.phone ?? '',
        address: updated?.address ?? '',
        notes: updated?.notes ?? '',
      });
      addAuditLog(`Memperbarui data pelanggan: "${data.name}".`, storeId);
      setEditingCustomer(null);
      updateToast(toastId, 'Data pelanggan berhasil diperbarui!', 'success');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (error as { message?: string })?.message;
      updateToast(toastId, `Gagal menyimpan: ${msg ?? 'Unknown error'}`, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) {
      addToast('Transaksi sedang disimpan, mohon tunggu...', 'warning');
      return;
    }

    if (!currentStoreId || currentStoreId === 'all') {
      const msg =
        currentUser?.role === UserRole.SuperAdmin
          ? 'Super Admin harus memilih cabang spesifik.'
          : 'Data cabang Anda tidak valid. Silakan relogin.';
      addToast(msg, 'warning');
      return;
    }
    if (!selectedCustomer) {
      addToast('Pelanggan harus dipilih.', 'warning');
      return;
    }
    if (items.length === 0) {
      addToast('Minimal satu layanan harus ditambahkan.', 'warning');
      return;
    }

    // Prevent double submission
    setIsSaving(true);

    if (isPayingNow) {
      if (!paymentMethod) {
        addToast('Pilih metode pembayaran.', 'error');
        setIsSaving(false);
        return;
      }
      if (paymentMethod === PaymentMethod.Cash && tenderedAmount < grandTotal) {
        addToast(`Uang diterima kurang. Tagihan Rp ${formatRupiah(grandTotal)}.`, 'error');
        setIsSaving(false);
        return;
      }
    }

    const toastId = addToast('Menyimpan transaksi ke database...', 'info');
    try {
      // --- PERBAIKAN: Hitung waktu saat tombol ditekan ---
      const now = new Date(); // Waktu Masuk (Real-time)

      // Hitung Estimasi Selesai berdasarkan item yang dipilih
      let maxDurationDays = 0;
      if (items.length === 0) {
        maxDurationDays = 1; // Default 1 hari jika tidak ada item
      } else {
        maxDurationDays = Math.max(
          ...items.map((item) => {
            const service = services.find((s) => s.id === item.serviceId);
            return service && service.durationDays ? service.durationDays : 0;
          }),
        );
      }
      const completionDate = new Date(now);
      completionDate.setDate(completionDate.getDate() + maxDurationDays);
      // ---------------------------------------------------

      // Sanitasi itemDetails agar tidak ada zombie notes
      const cleanedItems = items.map((item) => ({
        ...item,
        itemDetails: item.itemDetails
          ? item.itemDetails.slice(0, item.quantity).map((detail) => ({ note: detail.note || '' }))
          : [],
      }));
      const newTransaction: Omit<Transaction, 'id'> = {
        customerId: selectedCustomer.id,
        items: cleanedItems,
        subtotal,
        discount: 0,
        tax: 0,
        total: grandTotal,
        paymentStatus,
        orderStatus: OrderStatus.Processing,
        // --- UPDATE: Gunakan variabel waktu yang baru dihitung ---
        createdAt: now,
        estimatedCompletionDate: completionDate.toISOString(),
        // --------------------------------------------------------
        notes,
        amountPaid: actualAmountPaid,
        change: changeAmount,
        paymentMethod: isPayingNow && actualAmountPaid > 0 ? paymentMethod : undefined,
        createdByUserId: currentUser?.id ?? '',
        storeId: currentStoreId,
        idempotencyKey: idempotencyKey,
      };
      const savedTransaction = await addTransaction(newTransaction);

      // Update toast untuk verifikasi
      updateToast(toastId, 'Memverifikasi data tersimpan...', 'info');

      if (savedTransaction) {
        // Map Supabase transaction (JSON fields, dates) to app Transaction type
        const tx: Transaction = {
          ...savedTransaction,
          customerId: savedTransaction.customerId ?? '',
          createdByUserId: savedTransaction.createdByUserId ?? '',
          storeId: savedTransaction.storeId ?? '',
          notes: savedTransaction.notes ?? undefined,
          idempotencyKey: savedTransaction.idempotencyKey ?? undefined,
          items: Array.isArray(savedTransaction.items)
            ? (savedTransaction.items as unknown as import('../../types').TransactionItem[]).map(
                (item) => ({
                  ...item,
                  itemDetails: item.itemDetails ?? [],
                }),
              )
            : [],
          createdAt: savedTransaction.createdAt ? new Date(savedTransaction.createdAt) : new Date(),
          estimatedCompletionDate: savedTransaction.estimatedCompletionDate ?? '',
          invoiceCode: savedTransaction.invoiceCode ?? undefined,
          paymentStatus: savedTransaction.paymentStatus as PaymentStatus,
          orderStatus: savedTransaction.orderStatus as OrderStatus,
          paymentMethod: savedTransaction.paymentMethod
            ? (savedTransaction.paymentMethod as PaymentMethod)
            : undefined,
        };
        addAuditLog(
          `Membuat transaksi baru untuk pelanggan ${selectedCustomer.name}.`,
          currentStoreId,
        );

        await queryClient.invalidateQueries({ queryKey: ['transaction', tx.id] });
        setNewlyCreatedTransaction(tx);
        setIsWhatsAppModalOpen(true);
        updateToast(toastId, 'Transaksi berhasil disimpan dan terverifikasi.', 'success');
      } else {
        throw new Error('Tidak ada data yang dikembalikan dari server');
      }
    } catch (error: unknown) {
      // Tangani error duplikat idempotencyKey
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === '23505' &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string' &&
        (error as { message: string }).message.includes('idempotencyKey')
      ) {
        // Fetch ulang transaksi existing berdasarkan idempotencyKey
        const { data: existingTx } = await supabase
          .from('transactions')
          .select('*')
          .eq('idempotencyKey', idempotencyKey)
          .single();
        if (existingTx) {
          // Map Supabase transaction (JSON fields, dates) to app Transaction type
          const tx: Transaction = {
            ...existingTx,
            customerId: existingTx.customerId ?? '',
            createdByUserId: existingTx.createdByUserId ?? '',
            storeId: existingTx.storeId ?? '',
            notes: existingTx.notes ?? undefined,
            idempotencyKey: existingTx.idempotencyKey ?? undefined,
            items: Array.isArray(existingTx.items)
              ? (existingTx.items as unknown as import('../../types').TransactionItem[]).map(
                  (item) => ({
                    ...item,
                    itemDetails: item.itemDetails ?? [],
                  }),
                )
              : [],
            createdAt: existingTx.createdAt ? new Date(existingTx.createdAt) : new Date(),
            estimatedCompletionDate: existingTx.estimatedCompletionDate ?? '',
            invoiceCode: existingTx.invoice_code ?? undefined,
            paymentStatus: existingTx.paymentStatus as PaymentStatus,
            orderStatus: existingTx.orderStatus as OrderStatus,
            paymentMethod: existingTx.paymentMethod
              ? (existingTx.paymentMethod as PaymentMethod)
              : undefined,
          };
          setNewlyCreatedTransaction(tx);
          setIsWhatsAppModalOpen(true);
        }
        updateToast(toastId, 'Transaksi berhasil disimpan (terdeteksi duplikat).', 'success');
        // setIsSuccessModalOpen(true); // Tetap biarkan di handleCloseWhatsAppModal
      } else {
        let msg = 'Unknown error';
        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message?: string }).message === 'string'
        ) {
          msg = (error as { message: string }).message;
        }
        updateToast(toastId, `Gagal menyimpan transaksi: ${msg}`, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseWhatsAppModal = () => {
    setIsWhatsAppModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  const handleNewTransaction = () => {
    // Reset all transaction-related state
    setSelectedCustomer(null);
    setItems([]);
    setNotes('');
    setIsCustomerModalOpen(false);
    setIsSuccessModalOpen(false);
    setIsNotesModalOpen(false);
    setIsKiloanTaggingModalOpen(false);
    setEditingItemIndex(null);
    setIsWhatsAppModalOpen(false);
    setNewlyCreatedTransaction(null);
    setIsSaving(false);
    setIsPayingNow(false);
    setPaymentMethod(undefined);
    setTenderedAmountStr('');
    setIdempotencyKey(generateUUID()); // Generate kunci baru untuk transaksi berikutnya
  };

  const handleViewTransactions = () => {
    setIsSuccessModalOpen(false);
    navigate('/transactions');
  };

  const handlePaymentOptionChange = (paying: boolean) => {
    setIsPayingNow(paying);
    if (!paying) {
      setPaymentMethod(undefined);
      setTenderedAmountStr('');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Pilih Layanan
              </h2>
              <ServiceSelector
                id="service-selector"
                services={services}
                onAddService={handleAddService}
              />
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">
                Item Transaksi
              </h2>
              <TransactionItemsTable
                id="transaction-items"
                items={items}
                services={services}
                handleItemChange={handleItemChange}
                handleOpenNotesModal={handleOpenNotesModal}
                handleOpenKiloanTaggingModal={handleOpenKiloanTaggingModal}
                handleRemoveItem={handleRemoveItem}
              />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div
              id="payment-section"
              className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md sticky top-24 overflow-visible"
            >
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">
                Detail & Total
              </h2>
              <div className="space-y-4">
                <CustomerSelector
                  id="customer-selector"
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  onAddNewCustomer={() => setIsCustomerModalOpen(true)}
                />
                {selectedCustomer && can(currentUser?.role, 'customer.edit') && (
                  <div className="-mt-2 flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="truncate">
                      {selectedCustomer.phone || 'Belum ada nomor HP'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(selectedCustomer)}
                      className="btn btn-ghost btn-sm flex-shrink-0"
                    >
                      <EditIcon className="w-4 h-4" />
                      Ubah data
                    </button>
                  </div>
                )}
                <div id="notes-section">
                  <label htmlFor="notes" className="form-label">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="form-input"
                  ></textarea>
                </div>
                <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                  <div className="flex justify-between items-center text-2xl font-semibold text-slate-900 dark:text-white pt-3 border-t dark:border-slate-600">
                    <span>Total:</span>
                    <span className="tabular-nums">Rp {formatRupiah(grandTotal)}</span>
                  </div>
                </div>

                <div>
                  <p id="payment-option-label" className="form-label">
                    Opsi Pembayaran
                  </p>
                  <div
                    role="group"
                    aria-labelledby="payment-option-label"
                    className="grid grid-cols-2 gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => handlePaymentOptionChange(false)}
                      aria-pressed={!isPayingNow}
                      className={`p-3 rounded-lg text-base border-2 ${!isPayingNow ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                      Bayar Nanti
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentOptionChange(true)}
                      aria-pressed={isPayingNow}
                      className={`p-3 rounded-lg text-base border-2 ${isPayingNow ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                      Bayar Sekarang
                    </button>
                  </div>
                </div>

                {isPayingNow && (
                  <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-4 mt-4 space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Pembayaran
                    </h3>
                    <div>
                      <p id="new-tx-method-label" className="form-label">
                        Metode Pembayaran
                      </p>
                      <div
                        role="group"
                        aria-labelledby="new-tx-method-label"
                        className="grid grid-cols-2 gap-2"
                      >
                        {Object.values(PaymentMethod).map((m) => (
                          <button
                            type="button"
                            key={m}
                            onClick={() => setPaymentMethod(m)}
                            aria-pressed={paymentMethod === m}
                            className={`p-3 rounded-lg text-base border-2 font-semibold transition-colors duration-200
                              ${
                                paymentMethod === m
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50 text-slate-900 dark:text-white'
                                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }
                            `}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    {paymentMethod === PaymentMethod.Cash && (
                      <div>
                        <label htmlFor="tenderedAmount" className="form-label">
                          Uang Diterima (Rp)
                        </label>
                        <input
                          type="text"
                          id="tenderedAmount"
                          name="tenderedAmount"
                          value={tenderedAmountStr}
                          onChange={(e) => {
                            const val = parseRupiah(e.target.value);
                            setTenderedAmountStr(val === 0 ? '' : formatRupiah(val));
                          }}
                          className="form-input text-lg"
                          placeholder="0"
                          disabled={false}
                          autoComplete="off"
                        />
                      </div>
                    )}
                    {changeAmount > 0 && (
                      <div className="flex justify-between items-center text-lg">
                        <span className="text-slate-600 dark:text-slate-300">Kembalian:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          Rp {formatRupiah(changeAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    (currentUser &&
                      currentUser.role === UserRole.SuperAdmin &&
                      selectedStoreId === 'all')
                      ? true
                      : undefined
                  }
                  className="btn btn-primary btn-lg w-full"
                >
                  {isSaving ? <SpinnerIcon className="w-6 h-6" /> : 'Simpan Transaksi'}
                </button>
                {currentUser &&
                  currentUser.role === UserRole.SuperAdmin &&
                  selectedStoreId === 'all' && (
                    <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
                      Pilih cabang spesifik di header untuk membuat transaksi.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
        {isCustomerModalOpen && (
          <CustomerFormModal
            customer={null}
            onClose={() => setIsCustomerModalOpen(false)}
            onSave={handleSaveCustomer}
          />
        )}
      </form>
      {/* Di luar <form>: tombol dialog konfirmasi tidak boleh ikut men-submit transaksi. */}
      {confirmDialog}
      {editingCustomer && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSave={handleUpdateSelectedCustomer}
        />
      )}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleViewTransactions}
        title="Transaksi Berhasil!"
        message={
          newlyCreatedTransaction?.invoiceCode
            ? `Transaksi (No. ${newlyCreatedTransaction.invoiceCode}) telah berhasil dibuat.`
            : 'Transaksi baru telah berhasil dibuat.'
        }
        actions={[
          { text: 'Buat Transaksi Baru Lagi', onClick: handleNewTransaction, type: 'primary' },
          { text: 'Lihat Daftar Transaksi', onClick: handleViewTransactions, type: 'secondary' },
        ]}
      />
      <ItemNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setEditingNotes([]);
        }}
        item={editingItemIndex !== null ? items[editingItemIndex] : null!}
        notes={editingNotes}
        setNotes={setEditingNotes}
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
