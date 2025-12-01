import React, { useState } from 'react';
import { useEffect } from 'react';
import { useAssets } from '../contexts/AssetContext';
import { formatRupiah, parseRupiah } from '../utils/formatting';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useToasts from '../contexts/useToasts';
import Modal from './Modal';
import { MaintenanceLog } from '@/types';

interface QuickMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickMaintenanceModal: React.FC<QuickMaintenanceModalProps> = ({ isOpen, onClose }) => {
  const { assets, updateAsset } = useAssets();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [formData, setFormData] = useState<Omit<MaintenanceLog, 'id'>>(() => ({
    date: new Date(),
    description: '',
    cost: 0,
  }));

  // Ensure selectedAssetId and form defaults are in sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSelectedAssetId((prev) => prev || assets[0]?.id || '');
        setFormData({ date: new Date(), description: '', cost: 0 });
      }, 0);
    }
  }, [isOpen, assets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'cost') {
      setFormData((prev) => ({ ...prev, cost: parseRupiah(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === 'date' ? new Date(value) : value }));
    }
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAssetId(e.target.value);
  };

  const handleSave = async () => {
    if (!selectedAssetId || !formData.description) {
      addToast('Silakan pilih aset dan isi deskripsi kerusakan.', 'warning');
      return;
    }

    const newLog: MaintenanceLog = { ...formData, id: Date.now().toString() };
    const assetToUpdate = assets.find((asset) => asset.id === selectedAssetId);

    if (!assetToUpdate) {
      addToast('Aset tidak ditemukan.', 'error');
      return;
    }

    const toastId = addToast('Menyimpan laporan...', 'info');
    // setIsSavingMaintenance(true);
    try {
      await updateAsset(selectedAssetId, {
        maintenanceHistory: [...assetToUpdate.maintenanceHistory, newLog],
      });

      addAuditLog(
        `Melaporkan kerusakan cepat untuk aset "${assetToUpdate.name}": ${formData.description}.`,
        assetToUpdate.storeId,
      );

      updateToast(toastId, 'Laporan perawatan berhasil disimpan.', 'success');

      // Reset form
      setFormData({ date: new Date(), description: '', cost: 0 });
      setSelectedAssetId(assets[0]?.id || '');
      onClose();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        updateToast(
          toastId,
          `Gagal menyimpan laporan: ${(error as { message: string }).message}`,
          'error',
        );
      } else {
        updateToast(toastId, 'Gagal menyimpan laporan: Unknown error', 'error');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Laporkan Kerusakan Aset"
      footer={
        <>
          <button
            onClick={onClose}
            className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className={`text-white font-medium rounded-lg text-lg px-6 py-3 ${!selectedAssetId || !formData.description ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'}`}
            disabled={!selectedAssetId || !formData.description}
          >
            Simpan Laporan
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label
            htmlFor="asset"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Pilih Aset
          </label>
          <select
            name="asset"
            id="asset"
            value={selectedAssetId}
            onChange={handleAssetChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="date"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Tanggal
          </label>
          <input
            type="date"
            name="date"
            id="date"
            value={formData.date.toISOString().split('T')[0]}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Deskripsi Kerusakan
          </label>
          <input
            type="text"
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Contoh: Mesin cuci bocor"
            required
          />
        </div>
        <div>
          <label
            htmlFor="cost"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Biaya Perbaikan (Rp)
          </label>
          <input
            type="text"
            name="cost"
            id="cost"
            value={formatRupiah(formData.cost)}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Opsional"
          />
        </div>
      </form>
    </Modal>
  );
};

export default QuickMaintenanceModal;
