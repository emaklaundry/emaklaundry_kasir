import * as React from 'react';
import Modal from './Modal';
import { Asset } from '@/types';

interface MaintenanceHistoryModalProps {
  asset: Asset;
  onClose: () => void;
}

function MaintenanceHistoryModal({ asset, onClose }: MaintenanceHistoryModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Riwayat Pemeliharaan: ${asset.name}`}
      footer={
        <>
          <button
            onClick={onClose}
            className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3"
          >
            Tutup
          </button>
        </>
      }
    >
      {asset.maintenanceHistory.length > 0 ? (
        <div className="max-h-80 overflow-y-auto space-y-3">
          {asset.maintenanceHistory
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((log) => (
              <div
                key={log.id}
                className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-700"
              >
                <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                  Tanggal: {new Date(log.date).toLocaleDateString('id-ID')}
                </p>
                <p className="text-base text-slate-600 dark:text-slate-300">{log.description}</p>
                <p className="text-base font-medium text-slate-700 dark:text-slate-200 mt-1">
                  Biaya: Rp {log.cost.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-base text-slate-500 dark:text-slate-400">
          Tidak ada riwayat pemeliharaan.
        </p>
      )}
    </Modal>
  );
}

export default MaintenanceHistoryModal;
