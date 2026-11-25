import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { generateUUID } from '../../utils';
import { supabase } from '../../utils/supabaseClient';
import { TagIcon, SpinnerIcon } from '../../components/icons';
import SuccessModal from '../../components/SuccessModal';
import { useSettings } from '../../contexts/SettingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import {
  fetchCustomerBalance,
  fetchCustomers,
  invalidateCustomerBalance,
  useCustomerBalance,
  useCustomerMutations,
} from '../../contexts/CustomerContext';
import { useServices } from '../../contexts/ServiceContext';
import ItemNotesModal from '../../components/ItemNotesModal';
import useAppContext from '../../contexts/useAppContext';
import { formatRupiah, parseRupiah } from '../../utils/formatting';
import { calculateCashRounding } from '../../utils/roundingUtils';
import { calculateBalanceUsage, MAX_BALANCE_DISCOUNT_RATE } from '../../utils/discountBalance';
import CustomerSelector from '../../components/features/CustomerSelector';
import ServiceSelector from '../../components/features/ServiceSelector';
import TransactionItemsTable from '../../components/features/TransactionItemsTable';
import CustomerFormModal from '../../components/CustomerFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';
import WhatsAppModal from '../../components/WhatsAppModal';
import KiloanTaggingModal from '../../components/KiloanTaggingModal';
import SupervisorPinModal from '../../components/SupervisorPinModal';
import { needsManualDiscountApproval } from '../../utils/supervisorApproval';
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
  const { settings, isLoading: isLoadingSettings } = useSettings();
  const { addTransaction } = useTransactions();
  const queryClient = useQueryClient();
  const { data: customersData } = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
    // PENTING: nonaktifkan auto-refetch saat user sedang input data
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 menit - data customer jarang berubah
  });
  const customers: Customer[] = Array.isArray(customersData)
    ? customersData
    : (customersData?.data ?? []);
  const { addCustomer } = useCustomerMutations();
  const { services } = useServices();
  const { currentUser, selectedStoreId } = useAppContext();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  // Ganti tipe state items menjadi ExtendedTransactionItem[]
  const [items, setItems] = useState<ExtendedTransactionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number | ''>(0);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
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
  // Saldo diskon pelanggan: dipakai otomatis, kasir bisa mematikannya per transaksi
  const [useBalance, setUseBalance] = useState(true);
  // Diskon manual oleh Kasir wajib disetujui PIN supervisor saat disimpan
  const [isSupervisorPinOpen, setIsSupervisorPinOpen] = useState(false);
  // Data pelanggan (dengan saldo terbaru) untuk pesan WhatsApp setelah simpan
  const [whatsAppCustomer, setWhatsAppCustomer] = useState<Customer | null>(null);

  // Saldo selalu diambil langsung dari database, bukan dari cache daftar pelanggan,
  // karena database menolak transaksi yang memakai saldo melebihi sisa saldo.
  const { data: freshBalance, isFetching: isBalanceLoading } = useCustomerBalance(
    selectedCustomer?.id,
  );
  const customerBalance = freshBalance ?? selectedCustomer?.defaultDiscount ?? 0;

  // Semua useMemo, useEffect, useCallback juga di sini
  const isCashier = currentUser?.role === UserRole.Cashier;
  // Kasir selalu boleh mengetik diskon, tetapi diskon di atas diskon otomatis
  // wajib disetujui PIN supervisor (dicek ulang oleh database).
  // Admin tetap memakai izin "Boleh beri diskon"; Super Admin selalu boleh.
  const canApplyDiscount = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.SuperAdmin) return true;
    if (currentUser.role === UserRole.Cashier) return true;
    return currentUser.role === UserRole.Admin && currentUser.canGiveDiscount === true;
  }, [currentUser]);
  const canEditDiscount = canApplyDiscount;
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
      // Ensure discountValue is a valid number
      const parsedValue = Number(discountValue);
      val = isNaN(parsedValue) ? 0 : Math.max(0, parsedValue);
    }
    let rawDiscount = 0;
    if (type === 'percent') {
      rawDiscount = subtotal * (val / 100);
    } else {
      rawDiscount = Math.min(val, subtotal);
    }
    return Math.round(rawDiscount);
  }, [subtotal, discountValue, discountType, canApplyDiscount, settings?.discountRate]);

  const needsSupervisorPin =
    isCashier && needsManualDiscountApproval(discountAmount, subtotal, settings?.discountRate);

  // Saldo diskon yang bisa dipakai: min(saldo, 10% subtotal, sisa tagihan)
  const balanceUsable = useMemo(
    () => calculateBalanceUsage(customerBalance, subtotal, discountAmount),
    [customerBalance, subtotal, discountAmount],
  );
  const balanceDiscount = selectedCustomer && useBalance ? balanceUsable : 0;
  const isBalanceCappedByRate =
    balanceUsable > 0 &&
    balanceUsable < customerBalance &&
    balanceUsable === Math.floor(subtotal * MAX_BALANCE_DISCOUNT_RATE);

  const taxAmount = useMemo(() => {
    const taxableAmount = subtotal - discountAmount - balanceDiscount;
    return Math.round(taxableAmount * ((settings?.taxRate ?? 0) / 100));
  }, [subtotal, discountAmount, balanceDiscount, settings?.taxRate]);

  // Total transaksi (pendapatan toko) selalu nilai pas, tanpa pembulatan.
  const grandTotal = subtotal - discountAmount - balanceDiscount + taxAmount;

  // Pembayaran tunai dibulatkan ke atas ke Rp500; kelebihannya masuk saldo pelanggan.
  const { amountDue: amountToPay, roundingCredit } = useMemo(
    () =>
      calculateCashRounding(grandTotal, isPayingNow ? paymentMethod : undefined, {
        hasCustomer: Boolean(selectedCustomer),
      }),
    [grandTotal, isPayingNow, paymentMethod, selectedCustomer],
  );

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

  // Kembalian dihitung dari jumlah yang dibulatkan (amountToPay), bukan grandTotal.
  const changeAmount = useMemo(() => {
    if (!isPayingNow || paymentMethod !== PaymentMethod.Cash || tenderedAmount < amountToPay) {
      return 0;
    }
    return tenderedAmount - amountToPay;
  }, [isPayingNow, paymentMethod, tenderedAmount, amountToPay]);

  // Yang tercatat sebagai pembayaran adalah total transaksi. Kelebihan pembulatan
  // tunai dicatat terpisah sebagai roundingCredit (masuk saldo pelanggan).
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

  // Diskon manual kembali ke diskon default saat izin atau pelanggan berganti.
  // (Sengaja tidak bergantung pada subtotal, supaya diskon yang diketik kasir
  // tidak terhapus setiap kali item ditambah.)
  useEffect(() => {
    setDiscountType('percent');
    setDiscountValue(settings?.discountRate ?? 0);
  }, [canApplyDiscount, selectedCustomer?.id, settings?.discountRate]);

  // Setiap ganti pelanggan, saldo kembali dipakai otomatis.
  useEffect(() => {
    setUseBalance(true);
  }, [selectedCustomer?.id]);

  // --- LOGIKA KONDISIONAL DIMULAI DI SINI ---
  // Show error toast if settings failed to load
  useEffect(() => {
    if (!settings && !isLoadingSettings) {
      addToast(
        'Tidak dapat memuat data pajak, diskon, dan lainnya. Pastikan Anda memiliki koneksi dan hak akses yang benar untuk melihat tabel settings.',
        'error',
      );
    }
  }, [settings, isLoadingSettings, addToast]);

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
        <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Gagal Memuat Pengaturan Aplikasi
        </h2>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          Tidak dapat memuat data pajak, diskon, dan lainnya. Pastikan Anda memiliki koneksi dan hak
          akses yang benar untuk melihat tabel 'settings'.
        </p>
      </div>
    );
  }

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
          defaultDiscount: newCustomer.defaultDiscount ?? 0,
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

  const handleSubmit = async (e?: React.FormEvent, supervisorApprovalId?: string) => {
    e?.preventDefault();
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

    if (needsSupervisorPin && !supervisorApprovalId) {
      setIsSupervisorPinOpen(true);
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
      if (paymentMethod === PaymentMethod.Cash && tenderedAmount < amountToPay) {
        addToast(`Uang diterima kurang. Tagihan tunai Rp ${formatRupiah(amountToPay)}.`, 'error');
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
      // Total diskon = diskon manual + saldo diskon pelanggan yang dipakai.
      const finalDiscount = discountAmount + balanceDiscount;
      const txRoundingCredit =
        isPayingNow && paymentMethod === PaymentMethod.Cash ? roundingCredit : 0;

      const newTransaction: Omit<Transaction, 'id'> = {
        customerId: selectedCustomer.id,
        items: cleanedItems,
        subtotal,
        discount: finalDiscount,
        tax: taxAmount,
        total: grandTotal,
        // Database memotong/menambah saldo pelanggan secara atomik dari dua kolom ini.
        discountBalanceUsed: balanceDiscount,
        roundingCredit: txRoundingCredit,
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
        supervisorApprovalId,
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

        // Saldo sudah dipotong/ditambah oleh database bersama transaksi ini.
        const invoiceLabel = tx.invoiceCode ?? tx.id;
        if (balanceDiscount > 0) {
          addAuditLog(
            `Saldo diskon Rp ${formatRupiah(balanceDiscount)} dipakai ${selectedCustomer.name} pada transaksi ${invoiceLabel}.`,
            currentStoreId,
          );
        }
        if (txRoundingCredit > 0) {
          addAuditLog(
            `Pembulatan tunai Rp ${formatRupiah(txRoundingCredit)} masuk saldo diskon ${selectedCustomer.name} (transaksi ${invoiceLabel}).`,
            currentStoreId,
          );
        }

        // Saldo terbaru untuk pesan WhatsApp; kalau gagal, pakai perkiraan.
        let latestBalance = customerBalance - balanceDiscount + txRoundingCredit;
        try {
          latestBalance = await fetchCustomerBalance(selectedCustomer.id);
        } catch (balanceError) {
          console.warn('Gagal memuat saldo terbaru:', balanceError);
        }
        setWhatsAppCustomer({ ...selectedCustomer, defaultDiscount: latestBalance });
        invalidateCustomerBalance(queryClient, selectedCustomer.id);

        await queryClient.invalidateQueries({ queryKey: ['transaction', tx.id] });
        setNewlyCreatedTransaction(tx);
        setIsWhatsAppModalOpen(true);
        updateToast(toastId, '✓ Transaksi berhasil disimpan dan terverifikasi.', 'success');
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
          setWhatsAppCustomer(selectedCustomer);
          invalidateCustomerBalance(queryClient, selectedCustomer.id);
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
        // Saldo mungkin sudah berubah (dipakai di kasir lain): muat ulang angka terbaru.
        invalidateCustomerBalance(queryClient, selectedCustomer.id);
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

  // --- PERBAIKAN 2: Logika Reset Diskon ---
  const handleNewTransaction = () => {
    // Reset all transaction-related state
    setSelectedCustomer(null);
    setItems([]);
    setNotes('');
    setDiscountType('percent');
    setDiscountValue(settings?.discountRate ?? 0);
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
    setUseBalance(true);
    setWhatsAppCustomer(null);
    setIdempotencyKey(generateUUID()); // Generate kunci baru untuk transaksi berikutnya
  };

  const handleViewTransactions = () => {
    setIsSuccessModalOpen(false);
    navigate('/transactions');
  };

  const handleDiscountTypeChange = (type: 'percent' | 'fixed') => {
    setDiscountType(type);
    setDiscountValue(0);
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
                {selectedCustomer && customerBalance > 0 && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/30">
                    <label
                      htmlFor="use-balance"
                      className="flex items-start gap-3 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        id="use-balance"
                        checked={useBalance}
                        onChange={(e) => setUseBalance(e.target.checked)}
                        className="mt-1 h-5 w-5 shrink-0 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-900 dark:text-emerald-100">
                          <TagIcon className="w-4 h-4 shrink-0" />
                          Pakai saldo diskon
                        </span>
                        <span className="block text-sm text-emerald-800 dark:text-emerald-200 tabular-nums">
                          Saldo Rp {formatRupiah(customerBalance)}
                          {isBalanceLoading ? ' (memperbarui…)' : ''}.{' '}
                          {subtotal <= 0
                            ? 'Tambahkan layanan untuk memakai saldo.'
                            : useBalance
                              ? `Dipakai Rp ${formatRupiah(balanceUsable)}${isBalanceCappedByRate ? ' (maks. 10% subtotal)' : ''}.`
                              : `Bisa dipakai Rp ${formatRupiah(balanceUsable)}.`}
                        </span>
                      </span>
                    </label>
                  </div>
                )}
                <div id="notes-section">
                  <label
                    htmlFor="notes"
                    className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                  >
                    Catatan (Opsional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  ></textarea>
                </div>
                <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-slate-600 dark:text-slate-300">Subtotal:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center text-lg ${!canApplyDiscount ? 'opacity-50' : ''}`}
                    title={
                      !canApplyDiscount ? 'Anda tidak memiliki izin untuk memberikan diskon.' : ''
                    }
                  >
                    <label htmlFor="discountValue" className="text-slate-600 dark:text-slate-300">
                      Diskon:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          disabled={!canApplyDiscount}
                          onClick={() => handleDiscountTypeChange('percent')}
                          className={`px-2 py-1 text-sm rounded-md ${discountType === 'percent' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          disabled={!canApplyDiscount}
                          onClick={() => handleDiscountTypeChange('fixed')}
                          className={`px-2 py-1 text-sm rounded-md ${discountType === 'fixed' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          Rp
                        </button>
                      </div>
                      <input
                        type="number"
                        id="discountValue"
                        name="discountValue"
                        min="0"
                        value={discountValue}
                        onChange={(e) =>
                          setDiscountValue(
                            e.target.value === ''
                              ? ''
                              : Math.max(0, parseFloat(e.target.value) || 0),
                          )
                        }
                        className="w-24 bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg p-1.5 text-right dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-600"
                        disabled={!canEditDiscount}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span />
                    <span className="font-medium text-red-600 dark:text-red-400">
                      - Rp {discountAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {needsSupervisorPin && (
                    <p className="text-sm text-amber-700 dark:text-amber-300 text-right">
                      Diskon di atas {settings?.discountRate ?? 0}% perlu PIN Admin saat disimpan.
                    </p>
                  )}
                  {balanceDiscount > 0 && (
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-slate-600 dark:text-slate-300">Saldo diskon:</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                        - Rp {formatRupiah(balanceDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-slate-600 dark:text-slate-300">
                      Pajak ({settings.taxRate}%):
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      + Rp {taxAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-2xl font-semibold text-slate-900 dark:text-white pt-3 border-t dark:border-slate-600">
                    <span>Grand Total:</span>
                    <span className="tabular-nums">Rp {formatRupiah(grandTotal)}</span>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">
                    Opsi Pembayaran
                  </label>
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
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Pembayaran
                    </h3>
                    <div>
                      <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">
                        Metode Pembayaran
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(PaymentMethod).map((m) => (
                          <button
                            type="button"
                            key={m}
                            onClick={() => setPaymentMethod(m)}
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
                    {paymentMethod === PaymentMethod.Cash && roundingCredit > 0 && (
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 space-y-1">
                        <div className="flex justify-between items-center text-lg font-semibold text-slate-900 dark:text-white">
                          <span>Tagihan tunai:</span>
                          <span className="tabular-nums">Rp {formatRupiah(amountToPay)}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Dibulatkan ke atas ke Rp500. Kelebihan{' '}
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Rp {formatRupiah(roundingCredit)}
                          </span>{' '}
                          masuk saldo diskon {selectedCustomer?.name ?? 'pelanggan'}.
                        </p>
                      </div>
                    )}
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
                          name="tenderedAmount"
                          value={tenderedAmountStr}
                          onChange={(e) => {
                            const val = parseRupiah(e.target.value);
                            setTenderedAmountStr(val === 0 ? '' : formatRupiah(val));
                          }}
                          className="bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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
                  className="w-full flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-xl px-8 py-4 text-center transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? <SpinnerIcon className="w-7 h-7" /> : 'Simpan Transaksi'}
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
      <SupervisorPinModal
        isOpen={isSupervisorPinOpen}
        action="manual_discount"
        description={`Diskon Rp ${formatRupiah(discountAmount)} dari subtotal Rp ${formatRupiah(subtotal)}${selectedCustomer ? ` untuk ${selectedCustomer.name}` : ''}.`}
        maxAmount={discountAmount}
        onClose={() => setIsSupervisorPinOpen(false)}
        onApproved={(approvalId, approverName) => {
          setIsSupervisorPinOpen(false);
          addToast(`Diskon disetujui oleh ${approverName}.`, 'success');
          void handleSubmit(undefined, approvalId);
        }}
      />
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={handleCloseWhatsAppModal}
        transaction={newlyCreatedTransaction}
        customer={whatsAppCustomer ?? selectedCustomer}
      />
    </>
  );
};

export default NewTransactionPage;
