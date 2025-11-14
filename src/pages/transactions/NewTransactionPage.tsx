import React, { useState } from 'react';
import { useCustomers } from '@/contexts/CustomerContext';
import { useServices } from '@/contexts/ServiceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useUsers } from '@/contexts/UserContext';
import CustomerSelector from '@/components/CustomerSelector';
import ServiceSelector from '@/components/ServiceSelector';
import CustomerFormModal from '@/components/CustomerFormModal';

import { useTransactionForm } from '@/hooks/useTransactionForm';
import { Trash2Icon } from '@/components/icons';
import { useToasts } from '@/contexts/ToastContext';
import { useState as useReactState } from 'react';
import { createNewTransaction } from '@/utils/createNewTransaction';

const NewTransactionPage: React.FC = () => {
  const { customers, addCustomer } = useCustomers();
  const { services } = useServices();
  const { settings } = useSettings();
  const { users } = useUsers();
  const { addToast } = useToasts();

  // Asumsi: user pertama sebagai currentUser (ganti sesuai auth sebenarnya)
  const currentUser = users[0] || {};
  const form = useTransactionForm({ currentUser, settings, services });

  // State for add customer modal
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isSaving, setIsSaving] = useReactState(false);
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Transaksi Baru</h1>
      <div className="bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl border border-blue-200 dark:border-slate-700 shadow-lg p-4 md:p-6 space-y-6">
        {/* Pilih Pelanggan */}
        <CustomerSelector
          customers={customers}
          selectedCustomer={form.selectedCustomer}
          onSelectCustomer={form.setSelectedCustomer}
          onAddNewCustomer={() => setAddCustomerOpen(true)}
        />

        {/* Modal Tambah Pelanggan */}
        {isAddCustomerOpen && (
          <CustomerFormModal
            customer={null}
            onClose={() => setAddCustomerOpen(false)}
            onSave={async (data) => {
              setIsAddingCustomer(true);
              try {
                const newCustomer = await addCustomer({
                  ...data,
                  storeId: currentUser.storeId,
                  createdAt: new Date(),
                });
                setAddCustomerOpen(false);
                // Pilih customer baru setelah tambah
                if (newCustomer) {
                  form.setSelectedCustomer(newCustomer);
                }
              } catch {
                // TODO: tampilkan error toast/modal
                alert('Gagal menambah pelanggan');
              } finally {
                setIsAddingCustomer(false);
              }
            }}
            disabled={isAddingCustomer}
          />
        )}

        {/* Pilih Layanan */}
        <ServiceSelector
          services={services}
          onAddService={(service) => {
            form.setItems([
              ...form.items,
              {
                serviceId: service.id,
                serviceName: service.name,
                quantity: 1,
                price: service.price,
                subtotal: service.price,
                unit: service.unit,
              },
            ]);
          }}
        />

        {/* Daftar Item Transaksi */}
        {form.items.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Item Transaksi</h2>
            <ul className="divide-y">
              {form.items.map((item, idx) => (
                <li
                  key={idx}
                  className="py-2 flex items-center justify-between gap-2 group hover:bg-blue-50 dark:hover:bg-slate-800/60 rounded transition"
                >
                  <div className="flex-1">
                    <span className="font-medium">{item.serviceName}</span>
                    <span className="ml-2 text-slate-500">
                      x{item.quantity} ({item.unit})
                    </span>
                  </div>
                  <span className="w-32 text-right tabular-nums font-semibold text-blue-700 dark:text-blue-200">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </span>
                  <button
                    className="ml-2 text-red-500 hover:text-red-700 opacity-80 hover:opacity-100"
                    title="Hapus item"
                    onClick={() => {
                      form.setItems(form.items.filter((_, i) => i !== idx));
                    }}
                  >
                    <Trash2Icon className="w-5 h-5" />
                  </button>
                  {/*
                  <button
                    className="ml-1 text-slate-400 hover:text-blue-600"
                    title="Edit item"
                    onClick={() => setEditIdx(idx)}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  */}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ringkasan Transaksi */}
        <div className="bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700 p-4 md:p-6 space-y-2 shadow-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">Rp {form.subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Diskon</span>
            <span className="tabular-nums text-green-600">
              - Rp {form.discountAmount.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Pajak</span>
            <span className="tabular-nums text-orange-600">
              + Rp {form.taxAmount.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 text-blue-800 dark:text-blue-200">
            <span>Total</span>
            <span className="tabular-nums">Rp {form.grandTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Tombol Simpan (dummy) */}
        <button
          className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-lg mt-4 shadow-lg transition disabled:opacity-60"
          disabled={isSaving}
          onClick={async () => {
            if (!form.selectedCustomer) {
              addToast('Pilih pelanggan terlebih dahulu.', 'warning');
              return;
            }
            if (form.items.length === 0) {
              addToast('Tambahkan minimal 1 layanan.', 'warning');
              return;
            }
            setIsSaving(true);
            try {
              await createNewTransaction({
                customerId: form.selectedCustomer.id,
                items: form.items.map((item) => ({
                  serviceId: item.serviceId,
                  quantity: item.quantity,
                  note: item.itemDetails?.[0]?.note || '',
                })),
                createdByUserId: currentUser.id,
                storeId: currentUser.storeId,
                notes: form.notes,
                paymentMethod: form.paymentMethod,
                isPayingNow: form.isPayingNow,
                discountType: form.discountType,
                discountValue: form.discountValue,
              });
              addToast('Transaksi berhasil disimpan!', 'success');
              // Reset form
              form.setSelectedCustomer(null);
              form.setItems([]);
              form.setNotes('');
              form.setDiscountType('percent');
              form.setDiscountValue(0);
              form.setIsPayingNow(false);
              form.setPaymentMethod(undefined);
              form.setAmountPaidStr('0');
              form.setTenderedAmountStr('');
            } catch (err: any) {
              addToast(err?.message || 'Gagal menyimpan transaksi', 'error');
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </div>
    </div>
  );
};

export default NewTransactionPage;
