import React from 'react';
import { useCustomers } from '@/contexts/CustomerContext';
import { useServices } from '@/contexts/ServiceContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useUsers } from '@/contexts/UserContext';
import CustomerSelector from '@/components/CustomerSelector';
import ServiceSelector from '@/components/ServiceSelector';
import { useTransactionForm } from '@/hooks/useTransactionForm';

const NewTransactionPage: React.FC = () => {
  const { customers } = useCustomers();
  const { services } = useServices();
  const { settings } = useSettings();
  const { users } = useUsers();
  // Asumsi: user pertama sebagai currentUser (ganti sesuai auth sebenarnya)
  const currentUser = users[0] || {};
  const form = useTransactionForm({ currentUser, settings, services });

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Transaksi Baru</h1>
      <div className="bg-white rounded shadow p-4 space-y-6">
        {/* Pilih Pelanggan */}
        <CustomerSelector
          customers={customers}
          selectedCustomer={form.selectedCustomer}
          onSelectCustomer={form.setSelectedCustomer}
          onAddNewCustomer={() => alert('Fitur tambah pelanggan belum diimplementasikan')}
        />

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
                <li key={idx} className="py-2 flex justify-between items-center">
                  <span>
                    {item.serviceName} x{item.quantity} ({item.unit})
                  </span>
                  <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ringkasan Transaksi */}
        <div className="bg-slate-50 rounded p-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rp {form.subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>- Rp {form.discountAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Pajak</span>
            <span>+ Rp {form.taxAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>Rp {form.grandTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Tombol Simpan (dummy) */}
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-4"
          onClick={() => alert('Fitur simpan transaksi belum diimplementasikan')}
        >
          Simpan Transaksi
        </button>
      </div>
    </div>
  );
};

export default NewTransactionPage;
