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
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Transaksi Baru</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow p-4 md:p-6 space-y-6">
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
            <h2 className="font-semibold mb-2">Item Transaksi</h2>
            <ul className="divide-y">
              {form.items.map((item, idx) => (
                <li key={idx} className="py-2 flex items-center justify-between gap-2 group">
                  <div className="flex-1">
                    <span className="font-medium">{item.serviceName}</span>
                    <span className="ml-2 text-slate-500">
                      x{item.quantity} ({item.unit})
                    </span>
                  </div>
                  <span className="w-32 text-right tabular-nums">
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
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 md:p-6 space-y-2 shadow-sm">
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
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span className="tabular-nums">Rp {form.grandTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Tombol Simpan (dummy) */}
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-4 transition disabled:opacity-60"
          onClick={() => {
            addToast({
              type: 'info',
              message: 'Fitur simpan transaksi belum diimplementasikan',
            });
          }}
        >
          Simpan Transaksi
        </button>
      </div>
    </div>
  );
};

export default NewTransactionPage;
