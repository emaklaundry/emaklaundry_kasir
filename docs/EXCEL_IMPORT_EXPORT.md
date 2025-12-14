# Excel Import/Export Feature

## ✅ Status Implementasi

### Completed

- ✅ ExcelJS library sudah terpasang (package.json)
- ✅ Utility functions lengkap (`src/utils/excelUtils.ts`)
- ✅ Icons (DownloadIcon, UploadIcon) ditambahkan
- ✅ **CustomersPage** - Import/Export implemented

### In Progress

- 🔄 ServicesPage
- 🔄 InventoryPage
- 🔄 AssetsPage
- 🔄 ExpensesPage

## 📋 Fitur yang Tersedia

### Export ke Excel

- Export data existing ke file Excel
- Format tabel terstruktur dengan header
- Auto-width columns

### Import dari Excel

- Import bulk data dari Excel
- Support update (jika ID ada) dan insert (jika ID kosong)
- Validation dan error handling
- Progress notification

### Download Template

- Template Excel kosong dengan format yang benar
- Contoh data di baris pertama
- Memudahkan user untuk prepare data

## 🎯 Implementasi per Halaman

### 1. ✅ Customers Page (SELESAI)

**File:** `src/pages/management/CustomersPage.tsx`

**Tombol yang ditambahkan:**

- 📥 **Template** - Download template Excel kosong
- ⬆️ **Import** - Import data dari Excel (update atau insert baru)
- ⬇️ **Export** - Export semua data pelanggan ke Excel

**Kolom Excel:**

- ID
- Nama
- Nomor HP
- Alamat
- Catatan

---

### 2. Services Page

**File:** `src/pages/management/ServicesPage.tsx`

**Kolom Excel:**

- ID
- Nama Layanan
- Kategori (Kiloan/Satuan/Express/Setrika)
- Harga
- Unit
- Estimasi (hari)
- Deskripsi

**Implementasi:**

```tsx
// Import statements
import {
  exportServicesToExcel,
  importServicesFromExcel,
  downloadServiceTemplate,
} from '../../utils/excelUtils';
import { DownloadIcon, UploadIcon } from '../../components/icons';

// State
const fileInputRef = useRef<HTMLInputElement>(null);

// Export handler
const handleExportToExcel = async () => {
  try {
    await exportServicesToExcel(services);
    addToast('Data layanan berhasil di-export ke Excel', 'success');
  } catch (error) {
    console.error('Export error:', error);
    addToast('Gagal export data ke Excel', 'error');
  }
};

// Import handler
const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsSaving(true);
  const toastId = addToast('Memproses import data...', 'loading');

  try {
    const importedServices = await importServicesFromExcel(file);

    let successCount = 0;
    let errorCount = 0;

    for (const service of importedServices) {
      try {
        if (service.id) {
          await updateService.mutateAsync({ id: service.id, data: service });
        } else {
          await addService.mutateAsync(service);
        }
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    updateToast(toastId, `Berhasil import ${successCount} layanan`, 'success');
  } catch (error) {
    updateToast(toastId, 'Gagal import data dari Excel', 'error');
  } finally {
    setIsSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
};

// Template handler
const handleDownloadTemplate = async () => {
  try {
    await downloadServiceTemplate();
    addToast('Template Excel berhasil didownload', 'success');
  } catch (error) {
    addToast('Gagal download template', 'error');
  }
};
```

**Buttons di JSX:**

```tsx
{
  /* Excel Import/Export Buttons */
}
<div className="flex items-center gap-2">
  <button
    onClick={handleDownloadTemplate}
    className="flex items-center gap-2 px-3 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
    title="Download Template Excel"
  >
    <DownloadIcon className="w-4 h-4" />
    <span className="hidden sm:inline text-sm">Template</span>
  </button>

  <input
    ref={fileInputRef}
    type="file"
    accept=".xlsx,.xls"
    onChange={handleImportFromExcel}
    className="hidden"
  />
  <button
    onClick={() => fileInputRef.current?.click()}
    className="flex items-center gap-2 px-3 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700"
    title="Import dari Excel"
  >
    <UploadIcon className="w-4 h-4" />
    <span className="hidden sm:inline text-sm">Import</span>
  </button>

  <button
    onClick={handleExportToExcel}
    disabled={services.length === 0}
    className="flex items-center gap-2 px-3 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
    title="Export ke Excel"
  >
    <DownloadIcon className="w-4 h-4" />
    <span className="hidden sm:inline text-sm">Export</span>
  </button>
</div>;
```

---

### 3. Inventory Page

**File:** `src/pages/management/InventoryPage.tsx`

**Kolom Excel:**

- ID
- Nama Item
- Stok
- Min Stok Alert
- Unit

**Implementasi sama seperti Services**, hanya ganti:

- `exportInventoryToExcel`
- `importInventoryFromExcel`
- `downloadInventoryTemplate`
- Context: `useInventoryMutations()`

---

### 4. Assets Page

**File:** `src/pages/management/AssetsPage.tsx`

**Kolom Excel:**

- ID
- Nama Aset
- Serial Number
- Tanggal Beli
- Harga Beli
- Status

**Implementasi sama seperti Services**, hanya ganti:

- `exportAssetsToExcel`
- `importAssetsFromExcel`
- `downloadAssetTemplate`
- Context: `useAssetMutations()`

---

### 5. Expenses Page

**File:** `src/pages/management/ExpensesPage.tsx`

**Kolom Excel:**

- ID
- Tanggal
- Kategori
- Jumlah
- Deskripsi
- Catatan

**Implementasi sama seperti Services**, hanya ganti:

- `exportExpensesToExcel`
- `importExpensesFromExcel`
- `downloadExpenseTemplate`
- Context: `useExpenseMutations()`

---

## 🔧 Testing Checklist

### Per Halaman

- [ ] Template download works
- [ ] Export works dengan data existing
- [ ] Import works untuk data baru (ID kosong)
- [ ] Import works untuk update data (ID ada)
- [ ] Error handling works
- [ ] Toast notifications muncul
- [ ] File input di-reset setelah import
- [ ] Button disabled saat tidak ada data (export)
- [ ] Loading state ditampilkan saat processing

### Edge Cases

- [ ] Import file Excel kosong
- [ ] Import dengan format salah
- [ ] Import dengan sheet name salah
- [ ] Export saat tidak ada data
- [ ] Import file non-Excel (.txt, .pdf, dll)

---

## 📝 Notes untuk Developer

1. **Mutation Context**: Pastikan setiap halaman sudah import mutation hooks yang sesuai
2. **Store ID**: Untuk multi-store, pastikan `storeId` di-handle dengan benar saat import
3. **Validation**: ExcelUtils sudah handle basic validation, tapi bisa ditambahkan validasi custom per halaman
4. **Performance**: Import besar (>1000 rows) mungkin perlu batch processing
5. **Security**: File upload hanya accept `.xlsx` dan `.xls`

---

## 🚀 Next Steps

1. Implement untuk ServicesPage
2. Implement untuk InventoryPage
3. Implement untuk AssetsPage
4. Implement untuk ExpensesPage
5. Testing menyeluruh semua fitur
6. Update user documentation

---

## 📚 Dependencies

- ✅ `exceljs@^4.4.0` - Already installed in package.json
- ✅ Icons (DownloadIcon, UploadIcon) - Added to icons.tsx
- ✅ Excel utilities - Created in utils/excelUtils.ts
