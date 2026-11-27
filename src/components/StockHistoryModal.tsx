import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import { InventoryItem, InventoryMovementKind } from '../types';
import { useInventoryMovements, MOVEMENT_KIND_LABELS } from '../contexts/InventoryRecipeContext';
import { formatQty, formatQtyDelta } from '../utils/inventoryFormat';

interface StockHistoryModalProps {
  item: InventoryItem;
  onClose: () => void;
}

const KIND_STYLE: Record<InventoryMovementKind, string> = {
  awal: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  restok: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  penyesuaian: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  opname: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  transaksi: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  koreksi_transaksi: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** 100 mutasi terakhir sebuah item: restok, potong otomatis per nota, opname, dll. */
const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ item, onClose }) => {
  const { data: movements = [], isLoading, error } = useInventoryMovements({ itemId: item.id });
  // Batas 30 hari dihitung sekali saat modal dibuka.
  const [since] = useState(() => Date.now() - 30 * 24 * 60 * 60 * 1000);

  const usedLast30 = movements
    .filter((m) => m.kind === 'transaksi' && m.createdAt.getTime() > since)
    .reduce((sum, m) => sum - m.quantity, 0);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Riwayat Stok · ${item.name}`}
      footer={
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Tutup
        </button>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
            <p className="text-slate-500 dark:text-slate-400">Stok sekarang</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatQty(item.stock)} {item.unit}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
            <p className="text-slate-500 dark:text-slate-400">Potong otomatis 30 hari</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatQty(usedLast30)} {item.unit}
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center py-6 text-slate-500">Memuat riwayat…</p>
        ) : error ? (
          <p className="text-center py-6 text-red-600 dark:text-red-400">
            Gagal memuat riwayat stok.
          </p>
        ) : movements.length === 0 ? (
          <p className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
            Belum ada perubahan stok yang tercatat.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {movements.map((m) => (
              <li key={m.id} className="py-2 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${KIND_STYLE[m.kind]}`}
                    >
                      {MOVEMENT_KIND_LABELS[m.kind] ?? m.kind}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {dateFormatter.format(m.createdAt)}
                      {m.createdByName ? ` · ${m.createdByName}` : ''}
                    </span>
                  </div>
                  {m.transactionId && m.invoiceCode ? (
                    <Link
                      to={`/transactions/${m.transactionId}/details`}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                      onClick={onClose}
                    >
                      Nota {m.invoiceCode}
                    </Link>
                  ) : (
                    m.note && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 break-words">
                        {m.note}
                      </p>
                    )
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-mono font-semibold ${
                      m.quantity >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatQtyDelta(m.quantity)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    sisa {formatQty(m.stockAfter)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default StockHistoryModal;
