import * as React from 'react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import MaintenanceFormModal from './MaintenanceFormModal';
import { EditIcon, Trash2Icon } from './icons';
import { useAssets } from '../contexts/AssetContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useToasts from '../contexts/useToasts';
import { Asset, MaintenanceLog } from '@/types';

interface MaintenanceHistoryModalProps {
  asset: Asset;
  onClose: () => void;
}

const errorMessage = (error: unknown) => (error instanceof Error ? `: ${error.message}` : '.');

const MaintenanceHistoryModal: React.FC<MaintenanceHistoryModalProps> = ({ asset, onClose }) => {
  const { updateMaintenanceLog, deleteMaintenanceLog } = useAssets();
  const { addAuditLog } = useAuditLogs();
  const { addToast } = useToasts();
  const [editingLog, setEditingLog] = React.useState<MaintenanceLog | null>(null);
  const [deletingLog, setDeletingLog] = React.useState<MaintenanceLog | null>(null);

  // Salin dulu sebelum sort — jangan mutasi array milik cache React Query.
  const sortedHistory = React.useMemo(
    () =>
      [...asset.maintenanceHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [asset.maintenanceHistory],
  );
  const totalCost = sortedHistory.reduce((sum, log) => sum + (Number(log.cost) || 0), 0);

  const handleSaveEdit = async (log: Omit<MaintenanceLog, 'id'>) => {
    if (!editingLog) return;
    try {
      await updateMaintenanceLog(asset.id, editingLog.id, log);
      addAuditLog(
        `Memperbarui log pemeliharaan aset "${asset.name}": ${log.description}.`,
        asset.storeId,
      );
      addToast('Log perawatan diperbarui.', 'success');
      setEditingLog(null);
    } catch (error) {
      addToast(`Gagal memperbarui log${errorMessage(error)}`, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deletingLog) return;
    try {
      await deleteMaintenanceLog(asset.id, deletingLog.id);
      addAuditLog(
        `Menghapus log pemeliharaan aset "${asset.name}": ${deletingLog.description}.`,
        asset.storeId,
      );
      addToast('Log perawatan dihapus.', 'success');
    } catch (error) {
      addToast(`Gagal menghapus log${errorMessage(error)}`, 'error');
    } finally {
      setDeletingLog(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={`Riwayat Pemeliharaan: ${asset.name}`}
        footer={
          <>
            <button onClick={onClose} className="btn btn-secondary">
              Tutup
            </button>
          </>
        }
      >
        {sortedHistory.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {sortedHistory.length} catatan · Total biaya{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Rp {totalCost.toLocaleString('id-ID')}
              </span>
            </p>
            <div className="max-h-80 overflow-y-auto space-y-3">
              {sortedHistory.map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-start justify-between gap-2 p-3 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-700"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                      Tanggal: {new Date(log.date).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-base text-slate-600 dark:text-slate-300 break-words">
                      {log.description}
                    </p>
                    <p className="text-base font-medium text-slate-700 dark:text-slate-200 mt-1">
                      Biaya: Rp {(Number(log.cost) || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {/* Log lama tanpa id tidak bisa diubah dengan aman. */}
                  {log.id && (
                    <div className="flex shrink-0 items-center">
                      <button
                        aria-label="Edit log"
                        title="Edit log"
                        onClick={() => setEditingLog(log)}
                        className="btn btn-ghost btn-icon"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        aria-label="Hapus log"
                        title="Hapus log"
                        onClick={() => setDeletingLog(log)}
                        className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
                      >
                        <Trash2Icon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-base text-slate-500 dark:text-slate-400">
            Tidak ada riwayat pemeliharaan.
          </p>
        )}
      </Modal>

      {editingLog && (
        <MaintenanceFormModal
          assetName={asset.name}
          initialLog={editingLog}
          onClose={() => setEditingLog(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingLog && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeletingLog(null)}
          onConfirm={confirmDelete}
          title="Hapus Log Perawatan"
          message={`Hapus log "${deletingLog.description}"? Tindakan ini tidak bisa dibatalkan.`}
        />
      )}
    </>
  );
};

export default MaintenanceHistoryModal;
