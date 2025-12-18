# Update: Estimasi Biaya Perawatan Terjadwal & Data Pengeluaran Lengkap

## Tanggal: 17 Desember 2025

## Masalah

1. Data perawatan aset yang dijadwalkan tidak menampilkan biaya (Rp 0) pada halaman Backup & Restore
2. Data pengeluaran pada halaman Backup & Restore hanya menampilkan 0 karena tidak mengambil semua sumber data

## Solusi

1. Menambahkan field `estimatedCost` ke scheduled maintenance untuk menyimpan estimasi biaya
2. Mengubah halaman Backup & Restore untuk mengambil data pengeluaran dari **3 sumber**:
   - Tabel `expenses` (pengeluaran operasional)
   - Tabel `assets` - kolom `purchaseDate` & `purchaseCost` (pembelian aset)
   - Tabel `assets` - kolom `maintenanceHistory` (biaya perawatan aset)

## Perubahan Yang Dilakukan

### 1. Database Schema

- **File**: `database/setup/complete_setup.sql`
- **Perubahan**: Tambah kolom `estimatedCost numeric DEFAULT 0` ke tabel `scheduled_maintenances`

### 2. Migration SQL

- **File**: `database/migrations/add_estimated_cost_to_scheduled_maintenances.sql`
- **Perintah**:
  ```sql
  ALTER TABLE public.scheduled_maintenances
  ADD COLUMN IF NOT EXISTS "estimatedCost" numeric DEFAULT 0;
  ```

### 3. TypeScript Types

- **File**: `src/types/index.ts`
- **Perubahan**: Tambah `estimatedCost?: number;` ke interface `ScheduledMaintenance`

### 4. UI Form

- **File**: `src/components/ScheduledMaintenanceFormModal.tsx`
- **Perubahan**:
  - Tambah field input "Estimasi Biaya (Rp)"
  - Tambah `estimatedCost` ke form data dengan default 0
  - Input type: number dengan step 1000

### 5. Dashboard Logic

- **File**: `src/pages/Dashboard.tsx`
- **Perubahan**: Update `handleMarkMaintenanceAsComplete` untuk menggunakan `schedule.estimatedCost`
  ```typescript
  cost: schedule.estimatedCost || 0,  // Previously: cost: 0
  ```

### 6. Backup & Restore Page - DATA LENGKAP

- **File**: `src/pages/management/BackupRestorePage.tsx`
- **Perubahan**: Gunakan logika yang sama dengan ReportsPage untuk menggabungkan data dari 3 sumber:

  ```typescript
  // 1. Fetch semua expenses dari database
  const allOperationalExpenses = await supabase.from('expenses').select('*');

  // 2. Fetch assets untuk backfill pembelian & perawatan
  const assetsData = await supabase.from('assets').select('*');

  // 3. Gabungkan:
  //    - Pembelian Aset (purchaseDate, purchaseCost)
  //    - Perawatan Aset (maintenanceHistory[].cost)
  //    - Expenses operasional

  return [...allOperationalExpenses, ...assetExpenses];
  ```

### 7. Context (Otomatis)

- **File**: `src/contexts/ScheduledMaintenanceContext.tsx`
- Tidak perlu perubahan - sudah menggunakan spread operator

## Cara Menggunakan

### Untuk Database Baru

Jalankan `database/setup/complete_setup.sql` yang sudah diupdate

### Untuk Database yang Sudah Ada

Jalankan migration di Supabase SQL Editor:

```sql
-- Jalankan file ini:
database/migrations/add_estimated_cost_to_scheduled_maintenances.sql
```

### Di Aplikasi

1. Buka halaman **Asset Management**
2. Pilih aset yang ingin dijadwalkan perawatannya
3. Klik "Jadwal Perawatan"
4. Isi form dengan:
   - Deskripsi tugas perawatan
   - Frekuensi (berapa kali diulang)
   - Tanggal jatuh tempo berikutnya
   - **[BARU]** Estimasi Biaya (dalam Rupiah)
5. Simpan

### Backup & Restore - Data Lengkap

Sekarang halaman Backup & Restore akan menampilkan **SEMUA** pengeluaran:

- ✅ Pengeluaran operasional dari tabel `expenses`
- ✅ Pembelian aset dari tabel `assets` (10 data dari 12/12/2019 dll)
- ✅ Biaya perawatan aset dari `maintenanceHistory`
- ✅ Tidak ada duplikasi - ada pengecekan otomatis

## Testing

1. ✅ Build successful - no TypeScript errors
2. ✅ Form menampilkan field estimasi biaya
3. ✅ Data tersimpan ke database
4. ✅ Biaya tercatat saat maintenance selesai
5. ✅ **Expense muncul LENGKAP di Backup & Restore page**
6. ✅ **Semua 10 data pembelian aset dari 12/12/2019 muncul**
7. ✅ **Tidak ada duplikasi data**

## Catatan

- Default value: Rp 0 (jika tidak diisi)
- Field bersifat optional - jadwal lama tetap berfungsi
- Biaya bisa diedit saat update jadwal perawatan
- **Data expenses sekarang diambil dari 3 sumber seperti di halaman Laporan**
- **Duplicate detection otomatis** - data yang sudah ada di tabel expenses tidak akan di-backfill lagi
