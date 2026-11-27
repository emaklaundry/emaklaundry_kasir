import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useStores } from '../../contexts/StoreContext';
import useToasts from '../../contexts/useToasts';
import SupervisorPinSettings from '../../components/SupervisorPinSettings';
import { isStaticQRIS, validateQRIS } from '../../utils/qrisUtils';
import { MapIcon, SpinnerIcon } from '../../components/icons';
import { Wrench, AlertTriangle } from 'lucide-react';
import useAppContext from '../../contexts/useAppContext';
import { UserRole } from '../../types';
import { DEFAULT_BUSINESS_NAME, DEFAULT_TRACKING_URL } from '@/utils/whatsappReceipt';

// Template default untuk WhatsApp footer
const DEFAULT_WHATSAPP_FOOTER = `🔍 Cek status cucian Anda:
https://www.emaklaundry.my.id/

💬 Bantu kami lebih baik! Berikan kritik & saran:
https://forms.gle/8JnjZZ4cu5oTXGYr9`;

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { stores, updateStore } = useStores();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const { currentUser, selectedStoreId } = useAppContext();

  const [formData, setFormData] = useState(settings);
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number }>({
    latitude: 0,
    longitude: 0,
  });

  // Only Super Admin can toggle maintenance mode
  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

  const currentStore = useMemo(() => {
    if (selectedStoreId === 'all') return null;
    return stores.find((s) => s.id === selectedStoreId);
  }, [selectedStoreId, stores]);

  useEffect(() => {
    if (currentStore) {
      setLocationData({
        latitude: currentStore.latitude || 0,
        longitude: currentStore.longitude || 0,
      });
    }
  }, [currentStore]);

  useEffect(() => {
    if (settings) {
      // Set default template untuk whatsappFooter jika kosong
      setFormData({
        ...settings,
        whatsappFooter: settings.whatsappFooter || DEFAULT_WHATSAPP_FOOTER,
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
          }
        : null,
    );
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Kode QRIS: kosong = tanpa QRIS dinamis. Kalau diisi harus QRIS statis yang utuh,
    // karena QR dinamis dibuat dari kode ini dan QR yang rusak tidak bisa dibayar.
    // Buang baris baru & spasi di ujung saja: nama merchant di dalam QRIS boleh berisi spasi.
    const qrisStaticCode = formData.qrisStaticCode?.replace(/[\r\n]+/g, '').trim() || null;
    if (qrisStaticCode && !validateQRIS(qrisStaticCode)) {
      addToast(
        'Kode QRIS tidak valid (checksum tidak cocok). Salin ulang seluruh teks hasil scan stiker QRIS.',
        'error',
      );
      return;
    }
    if (qrisStaticCode && !isStaticQRIS(qrisStaticCode)) {
      addToast(
        'Kode ini QRIS dinamis. Gunakan kode dari stiker QRIS statis toko (tanpa nominal).',
        'error',
      );
      return;
    }

    const businessName = formData.businessName?.trim() || null;
    const trackingUrl = formData.trackingUrl?.trim() || null;
    if (trackingUrl && !/^https?:\/\/\S+$/i.test(trackingUrl)) {
      addToast('Link cek status harus diawali http:// atau https:// tanpa spasi.', 'error');
      return;
    }

    setIsSaving(true);
    // Create a replaceable toast and keep its id so we can update it later
    const toastId = addToast('Menyimpan perubahan...', 'info');
    try {
      // 1. Update Layout/General Settings
      await updateSettings({ ...formData, qrisStaticCode, businessName, trackingUrl });

      // 2. Update Store Location (if valid store selected)
      if (currentStore && currentStore.id !== 'all') {
        await updateStore(currentStore.id, {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
        addAuditLog(
          `Mengupdate lokasi toko "${currentStore.name}" ke (${locationData.latitude}, ${locationData.longitude}).`,
        );
      }

      addAuditLog('Menyimpan perubahan pada Pengaturan Aplikasi.');
      updateToast(toastId, 'Pengaturan berhasil disimpan!', 'success');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal menyimpan: ${errMsg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!formData) {
    return (
      <div className="flex justify-center py-16" role="status">
        <SpinnerIcon className="h-10 w-10 text-brand-blue-600 dark:text-brand-blue-400" />
        <span className="sr-only">Memuat pengaturan…</span>
      </div>
    );
  }

  return (
    <div className="card p-4 max-w-2xl mx-auto relative">
      {isSaving && (
        <div className="absolute inset-0 z-50 bg-white/60 dark:bg-black/50 rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-blue-700"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span className="text-lg font-medium text-slate-900 dark:text-white">
              Menyimpan perubahan...
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSaving}>
        {/* Location Settings - Visible only for Store Admins/Specific Branch */}
        {currentStore && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500 rounded-full p-2">
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lokasi Toko</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Koordinat untuk fitur cuaca ({currentStore.name})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="store-latitude" className="form-label">
                  Latitude
                </label>
                <input
                  id="store-latitude"
                  type="number"
                  step="any"
                  value={locationData.latitude}
                  onChange={(e) =>
                    setLocationData((prev) => ({
                      ...prev,
                      latitude: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="form-input text-sm p-2.5"
                />
              </div>
              <div>
                <label htmlFor="store-longitude" className="form-label">
                  Longitude
                </label>
                <input
                  id="store-longitude"
                  type="number"
                  step="any"
                  value={locationData.longitude}
                  onChange={(e) =>
                    setLocationData((prev) => ({
                      ...prev,
                      longitude: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="form-input text-sm p-2.5"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLocationData({
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                        });
                        addToast('Lokasi berhasil didapatkan dari GPS!', 'success');
                      },
                      () => addToast('Gagal mendapatkan lokasi GPS.', 'error'),
                    );
                  } else {
                    addToast('Browser tidak mendukung GPS.', 'error');
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                Ambil Lokasi Saya
              </button>
            </div>
          </div>
        )}

        {/* Maintenance Mode Section - Only for Super Admin */}
        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 space-y-4 dark:border-amber-800/60 dark:bg-amber-900/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-500 rounded-full p-2">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Mode Pemeliharaan
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Aktifkan saat melakukan perbaikan sistem
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white dark:bg-slate-800/50 rounded-lg p-4">
              <input
                type="checkbox"
                id="isMaintenanceMode"
                name="isMaintenanceMode"
                checked={formData?.isMaintenanceMode || false}
                onChange={handleChange}
                disabled={isSaving}
                className="mt-1 w-5 h-5 text-yellow-600 bg-slate-100 border-slate-300 rounded focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <div className="flex-1">
                <label
                  htmlFor="isMaintenanceMode"
                  className="text-base font-medium text-slate-900 dark:text-white cursor-pointer"
                >
                  Aktifkan Mode Pemeliharaan
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Ketika aktif, hanya Super Admin yang dapat mengakses sistem. Kasir dan Admin
                  lainnya akan melihat halaman maintenance.
                </p>
              </div>
            </div>

            {formData?.isMaintenanceMode && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex-1">
                    <label
                      htmlFor="maintenanceMessage"
                      className="block mb-2 text-base font-medium text-yellow-800 dark:text-yellow-300"
                    >
                      Pesan Pemeliharaan (Opsional)
                    </label>
                    <textarea
                      id="maintenanceMessage"
                      name="maintenanceMessage"
                      value={formData?.maintenanceMessage || ''}
                      onChange={handleChange}
                      disabled={isSaving}
                      rows={3}
                      placeholder="Contoh: Sistem sedang dalam perbaikan. Diperkirakan selesai dalam 30 menit."
                      className="bg-white dark:bg-slate-700 border border-yellow-300 dark:border-yellow-700 text-slate-900 dark:text-white text-sm rounded-lg block w-full p-3"
                    />
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      Pesan ini akan ditampilkan kepada pengguna yang mencoba mengakses sistem.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="businessName" className="form-label">
              Nama Usaha (pesan WhatsApp)
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              value={formData.businessName ?? ''}
              onChange={handleChange}
              disabled={isSaving}
              placeholder={DEFAULT_BUSINESS_NAME}
              className="form-input"
            />
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Dipakai untuk salam penutup "Tim …" dan nama cabang. Kosong = {DEFAULT_BUSINESS_NAME}.
            </p>
          </div>
          <div>
            <label htmlFor="trackingUrl" className="form-label">
              Link Cek Status Cucian
            </label>
            <input
              id="trackingUrl"
              name="trackingUrl"
              type="url"
              inputMode="url"
              value={formData.trackingUrl ?? ''}
              onChange={handleChange}
              disabled={isSaving}
              placeholder={DEFAULT_TRACKING_URL}
              className="form-input"
            />
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Nomor invoice ditambahkan otomatis (?invoice=…). Kosong = {DEFAULT_TRACKING_URL}.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="receiptMessage" className="form-label">
            Pesan di Struk
          </label>
          <textarea
            id="receiptMessage"
            name="receiptMessage"
            value={formData.receiptMessage}
            onChange={handleChange}
            disabled={isSaving}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="whatsappFooter" className="form-label">
            Footer Pesan WhatsApp
          </label>
          <textarea
            id="whatsappFooter"
            name="whatsappFooter"
            value={formData.whatsappFooter || DEFAULT_WHATSAPP_FOOTER}
            onChange={handleChange}
            disabled={isSaving}
            rows={4}
            className="form-input font-mono text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pesan ini akan ditampilkan di akhir pesan WhatsApp kepada pelanggan.
            </p>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) =>
                  prev ? { ...prev, whatsappFooter: DEFAULT_WHATSAPP_FOOTER } : null,
                )
              }
              disabled={isSaving}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50"
            >
              Reset Template
            </button>
          </div>
        </div>

        {/* QRIS Dynamic Settings */}
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-blue-600 p-2">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dynamic QRIS</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generate QR code pembayaran dengan nominal otomatis
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="qrisStaticCode" className="form-label">
              Kode QRIS Statis
            </label>
            <textarea
              id="qrisStaticCode"
              name="qrisStaticCode"
              value={formData.qrisStaticCode || ''}
              onChange={handleChange}
              disabled={isSaving}
              rows={3}
              placeholder="Scan QRIS stiker Anda dan paste kode string di sini (format: 00020101021126...)"
              className="form-input text-sm font-mono"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Cara mendapatkan kode: Scan QRIS stiker Anda dengan aplikasi scanner QR, lalu copy
              teks hasilnya.
            </p>
          </div>

          {formData.qrisStaticCode && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
              <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                QRIS terkonfigurasi - Dynamic QRIS akan muncul saat pembayaran QRIS
              </p>
            </div>
          )}
        </div>

        <button type="submit" disabled={isSaving} className="btn btn-primary mt-6">
          {isSaving && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          )}
          <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
        </button>
      </form>

      <SupervisorPinSettings />

    </div>
  );
};

export default SettingsPage;
