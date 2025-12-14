import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { KeyIcon } from '../../components/icons';
import { Wrench, AlertTriangle } from 'lucide-react';
import useAppContext from '../../contexts/useAppContext';
import { UserRole } from '../../types';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const { currentUser } = useAppContext();

  const [formData, setFormData] = useState(settings);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Only Super Admin can toggle maintenance mode
  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isNumber = ['taxRate', 'discountRate'].includes(name);
    
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: isCheckbox
              ? (e.target as HTMLInputElement).checked
              : isNumber
                ? parseFloat(value) || 0
                : value,
          }
        : null,
    );
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    // Create a replaceable toast and keep its id so we can update it later
    const toastId = addToast('Menyimpan perubahan...', 'info');
    try {
      await updateSettings(formData);
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
    return <div>Loading settings...</div>;
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto relative">
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
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Pengaturan Aplikasi
        </h1>
        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm sm:text-base transition-colors touch-target"
        >
          <KeyIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Ubah Password</span>
          <span className="sm:hidden">Password</span>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSaving}>
        {/* Maintenance Mode Section - Only for Super Admin */}
        {isSuperAdmin && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-6 space-y-4">
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
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded-r-lg">
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

        <div>
          <label
            htmlFor="receiptMessage"
            className="block mb-2 text-lg font-medium text-slate-900 dark:text-white"
          >
            Pesan di Struk
          </label>
          <textarea
            id="receiptMessage"
            name="receiptMessage"
            value={formData.receiptMessage}
            onChange={handleChange}
            disabled={isSaving}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="taxRate"
              className="block mb-2 text-lg font-medium text-slate-900 dark:text-white"
            >
              Pajak (%)
            </label>
            <input
              type="number"
              id="taxRate"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
              disabled={isSaving}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="discountRate"
              className="block mb-2 text-lg font-medium text-slate-900 dark:text-white"
            >
              Diskon (%)
            </label>
            <input
              type="number"
              id="discountRate"
              name="discountRate"
              value={formData.discountRate}
              onChange={handleChange}
              disabled={isSaving}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="mt-6 px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
        >
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

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default SettingsPage;
