import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useStores } from '../../contexts/StoreContext';
import useToasts from '../../contexts/useToasts';
import SupervisorPinSettings from '../../components/SupervisorPinSettings';
import PrinterSettingsPanel from '../../components/PrinterSettingsPanel';
import { usePrinter } from '../../hooks/usePrinter';
import { isStaticQRIS, validateQRIS } from '../../utils/qrisUtils';
import { buildReceiptHeader } from '../../utils/receiptHeader';
import { SpinnerIcon } from '../../components/icons';
import { AlertTriangle, Building2, Printer, QrCode, Receipt, Wrench } from 'lucide-react';
import useAppContext from '../../contexts/useAppContext';
import { UserRole, type Store } from '../../types';
import { isValidAdm4 } from '../../utils/weather';
import {
  buildDefaultWhatsAppFooter,
  DEFAULT_BUSINESS_NAME,
  DEFAULT_TRACKING_URL,
} from '@/utils/whatsappReceipt';

// Template default untuk WhatsApp footer (link cek status per-invoice sudah otomatis di pesan)
const DEFAULT_WHATSAPP_FOOTER = buildDefaultWhatsAppFooter();

const DEFAULT_RECEIPT_MESSAGE = 'Terima kasih telah menggunakan layanan kami.';

/** Nomor HP cabang: angka, spasi, strip, boleh diawali "+". */
const PHONE_PATTERN = /^\+?[\d][\d\s-]{6,28}$/;

interface StoreForm {
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  bmkgAdm4: string;
}

const Section: React.FC<{
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: 'default' | 'warning';
  children: React.ReactNode;
}> = ({ id, icon, title, description, tone = 'default', children }) => (
  <section
    aria-labelledby={id}
    className={`rounded-lg border p-4 sm:p-6 space-y-4 ${
      tone === 'warning'
        ? 'border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20'
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40'
    }`}
  >
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-brand-blue-600 dark:text-brand-blue-400" aria-hidden>
        {icon}
      </span>
      <div>
        <h2 id={id} className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { stores, updateStore } = useStores();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const { currentUser, selectedStoreId } = useAppContext();
  const { panelProps: printerPanelProps } = usePrinter();

  const [formData, setFormData] = useState(settings);
  const [storeForm, setStoreForm] = useState<StoreForm>({
    address: '',
    phone: '',
    latitude: 0,
    longitude: 0,
    bmkgAdm4: '',
  });

  // Mode maintenance & data cabang (RLS stores) hanya bisa diubah Super Admin.
  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

  const currentStore = useMemo(() => {
    if (selectedStoreId === 'all') return null;
    return stores.find((s) => s.id === selectedStoreId) ?? null;
  }, [selectedStoreId, stores]);

  useEffect(() => {
    if (currentStore) {
      setStoreForm({
        address: currentStore.address || '',
        phone: currentStore.phone || '',
        latitude: currentStore.latitude || 0,
        longitude: currentStore.longitude || 0,
        bmkgAdm4: currentStore.bmkgAdm4 || '',
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

  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setStoreForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const fillLocationFromGps = () => {
    if (!navigator.geolocation) {
      addToast('Browser tidak mendukung GPS.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStoreForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        addToast('Lokasi berhasil didapatkan dari GPS!', 'success');
      },
      () => addToast('Gagal mendapatkan lokasi GPS.', 'error'),
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

    const canEditStore = isSuperAdmin && !!currentStore;
    const storePhone = storeForm.phone.trim();
    if (canEditStore && storePhone && !PHONE_PATTERN.test(storePhone)) {
      addToast('No. HP cabang hanya boleh berisi angka, spasi, strip, dan "+".', 'error');
      return;
    }
    const storeAdm4 = storeForm.bmkgAdm4.trim();
    if (canEditStore && storeAdm4 && !isValidAdm4(storeAdm4)) {
      addToast('Kode Wilayah BMKG harus berformat 00.00.00.0000, mis. 32.79.01.1002.', 'error');
      return;
    }

    setIsSaving(true);
    // Create a replaceable toast and keep its id so we can update it later
    const toastId = addToast('Menyimpan perubahan...', 'info');
    try {
      // 1. Pengaturan umum (berlaku untuk semua cabang)
      await updateSettings({ ...formData, qrisStaticCode, businessName, trackingUrl });

      // 2. Data cabang yang dipilih
      if (canEditStore && currentStore) {
        const storeChanges: Partial<Store> = {
          address: storeForm.address.trim(),
          phone: storePhone || null,
          latitude: storeForm.latitude,
          longitude: storeForm.longitude,
        };
        const adm4Changed = (storeAdm4 || null) !== (currentStore.bmkgAdm4 || null);
        // Kirim kolom bmkgAdm4 hanya bila berubah, supaya simpan tetap jalan di database
        // yang belum menjalankan migrasi kolom ini.
        if (adm4Changed) storeChanges.bmkgAdm4 = storeAdm4 || null;
        const changed =
          adm4Changed ||
          storeChanges.address !== (currentStore.address || '') ||
          storeChanges.phone !== (currentStore.phone || null) ||
          storeChanges.latitude !== (currentStore.latitude || 0) ||
          storeChanges.longitude !== (currentStore.longitude || 0);
        if (changed) {
          await updateStore(currentStore.id, storeChanges);
          addAuditLog(`Mengubah data cabang "${currentStore.name}" dari halaman Pengaturan.`);
        }
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

  // Pratinjau kepala struk mengikuti isian yang belum disimpan.
  const headerPreview = buildReceiptHeader(
    formData,
    currentStore
      ? { name: currentStore.name, address: storeForm.address, phone: storeForm.phone }
      : null,
  );
  const storeReadOnly = !isSuperAdmin || isSaving;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Pengaturan usaha, struk, WhatsApp, dan pembayaran berlaku untuk semua cabang. Data cabang
          mengikuti cabang yang dipilih di header.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSaving}>
        {/* --- Identitas usaha & cabang --- */}
        <Section
          id="settings-identity"
          icon={<Building2 className="h-6 w-6" />}
          title="Identitas Usaha & Cabang"
          description="Tampil di kepala struk dan pesan WhatsApp ke pelanggan."
        >
          <div>
            <label htmlFor="businessName" className="form-label">
              Nama Usaha
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
              Judul struk dan salam penutup "Tim …" di WhatsApp. Kosong = {DEFAULT_BUSINESS_NAME}.
            </p>
          </div>

          {currentStore ? (
            <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Cabang {currentStore.name}
                </h3>
                {!isSuperAdmin && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hanya Super Admin yang dapat mengubah data cabang.
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="store-address" className="form-label">
                    Alamat Cabang
                  </label>
                  <input
                    id="store-address"
                    name="address"
                    type="text"
                    value={storeForm.address}
                    onChange={handleStoreChange}
                    readOnly={storeReadOnly}
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="store-phone" className="form-label">
                    No. HP / WhatsApp Cabang
                  </label>
                  <input
                    id="store-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    maxLength={30}
                    value={storeForm.phone}
                    onChange={handleStoreChange}
                    readOnly={storeReadOnly}
                    placeholder="Contoh: 081234567890"
                    className="form-input"
                  />
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="form-label">Koordinat Lokasi (untuk fitur cuaca)</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="store-latitude" className="sr-only">
                      Latitude
                    </label>
                    <input
                      id="store-latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      value={storeForm.latitude}
                      onChange={handleStoreChange}
                      readOnly={storeReadOnly}
                      placeholder="Latitude"
                      className="form-input text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="store-longitude" className="sr-only">
                      Longitude
                    </label>
                    <input
                      id="store-longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      value={storeForm.longitude}
                      onChange={handleStoreChange}
                      readOnly={storeReadOnly}
                      placeholder="Longitude"
                      className="form-input text-sm"
                    />
                  </div>
                </div>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={fillLocationFromGps}
                    disabled={isSaving}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Ambil Lokasi Saya (GPS)
                  </button>
                )}
              </fieldset>

              <div>
                <label htmlFor="store-bmkg-adm4" className="form-label">
                  Kode Wilayah BMKG (kelurahan/desa)
                </label>
                <input
                  id="store-bmkg-adm4"
                  name="bmkgAdm4"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={storeForm.bmkgAdm4}
                  onChange={handleStoreChange}
                  readOnly={storeReadOnly}
                  placeholder="Contoh: 32.79.01.1002"
                  aria-describedby="store-bmkg-adm4-hint"
                  className="form-input font-mono text-sm"
                />
                <p
                  id="store-bmkg-adm4-hint"
                  className="mt-1 text-xs text-slate-500 dark:text-slate-400"
                >
                  Kode Kemendagri 10 digit untuk kelurahan/desa lokasi cabang. Bila diisi, cuaca
                  diambil dari BMKG (lebih akurat untuk Indonesia). Kosongkan untuk memakai
                  Open-Meteo dari koordinat.
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
              Pilih satu cabang di header untuk mengatur alamat, No. HP, dan lokasi cabang.
            </p>
          )}
        </Section>

        {/* --- Struk & WhatsApp --- */}
        <Section
          id="settings-receipt"
          icon={<Receipt className="h-6 w-6" />}
          title="Struk & WhatsApp"
          description="Isi struk cetak dan pesan nota yang dikirim ke pelanggan."
        >
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-center dark:border-slate-600">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Pratinjau kepala struk
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {headerPreview.title}
            </p>
            {headerPreview.details.map((line) => (
              <p key={line} className="text-sm text-slate-600 dark:text-slate-300">
                {line}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="receiptMessage" className="form-label">
              Pesan di Bawah Struk
            </label>
            <textarea
              id="receiptMessage"
              name="receiptMessage"
              value={formData.receiptMessage ?? ''}
              onChange={handleChange}
              disabled={isSaving}
              rows={2}
              placeholder={DEFAULT_RECEIPT_MESSAGE}
              className="form-input"
            />
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Contoh: ketentuan pengambilan atau garansi cucian.
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
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ditambahkan di akhir pesan WhatsApp kepada pelanggan.
              </p>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) =>
                    prev ? { ...prev, whatsappFooter: DEFAULT_WHATSAPP_FOOTER } : null,
                  )
                }
                disabled={isSaving}
                className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Reset Template
              </button>
            </div>
          </div>
        </Section>

        {/* --- Pembayaran --- */}
        <Section
          id="settings-payment"
          icon={<QrCode className="h-6 w-6" />}
          title="Pembayaran QRIS"
          description="QR pembayaran dengan nominal otomatis, dibuat dari QRIS statis toko."
        >
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
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Cara mendapatkan kode: scan stiker QRIS dengan aplikasi scanner QR, lalu salin teks
              hasilnya. Kosongkan untuk menonaktifkan QRIS dinamis.
            </p>
          </div>

          {formData.qrisStaticCode && (
            <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300">
              QRIS terkonfigurasi — QR dinamis muncul saat pembayaran QRIS.
            </p>
          )}
        </Section>

        {/* --- Sistem (Super Admin) --- */}
        {isSuperAdmin && (
          <Section
            id="settings-maintenance"
            icon={<Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
            title="Mode Pemeliharaan"
            description="Aktifkan saat melakukan perbaikan sistem."
            tone="warning"
          >
            <div className="flex items-start gap-3 rounded-lg bg-white p-4 dark:bg-slate-800/50">
              <input
                type="checkbox"
                id="isMaintenanceMode"
                name="isMaintenanceMode"
                checked={formData.isMaintenanceMode || false}
                onChange={handleChange}
                disabled={isSaving}
                className="mt-1 h-5 w-5 rounded border-slate-300 bg-slate-100 text-yellow-600 focus:ring-2 focus:ring-yellow-500 dark:border-slate-600 dark:bg-slate-700 dark:ring-offset-slate-800 dark:focus:ring-yellow-600"
              />
              <div className="flex-1">
                <label
                  htmlFor="isMaintenanceMode"
                  className="cursor-pointer text-base font-medium text-slate-900 dark:text-white"
                >
                  Aktifkan Mode Pemeliharaan
                </label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Ketika aktif, hanya Super Admin yang dapat mengakses sistem. Kasir dan Admin di
                  semua cabang akan melihat halaman maintenance.
                </p>
              </div>
            </div>

            {formData.isMaintenanceMode && (
              <div className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/30">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" aria-hidden />
                <div className="flex-1">
                  <label
                    htmlFor="maintenanceMessage"
                    className="mb-2 block text-base font-medium text-yellow-800 dark:text-yellow-300"
                  >
                    Pesan Pemeliharaan (Opsional)
                  </label>
                  <textarea
                    id="maintenanceMessage"
                    name="maintenanceMessage"
                    value={formData.maintenanceMessage || ''}
                    onChange={handleChange}
                    disabled={isSaving}
                    rows={3}
                    placeholder="Contoh: Sistem sedang dalam perbaikan. Diperkirakan selesai dalam 30 menit."
                    className="block w-full rounded-lg border border-yellow-300 bg-white p-3 text-sm text-slate-900 dark:border-yellow-700 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </Section>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="btn btn-primary">
            {isSaving && <SpinnerIcon className="h-5 w-5 text-white" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* --- Printer: disimpan di perangkat, tidak ikut tombol Simpan --- */}
      <Section
        id="settings-printer"
        icon={<Printer className="h-6 w-6" />}
        title="Printer Struk (perangkat ini)"
        description="Tersimpan otomatis di browser perangkat ini. Atur di setiap HP/komputer kasir."
      >
        <PrinterSettingsPanel {...printerPanelProps} className="space-y-4 text-sm" />
      </Section>

      <SupervisorPinSettings />
    </div>
  );
};

export default SettingsPage;
