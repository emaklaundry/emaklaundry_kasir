function NewTransactionPage() {
  // Komponen internal untuk detail keranjang (reusable di desktop & modal mobile)
  const CartDetails = () => (
    <>
      <h2 className="text-xl font-semibold mb-4">Detail Pesanan</h2>
      <div className="space-y-3 pr-2 overflow-y-auto max-h-[40vh] lg:max-h-full">
        {items.length === 0 ? (
          <p className="text-gray-500">Keranjang kosong.</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="flex justify-between items-center border-b py-2">
              <div>
                <p className="font-semibold">{item.serviceName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" min="0" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

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
  let content: React.ReactNode = null;
  if (isLoadingSettings) {
    content = (
      <div className="flex justify-center items-center w-full h-96">
        <SpinnerIcon className="w-16 h-16" />
        <span className="sr-only">Memuat pengaturan...</span>
      </div>
    );
  } else if (!settings) {
    content = (
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
  } else {
    content = (
      <>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex lg:flex-row h-screen overflow-hidden">
            {/* Bagian Kiri: Daftar Layanan & Item */}
            <div className="w-full lg:w-3/5 xl:w-2/3 p-4 overflow-y-auto pb-32 lg:pb-4">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                  Pilih Layanan
                </h2>
                <ServiceSelector services={services} onAddService={handleAddService} />
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
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

            {/* Bagian Kanan: Cart/Detail - Sticky di mobile, normal di desktop */}
            <div className="w-full lg:w-2/5 xl:w-1/3 bg-gray-50 p-4 shadow-lg overflow-y-auto lg:relative fixed bottom-0 left-0 right-0 z-40 border-t lg:border-t-0">
              {/* Desktop: detail lengkap */}
              <div className="hidden lg:block">
                <CartDetails />
              </div>
              {/* Mobile: sticky ringkasan & tombol (trigger modal) */}
              <div
                className="lg:hidden flex justify-between items-center cursor-pointer"
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
              <CartDetails />
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
