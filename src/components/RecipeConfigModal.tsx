import React, { useState, useEffect } from 'react';
import { XIcon, CheckCircleIcon } from './icons';
import { InventoryItem, InventoryRecipe } from '../types';
import { useRecipes, useRecipeMutations } from '../contexts/InventoryRecipeContext';

interface RecipeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  storeId: string;
}

const RecipeConfigModal: React.FC<RecipeConfigModalProps> = ({
  isOpen,
  onClose,
  inventoryItems,
  storeId,
}) => {
  const { data: recipes = [], isLoading: loadingRecipes } = useRecipes(storeId);
  const { upsertRecipe, isLoading: saving } = useRecipeMutations();
  const [recipeValues, setRecipeValues] = useState<Record<string, string>>({});

  // Initialize recipe values from existing recipes
  useEffect(() => {
    if (recipes.length > 0) {
      // eslint-disable-next-line
      setRecipeValues((prev) => {
        // Only update if empty to avoid overwriting user edits or causing loops
        if (Object.keys(prev).length === 0) {
          const values: Record<string, string> = {};
          recipes.forEach((r: InventoryRecipe) => {
            values[r.inventoryItemId] = r.usagePerKg.toString();
          });
          return values;
        }
        return prev;
      });
    }
  }, [recipes]);

  if (!isOpen) return null;

  const handleValueChange = (itemId: string, value: string) => {
    setRecipeValues((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSave = async (itemId: string) => {
    const usagePerKg = parseFloat(recipeValues[itemId] || '0');
    if (isNaN(usagePerKg) || usagePerKg < 0) {
      alert('Masukkan nilai yang valid');
      return;
    }

    try {
      await upsertRecipe({
        inventoryItemId: itemId,
        usagePerKg,
        storeId,
      });
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Gagal menyimpan resep');
    }
  };

  const handleSaveAll = async () => {
    for (const item of inventoryItems) {
      if (recipeValues[item.id]) {
        await handleSave(item.id);
      }
    }
    onClose();
  };

  // Default recommendations
  const getDefaultValue = (itemName: string): number => {
    const name = itemName.toLowerCase();
    if (name.includes('deterjen') || name.includes('detergent')) return 10;
    if (name.includes('softener') || name.includes('pewangi') || name.includes('pelembut')) return 5;
    if (name.includes('plastik') || name.includes('kantong')) return 1;
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Konfigurasi Resep Bahan Baku
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tentukan penggunaan bahan per kg cucian
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Info box */}
        <div className="mx-4 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>📊 Logika:</strong> Setiap transaksi kiloan akan otomatis mengurangi stok virtual
            berdasarkan resep yang dikonfigurasi di sini.
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Contoh: 1 kg cucian = 10 ml deterjen + 5 ml softener + 1 pcs plastik
          </p>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {loadingRecipes ? (
            <div className="text-center py-8 text-slate-500">Memuat resep...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Nama Bahan</th>
                  <th className="px-3 py-2 text-center font-semibold">Unit</th>
                  <th className="px-3 py-2 text-center font-semibold">Penggunaan per Kg</th>
                  <th className="px-3 py-2 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {inventoryItems.map((item) => {
                  const defaultVal = getDefaultValue(item.name);
                  const currentValue = recipeValues[item.id] || '';
                  const hasRecipe = recipes.some((r: InventoryRecipe) => r.inventoryItemId === item.id);

                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">
                        {item.name}
                        {hasRecipe && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            ✓ Dikonfigurasi
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-500">{item.unit}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={currentValue}
                            onChange={(e) => handleValueChange(item.id, e.target.value)}
                            placeholder={defaultVal > 0 ? `Saran: ${defaultVal}` : '0'}
                            className="w-28 px-2 py-1 text-center border rounded dark:bg-slate-700 dark:border-slate-600"
                          />
                          <span className="text-slate-500 text-xs">{item.unit}/kg</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleSave(item.id)}
                          disabled={!currentValue || saving}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Simpan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Tutup
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving || Object.keys(recipeValues).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircleIcon className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeConfigModal;
