import React from 'react';
import { Trash2Icon, MessageSquareIcon, TagIcon } from '../icons';
import { Service, ServiceCategory, ExtendedTransactionItem } from '@/types';
import { resolveMinQuantity, formatMinQuantity } from '../../utils/serviceMinimum';

interface TransactionItemsTableProps {
  items: ExtendedTransactionItem[];
  services: Service[];
  handleItemChange: (
    index: number,
    field: 'quantity' | 'taggedItems' | 'itemDetails' | 'length' | 'width',
    value: number | string | Array<{ note: string }>,
  ) => void;
  handleOpenNotesModal: (index: number) => void;
  handleOpenKiloanTaggingModal: (index: number) => void;
  handleRemoveItem: (index: number) => void;
  id?: string;
}

const TransactionItemsTable: React.FC<TransactionItemsTableProps> = ({
  items,
  services,
  handleItemChange,
  handleOpenNotesModal,
  handleOpenKiloanTaggingModal,
  handleRemoveItem,
  id,
}) => {
  return (
    <div className="overflow-x-auto" id={id}>
      <table className="w-full text-lg text-left text-slate-500 dark:text-slate-400">
        <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Layanan</th>
            <th className="px-4 py-3">Jumlah</th>
            <th className="px-4 py-3 text-center">Aksi</th>
            <th className="px-4 py-3 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => {
              const service = services.find((s) => s.id === item.serviceId);
              const isSatuan = service?.category === ServiceCategory.Satuan;
              const isKiloan = service?.category === ServiceCategory.Kiloan;
              const minQuantity = resolveMinQuantity(service, item.serviceName);
              const isBelowMinimum = minQuantity > 0 && item.quantity < minQuantity;

              return (
                <tr key={index} className="border-b dark:border-slate-700">
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                    {item.serviceName}
                  </td>
                  <td className="px-4 py-2 w-48">
                    {item.unit.toLowerCase() === 'm2' || item.unit.toLowerCase() === 'meter' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 w-4">P:</span>
                          <input
                            type="number"
                            id={`item-length-${index}`}
                            name={`item-length-${index}`}
                            min="0"
                            step="0.1"
                            placeholder="P"
                            value={item.length}
                            onChange={(e) =>
                              handleItemChange(index, 'length', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            autoComplete="off"
                          />
                          <span className="text-sm text-slate-500">m</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 w-4">L:</span>
                          <input
                            type="number"
                            id={`item-width-${index}`}
                            name={`item-width-${index}`}
                            min="0"
                            step="0.1"
                            placeholder="L"
                            value={item.width}
                            onChange={(e) =>
                              handleItemChange(index, 'width', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            autoComplete="off"
                          />
                        </div>
                        <div className="text-sm font-bold text-blue-600 mt-1">
                          = {item.quantity} {item.unit}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center">
                          <input
                            type="number"
                            id={`item-quantity-${index}`}
                            name={`item-quantity-${index}`}
                            min={minQuantity > 0 ? minQuantity : 0}
                            step={item.unit === 'kg' ? '0.01' : '1'}
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            aria-invalid={isBelowMinimum || undefined}
                            aria-describedby={
                              minQuantity > 0 ? `item-quantity-min-${index}` : undefined
                            }
                            className={`w-24 bg-slate-50 border text-slate-900 text-lg rounded-lg p-2.5 dark:bg-slate-700 dark:text-white ${
                              isBelowMinimum
                                ? 'border-red-500 dark:border-red-500'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                            autoComplete="off"
                          />
                          <span className="ml-2 text-base text-slate-500 dark:text-slate-400">
                            {item.unit}
                          </span>
                        </div>
                        {minQuantity > 0 && (
                          <p
                            id={`item-quantity-min-${index}`}
                            className={`mt-1 text-xs ${
                              isBelowMinimum
                                ? 'font-semibold text-red-600 dark:text-red-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            Minimal {formatMinQuantity(minQuantity)} {item.unit}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center">
                      {isSatuan && (
                        <button
                          type="button"
                          onClick={() => handleOpenNotesModal(index)}
                          title="Catatan per Item"
                          className="p-2 text-blue-600 hover:text-blue-900 relative rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <MessageSquareIcon className="w-6 h-6" />
                          {item.itemDetails?.slice(0, item.quantity).some((d) => d.note) && (
                            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800"></span>
                          )}
                        </button>
                      )}
                      {isKiloan && (
                        <button
                          type="button"
                          onClick={() => handleOpenKiloanTaggingModal(index)}
                          title="Tag Item Kiloan"
                          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white relative rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <TagIcon className="w-6 h-6" />
                          {item.taggedItems && (
                            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800"></span>
                          )}
                        </button>
                      )}
                      <button
                        aria-label="Hapus item"
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        title="Hapus Item"
                        className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
                      >
                        <Trash2Icon className="w-6 h-6" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4 text-slate-500 dark:text-slate-400">
                Belum ada layanan yang ditambahkan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionItemsTable;
