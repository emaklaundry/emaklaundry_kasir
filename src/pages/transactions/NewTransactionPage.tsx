import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
      const [tenderedAmountStr, setTenderedAmountStr] = useState('');
      const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
      const [notes, setNotes] = useState('');

      // --- State Modal ---
      const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
      const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
      const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
      const [isKiloanTaggingModalOpen, setIsKiloanTaggingModalOpen] = useState(false);
      const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
      const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
      const [newlyCreatedTransaction, setNewlyCreatedTransaction] = useState<Transaction | null>(null);

      // --- Logika Turunan (Memoized) ---

      const currentStoreId = useMemo(() => {
        return currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
      }, [currentUser, selectedStoreId]);

      const canApplyDiscount = useMemo(() => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.SuperAdmin) return true;
        if (currentUser.role === UserRole.Admin || currentUser.role === UserRole.Cashier) {
          if (currentUser.canGiveDiscount) return true;
          if (selectedCustomer?.defaultDiscount && selectedCustomer.defaultDiscount > 0) return true;
        }
        return false;
      }, [currentUser, selectedCustomer]);

      const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + item.subtotal, 0);
      }, [items]);

      const discountAmount = useMemo(() => {
        let val = 0;
        let type = discountType;

        if (!canApplyDiscount) {
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

      // --- Efek Samping (Side Effects) ---

      useEffect(() => {
        if (!canApplyDiscount) {
          setDiscountType('percent');
          setDiscountValue(settings?.discountRate ?? 0);
          return;
        }

        if (selectedCustomer?.defaultDiscount && selectedCustomer.defaultDiscount > 0) {
          setDiscountType('percent');
          setDiscountValue(selectedCustomer.defaultDiscount);
          const timerId = setTimeout(() => {
            addToast(
              `Diskon ${selectedCustomer.defaultDiscount}% otomatis diterapkan untuk ${selectedCustomer.name}.`,
              'info',
            );
          }, 0);
          return () => clearTimeout(timerId);
        } else {
          setDiscountType('percent');
          setDiscountValue(settings?.discountRate ?? 0);
        }
      }, [selectedCustomer, settings?.discountRate, canApplyDiscount, addToast]);

      useEffect(() => {
        if (isPayingNow) {
          setAmountPaidStr(formatRupiah(grandTotal));
        }
      }, [grandTotal, isPayingNow]);

      // --- Kalkulasi Pembayaran ---
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

      // --- Handler Aksi ---

      const handleAddService = useCallback(
        (service: Service) => {
          const existingItemIndex = items.findIndex((item) => item.serviceId === service.id);
          const isKiloan = service.category === ServiceCategory.Kiloan;

          if (existingItemIndex > -1) {
            if (isKiloan) {
              addToast('Item kiloan sudah ada. Ubah beratnya di keranjang.', 'info');
              return;
            }
            setItems((currentItems) => {
              const updatedItems = [...currentItems];
              const currentItem = updatedItems[existingItemIndex];
              currentItem.quantity += 1;
              currentItem.subtotal = currentItem.price * currentItem.quantity;
              return updatedItems;
            });
          } else {
            const newItem: TransactionItem = {
              serviceId: service.id,
              serviceName: service.name,
              price: service.price,
              unit: service.unit,
              quantity: 1,
              subtotal: service.price * 1,
              itemDetails:
                service.category === ServiceCategory.Satuan ? [{ note: '' }] : undefined,
              taggedItems:
                service.category === ServiceCategory.Kiloan ? '' : undefined,
            };
            setItems((currentItems) => [...currentItems, newItem]);
          }
        },
        [items, addToast],
      );

      const handleItemChange = (index: number, field: 'quantity', value: number) => {
        setItems((prevItems) => {
          const updatedItems = [...prevItems];
          const item = updatedItems[index];
          if (!item) return prevItems;

          if (field === 'quantity') {
            item.quantity = value;
            item.subtotal = item.price * value;
            if (item.itemDetails) {
              const newDetails: TransactionItemDetail[] =
                item.itemDetails.slice(0, value) || [];
              while (newDetails.length < value) {
                newDetails.push({ note: '' });
              }
              item.itemDetails = newDetails;
            }
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

      const handleSaveNotes = (notes: { note: string }[]) => {
        if (editingItemIndex === null) return;
        setItems((prevItems) => {
          const updatedItems = [...prevItems];
          if (!updatedItems[editingItemIndex]) return updatedItems;
          updatedItems[editingItemIndex].itemDetails = notes;
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
          if (!updatedItems[editingItemIndex]) return updatedItems;
          updatedItems[editingItemIndex].taggedItems = tags;
          return updatedItems;
        });
        setIsKiloanTaggingModalOpen(false);
        setEditingItemIndex(null);
      };

      const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'storeId'>) => {
        if (!currentStoreId || currentStoreId === 'all') {
          addToast('Silakan pilih cabang spesifik untuk menambah pelanggan.', 'warning');
          return;
        }
        try {
          const newCustomer = await addCustomer({ ...customerData, storeId: currentStoreId });
          if (newCustomer) {
            setSelectedCustomer(newCustomer);
            addAuditLog(`Menambahkan pelanggan baru: "${newCustomer.name}".`, currentStoreId);
            addToast('Pelanggan baru berhasil ditambahkan!', 'success');
            setIsCustomerModalOpen(false);
          }
        } catch (error: any) {
          addToast(`Gagal menyimpan pelanggan: ${error.message}`, 'error');
        }
      };

      const resetForm = () => {
        setItems([]);
        setSelectedCustomer(null);
        setDiscountValue(settings?.discountRate ?? 0);
        setDiscountType('percent');
        setIsPayingNow(false);
        setAmountPaidStr('');
        setTenderedAmountStr('');
        setPaymentMethod(PaymentMethod.Cash);
        setNotes('');
        setNewlyCreatedTransaction(null);
        setIsSuccessModalOpen(false);
      };

      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedCustomer) {
          addToast('Pelanggan harus dipilih.', 'error');
          return;
        }
        if (items.length === 0) {
          addToast('Keranjang tidak boleh kosong.', 'error');
          return;
        }
        if (!currentStoreId || currentStoreId === 'all') {
          addToast('Tidak dapat membuat transaksi. Cabang tidak valid.', 'error');
          return;
        }
        if (isPayingNow && amountToPay < grandTotal) {
          addToast(
            'Jumlah bayar kurang dari total tagihan. Nonaktifkan "Bayar Sekarang" untuk utang.',
            'warning',
          );
          return;
        }
        if (
          isPayingNow &&
          paymentMethod === PaymentMethod.Cash &&
          tenderedAmount < amountToPay
        ) {
          addToast('Uang diterima kurang dari jumlah bayar.', 'warning');
          return;
        }

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
          estimatedCompletionDate,
          amountPaid: actualAmountPaid,
          change: changeAmount,
          paymentMethod: isPayingNow ? paymentMethod : undefined,
          createdByUserId: currentUser.id,
          storeId: currentStoreId,
          notes: notes || undefined,
        };

        try {
          const created = await addTransaction(newTransaction);
          if (created) {
            addAuditLog(
              `Membuat transaksi baru ${created.id} untuk ${selectedCustomer.name}.`,
              currentStoreId,
            );
            setNewlyCreatedTransaction(created);
            setIsSuccessModalOpen(true);
            if (paymentStatus === PaymentStatus.Paid) {
              setIsWhatsAppModalOpen(true);
            }
          }
        } catch (error: any) {
          addToast(`Gagal menyimpan transaksi: ${error.message}`, 'error');
        }
      };

      // --- Render ---

      if (isLoadingServices || isLoadingSettings) {
        return (
          <div className="flex justify-center items-center w-full h-96">
            <SpinnerIcon className="w-16 h-16" />
            <span className="sr-only">Memuat data...</span>
          </div>
        );
      }

      if (!settings) {
        return (
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
              Gagal Memuat Pengaturan
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300">
              Pengaturan aplikasi (pajak/diskon) tidak ditemukan.
            </p>
          </div>
        );
      }

      return (
        <>
          <form
            id="new-transaction-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* --- Kolom Kiri: Layanan & Item --- */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                  Pilih Layanan
                </h2>
                <ServiceSelector services={services} onAddService={handleAddService} />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">
                  Item Transaksi
                </h2>

                {/* Tampilan Tabel Desktop */}
                <div className="overflow-x-auto hidden md:block">
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
                                    className="w-24 bg-white border border-slate-300 text-slate-900 text-lg rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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

                {/* Tampilan Kartu Mobile */}
                <div className="md:hidden space-y-4">
                  {items.length > 0 ? (
                    items.map((item, index) => {
                      const service = services.find((s) => s.id === item.serviceId);
                      const isSatuan = service?.category === ServiceCategory.Satuan;
                      const isKiloan = service?.category === ServiceCategory.Kiloan;
                      return (
                        <div
                          key={index}
                          className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {item.serviceName}
                            </span>
                            <span className="font-semibold text-right text-slate-700 dark:text-slate-200">
                              Rp {item.subtotal.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-4">
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
                                className="w-24 bg-white border border-slate-300 text-slate-900 text-base rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                              />
                              <span className="ml-2 text-base text-slate-500 dark:text-slate-400">
                                {item.unit}
                              </span>
                            </div>

                            <div className="flex items-center justify-end">
                              {isSatuan && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenNotesModal(index)}
                                  title="Catatan"
                                  className="p-2 text-blue-600 relative rounded-md"
                                >
                                  <MessageSquareIcon className="w-6 h-6" />
                                  {item.itemDetails
                                    ?.slice(0, item.quantity)
                                    .some((d) => d.note) && (
                                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-700/50"></span>
                                  )}
                                </button>
                              )}
                              {isKiloan && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenKiloanTaggingModal(index)}
                                  title="Tag Item"
                                  className="p-2 text-purple-600 relative rounded-md"
                                >
                                  <TagIcon className="w-6 h-6" />
                                  {item.taggedItems && (
                                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-700/50"></span>
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                title="Hapus"
                                className="p-2 text-red-600 rounded-md"
                              >
                                <Trash2Icon className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon={<ShoppingCartIcon className="mx-auto w-12 h-12 text-slate-400" />}
                      title="Keranjang kosong"
                      description="Silakan pilih layanan untuk menambah item."
                    />
                  )}
                </div>
              </div>
            </div>

            {/* --- Kolom Kanan: Detail & Total (Sticky) --- */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md lg:sticky lg:top-24 h-fit">
                <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">
                  Detail & Total
                </h2>
                <div className="space-y-4">
                  {/* 1. Pelanggan */}
                  <CustomerSelector
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={setSelectedCustomer}
                    onAddNewCustomer={() => setIsCustomerModalOpen(true)}
                  />

                  {/* 2. Catatan */}
                  <div>
                    <label
                      htmlFor="notes"
                      className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
                    >
                      Catatan (Opsional)
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="Contoh: Jangan disetrika terlalu panas"
                    />
                  </div>

                  {/* 3. Rincian Total */}
                  <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-slate-600 dark:text-slate-300">Subtotal:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Rp {subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div
                      className="flex justify-between items-center text-lg"
                      title={
                        !canApplyDiscount
                          ? `Diskon ${settings?.discountRate}% otomatis. Hanya admin yang bisa mengubah.`
                          : ''
                      }
                    >
                      <label
                        htmlFor="discountValue"
                        className="text-slate-600 dark:text-slate-300"
                      >
                        Diskon:
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
                          disabled={!canApplyDiscount}
                          className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg p-1.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-600"
                        >
                          <option value="percent">%</option>
                          <option value="amount">Rp</option>
                        </select>
                        <input
                          id="discountValue"
                          type="number"
                          min="0"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          disabled={!canApplyDiscount}
                          className="w-24 bg-slate-50 border border-slate-300 text-slate-900 text-lg rounded-lg p-1.5 text-right dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-600"
                        />
                      </div>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-lg">
                        <span></span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          - Rp {discountAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-slate-600 dark:text-slate-300">
                        Pajak ({settings?.taxRate ?? 0}%):
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        + Rp {taxAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-2xl font-semibold text-slate-900 dark:text-white pt-3 border-t dark:border-slate-600">
                      <span>Grand Total:</span>
                      <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* 4. Opsi Pembayaran */}
                  <div>
                    <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">
                      Opsi Pembayaran
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPayingNow(false)}
                        className={`p-3 rounded-lg text-base border-2 ${
                          !isPayingNow
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        Bayar Nanti
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPayingNow(true)}
                        className={`p-3 rounded-lg text-base border-2 ${
                          isPayingNow
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        Bayar Sekarang
                      </button>
                    </div>
                  </div>

                  {/* 5. Detail Pembayaran (Kondisional) */}
                  {isPayingNow && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">
                          Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.values(PaymentMethod).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setPaymentMethod(m)}
                              className={`p-2 rounded-lg text-sm border-2 ${paymentMethod === m ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600'}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
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
                          />
                        </div>
                      )}
                      {changeAmount > 0 && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-lg flex justify-between items-center text-xl font-bold text-green-800 dark:text-green-300">
                          <span>Kembalian:</span>
                          <span>Rp {formatRupiah(changeAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. Tombol Simpan */}
                  <button
                    type="submit"
                    disabled={
                      isSavingTransaction ||
                      !selectedCustomer ||
                      items.length === 0 ||
                      !currentStoreId ||
                      currentStoreId === 'all'
                    }
                    className="w-full flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-xl px-8 py-4 text-center transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {isSavingTransaction ? <SpinnerIcon className="w-6 h-6" /> : 'Simpan Transaksi'}
                  </button>
                  {(!currentStoreId || currentStoreId === 'all') && (
                    <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
                      Pilih cabang spesifik di header untuk membuat transaksi.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* --- Bar Bawah Mobile (Sticky) --- */}
            {/* Konten ini sekarang kosong karena logikanya ada di dalam Modal Mobile */}
            {/* Namun, kita perlu tombol pemicu jika item > 0 */}
            {items.length > 0 && (
              <div
                className="lg:hidden fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-lg-top"
                onClick={() => {
                  /* Pemicu modal tidak lagi ada di sini, ini hanya placeholder */
                  /* Seharusnya ini tidak lagi diperlukan karena kolom kanan sticky */
                  /* Mari kita hapus ini */
                }}
              >
                {/* ... Konten bar mobile ... */}
                {/* Sebenarnya, dengan layout baru ini, bar mobile tidak diperlukan lagi
                    karena kolom kanan akan menjadi 'fixed' di bawah 640px.
                    Mari kita sesuaikan itu.
                */}
              </div>
            )}
          </form>

          {/* --- Kumpulan Modal --- */}
          {/* HAPUS Modal Mobile, karena kolom kanan sekarang sticky */}

          {/* Modal Tambah Pelanggan */}
          {isCustomerModalOpen && (
            <CustomerFormModal
              customer={null}
              onClose={() => setIsCustomerModalOpen(false)}
              onSave={handleSaveCustomer}
            />
          )}

          {/* Modal Sukses */}
          <SuccessModal
            isOpen={isSuccessModalOpen}
            onClose={() => {
              setIsSuccessModalOpen(false);
              resetForm();
            }}
            title="Transaksi Berhasil!"
            message="Transaksi baru telah berhasil dibuat."
            actions={[
              { text: 'Buat Transaksi Baru', onClick: resetForm, type: 'primary' },
              {
                text: 'Lihat Daftar Transaksi',
                onClick: () => navigate('/transactions'),
                type: 'secondary',
              },
            ]}
          />

          {/* Modal Catatan Item */}
          <ItemNotesModal
            isOpen={isNotesModalOpen}
            onClose={() => setIsNotesModalOpen(false)}
            item={editingItemIndex !== null ? items[editingItemIndex] : null!}
            onSave={handleSaveNotes}
          />

          {/* Modal Tag Kiloan */}
          <KiloanTaggingModal
            isOpen={isKiloanTaggingModalOpen}
            onClose={() => setIsKiloanTaggingModalOpen(false)}
            item={editingItemIndex !== null ? items[editingItemIndex] : null!}
            onSave={handleSaveKiloanTags}
          />

          {/* Modal WhatsApp */}
          <WhatsAppModal
            isOpen={isWhatsAppModalOpen}
            onClose={() => setIsWhatsAppModalOpen(false)}
            transaction={newlyCreatedTransaction}
            customer={selectedCustomer}
          />
        </>
      );
    }

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
