# Restok ↔ Pengeluaran & HPP dari Pemakaian — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restok berharga dan pengeluaran Bahan Baku menjadi satu catatan tertaut, item inventaris punya harga beli rata-rata, dan HPP di Perbandingan dihitung dari bahan yang terpakai.

**Architecture:** Semua logika uang–stok di database: kolom harga (`inventory_items.avg_cost`, `inventory_movements.unit_cost`), tautan `expenses."inventoryMovementId"`, fungsi `record_stock_purchase` / `update_stock_purchase` / `cancel_stock_purchase` / `set_inventory_avg_cost`, trigger penjaga, dan `get_target_vs_actual` yang diperbarui. Frontend hanya memanggil RPC melalui satu modul klien `src/utils/stockPurchases.ts`.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind, @tanstack/react-query, Supabase (Postgres + RLS), Vitest + Testing Library, skrip psql.

**Spec:** [docs/superpowers/specs/2026-11-28-restok-pengeluaran-hpp-design.md](../specs/2026-11-28-restok-pengeluaran-hpp-design.md)

## Global Constraints

- **Claude tidak melakukan commit/push.** Setiap "Checkpoint" = jalankan tes lalu berhenti; pemilik yang commit.
- Sesi Claude lain berjalan paralel: sentuh hanya file yang disebut task; jangan membatalkan perubahan orang lain (mis. `src/pages/Dashboard.tsx`, `src/config/navigation.ts`, migrasi SOP/BMKG).
- Migrasi baru: `supabase/migrations/20261218000000_restok_pengeluaran_hpp.sql` (cek dulu nomor belum dipakai; bila dipakai, naikkan dan catat), aman diulang, dan isinya dicerminkan di `supabase/setup/0.complete_setup.sql`: fungsi yang diganti (`apply_inventory_delta`, `log_inventory_movement`, `revert_inventory_for_transaction`, `get_target_vs_actual`, constraint `kind`) diperbarui **di tempat definisi terakhirnya**; objek baru ditambahkan sebagai blok baru sebelum `END OF SETUP`.
- Uji SQL hanya di container Docker sementara (image lokal `public.ecr.aws/supabase/postgres:17.6.1.042`; error `storage.buckets` saat memuat setup sudah diketahui). **Tidak pernah** ke project Supabase remote.
- Fungsi SQL: `SET search_path` sesuai pola file; zona waktu `'Asia/Jakarta'` default; bulan mutasi = `created_at AT TIME ZONE p_tz`.
- Presisi: `avg_cost`/`unit_cost` `numeric(14,4)`; tampilan rupiah bulat id-ID.
- Teks UI Indonesia, mode gelap, mobile, label aksesibel.
- Tanda tangan & perilaku pemanggil lama `apply_inventory_delta(uuid, numeric, text, uuid, uuid, text)` dan `adjust_inventory_stock` tidak berubah.
- Kategori pengeluaran pembelian stok: **`Bahan Baku`**; deskripsi `Restok: <nama item> (<qty> <satuan>)`.
- Pesan penolakan edit langsung: `Pengeluaran ini terhubung ke restok <item>. Ubah lewat Inventaris atau tombol Ubah pembelian.`
- Peringatan HPP tanpa harga: `N pemakaian bahan belum punya harga beli — HPP lebih rendah dari sebenarnya. Isi harga di Inventaris.`
- Catatan rekonsiliasi baru: `Laba bersih di Laporan = laba operasional + nilai bahan terpakai & susut − pembelian stok − belanja modal.`

## Review Focus

1. **Membatalkan pembelian yang sebagian sudah terpakai** (stok sekarang < jumlah pembelian): ditolak dengan pesan jelas, stok & pengeluaran tidak berubah. → tes SQL Task 1.
2. **Item tanpa harga lalu dipakai, kemudian harga diisi**: HPP bulan itu tidak berubah diam-diam; `uncostedUsage` > 0 dan peringatan tampil. → tes SQL Task 2, tes UI Task 5.
3. **Nota diedit/dihapus setelah harga rata-rata berubah**: koreksi memakai harga mutasi asli, HPP netral 0. → tes SQL Task 1.
4. **Stok negatif (dipotong melebihi stok) lalu restok berharga**: harga rata-rata = harga pembelian baru, tidak negatif/tak terhingga. → tes SQL Task 1.
5. **Super Admin "Semua cabang" dengan cabang yang metode HPP-nya berbeda**: tiap cabang dihitung dengan metodenya lalu dijumlah; `hppMethod` = `campuran` bila berbeda. → tes SQL Task 2.

---

### Task 1: Database — harga, tautan, fungsi pembelian, penjaga

**Files:**
- Create: `supabase/migrations/20261218000000_restok_pengeluaran_hpp.sql`
- Create: `supabase/scripts/test_restok_pengeluaran_hpp.sql`
- Modify: `supabase/setup/0.complete_setup.sql`

**Interfaces — Produces:**
- `inventory_items.avg_cost numeric(14,4) NULL CHECK (avg_cost >= 0)`.
- `inventory_movements.unit_cost numeric(14,4) NULL`; CHECK `kind` ditambah `'batal_beli'`.
- `expenses."inventoryMovementId" uuid NULL UNIQUE REFERENCES inventory_movements(id) ON DELETE RESTRICT`.
- `inventory_store_settings.costing_start date NULL` — diisi sekali (bila NULL) dengan tanggal hari ini (zona Asia/Jakarta) saat item cabang itu pertama kali mendapat `avg_cost` (restok berharga atau `set_inventory_avg_cost`); baris pengaturan dibuat bila belum ada.
- Setting lokal baru: `app.inv_unit_cost` (dibaca trigger; bila kosong trigger memakai `avg_cost` item **sebelum** perubahan) dan `app.inv_last_movement` (trigger menuliskan id mutasi yang baru dibuat). `apply_inventory_delta` mendapat parameter opsional ketujuh `p_unit_cost numeric DEFAULT NULL` (overload lama tetap ada & memanggil versi baru) — pemanggil lama tidak berubah.
- `revert_inventory_for_transaction`: mutasi `koreksi_transaksi` per item memakai `unit_cost` = rata-rata tertimbang |quantity| dari mutasi `transaksi`/`koreksi_transaksi` nota itu untuk item itu yang `unit_cost`-nya tidak NULL; NULL bila semuanya NULL.
- `public.record_stock_purchase(p_item_id uuid, p_quantity numeric, p_total_cost numeric, p_date date, p_note text DEFAULT NULL, p_with_expense boolean DEFAULT true) RETURNS jsonb` → `{"movementId","expenseId"|null,"stock","avgCost"}`. Aturan rata-rata: `base = GREATEST(stock,0)`; `avg_baru = (base*avg_lama + total)/(base+qty)` bila `avg_lama` tidak NULL dan `base > 0`, selain itu `total/qty`. `p_with_expense = false`: `unit_cost = avg_lama`, avg tetap, `p_total_cost` diabaikan. `p_with_expense = true` dan `p_total_cost <= 0` → error `Total harga beli harus lebih dari 0`. `p_quantity <= 0` → error. Hak: `can_manage_inventory_item(p_item_id)` tidak NULL **dan** pemanggil lolos policy INSERT expenses cabang itu (jalankan INSERT sebagai invoker, atau cek peran yang sama dengan policy).
- `public.cancel_stock_purchase(p_expense_id uuid) RETURNS jsonb` dan `public.update_stock_purchase(p_expense_id uuid, p_quantity numeric, p_total_cost numeric, p_date date, p_note text DEFAULT NULL) RETURNS jsonb` — hanya Admin cabang itu / Super Admin. Batal: bila `stock < qty_asli` → error `Sebagian stok dari pembelian ini sudah terpakai (sisa <stock> <satuan>). Lakukan stock opname untuk mengoreksi.`; selain itu mutasi `batal_beli` (−qty, `unit_cost` = harga beli asli), `avg_baru = (stock*avg − total_asli)/(stock − qty)` bila `stock − qty > 0` dan hasil ≥ 0, selain itu avg dipertahankan; pengeluaran dihapus. Update = batal + catat ulang dalam satu transaksi, pengeluaran lama diganti yang baru.
- `public.set_inventory_avg_cost(p_item_id uuid, p_avg_cost numeric) RETURNS numeric` — Admin/Super Admin cabang item; `p_avg_cost >= 0`.
- Trigger `expenses_guard_stock_purchase` BEFORE UPDATE OR DELETE pada `expenses`: bila `OLD."inventoryMovementId" IS NOT NULL` dan setting `app.stock_purchase_bypass` ≠ `'on'` → RAISE dengan pesan pada Global Constraints.
- `REVOKE ALL … FROM PUBLIC, anon` + `GRANT EXECUTE … TO authenticated` untuk 4 fungsi RPC baru.

- [ ] **Step 1: Tulis `supabase/scripts/test_restok_pengeluaran_hpp.sql`** (`BEGIN … ROLLBACK`, header "psql-only, DB percobaan", pakai pola klaim JWT dari `supabase/scripts/test_rencana_vs_realisasi.sql`). ASSERT:
  - stok 2 tanpa harga → `record_stock_purchase(item, 3, 75000, …)` → `avgCost = 25000`, stok 5, satu pengeluaran Bahan Baku 75000 bertaut, mutasi `restok` `unit_cost = 25000`, `costing_start` cabang terisi.
  - stok 2 @20000 + beli 3 total 75000 → `avgCost = 23000`.
  - stok −1 + beli 2 total 50000 → `avgCost = 25000`.
  - `p_with_expense = false` → tidak ada pengeluaran, avg tetap, `unit_cost` = avg lama.
  - `p_total_cost = 0` dengan expense → error.
  - UPDATE/DELETE langsung pengeluaran tertaut → error berisi `terhubung ke restok`.
  - `cancel_stock_purchase` → stok & avg kembali (stok 5 @23000 batal beli 3/75000 → stok 2, avg 20000), mutasi `batal_beli`, pengeluaran hilang; bila stok < qty → error `sudah terpakai` dan tidak ada yang berubah.
  - `update_stock_purchase` ubah total 75000→90000 → satu pengeluaran 90000, avg sesuai.
  - Potong stok per nota (pakai jalur deduct yang ada dengan resep) → mutasi `transaksi` `unit_cost` = avg saat itu; ubah avg (restok baru) lalu batalkan/edit nota → mutasi `koreksi_transaksi` memakai harga asli; Σ(−qty×unit_cost) nota itu = 0.
  - Kasir cabang boleh `record_stock_purchase`, tidak boleh `cancel_stock_purchase`/`set_inventory_avg_cost`; Admin cabang lain ditolak.
  - `adjust_inventory_stock(item,'tambah',1)` masih berfungsi (kompatibilitas).
- [ ] **Step 2: Jalankan pada container** → FAIL (`record_stock_purchase` tidak ada).
- [ ] **Step 3: Tulis migrasi** sesuai Interfaces; cerminkan ke `0.complete_setup.sql`.
- [ ] **Step 4: Terapkan migrasi dua kali, jalankan skrip baru + `supabase/scripts/test_rencana_vs_realisasi.sql`** → keduanya `SEMUA TES LULUS`; hapus container.
- [ ] **Step 5: Checkpoint.**

---

### Task 2: Database — HPP dari pemakaian di `get_target_vs_actual`

**Files:**
- Modify: `supabase/migrations/20261218000000_restok_pengeluaran_hpp.sql` (tambahkan `CREATE OR REPLACE get_target_vs_actual` di akhir), `supabase/setup/0.complete_setup.sql` (definisi terakhir fungsi itu)
- Modify: `supabase/scripts/test_restok_pengeluaran_hpp.sql`, `supabase/scripts/test_rencana_vs_realisasi.sql` (bila asersi HPP lamanya terdampak)

**Interfaces:**
- Consumes: Task 1 (kolom, `costing_start`, kind `batal_beli`).
- Produces (tambahan kunci JSON, kunci lama tetap):
  - `actual.costs.hpp` per cabang: bila bulan < bulan `costing_start` cabang itu (atau `costing_start` NULL) → cara lama (semua pengeluaran yang dipetakan `hpp`). Selain itu → (a) Σ(−quantity×unit_cost) mutasi `transaksi`,`koreksi_transaksi` + (b) Σ(−quantity×unit_cost) mutasi `opname`,`penyesuaian` + (c) pengeluaran `hpp` **tanpa** `"inventoryMovementId"`. `restok`, `awal`, `batal_beli` tidak masuk.
  - `actual.stockPurchases` = Σ pengeluaran tertaut di periode (0 untuk cabang/bulan cara lama). Tidak masuk `costs.total`.
  - `actual.uncostedUsage` = jumlah mutasi (a)/(b) periode berjalan dengan `unit_cost` NULL (hanya cabang/bulan cara baru).
  - `hppMethod`: `'pembelian'` | `'pemakaian'` | `'campuran'` (gabungan cabang berbeda).
  - `sinceStart.operatingProfit` memakai rumus HPP yang sama per bulan.
- [ ] **Step 1: Tambah asersi ke skrip Task 1**: bulan cara baru → `costs.hpp` = pemakaian + susut + Bahan Baku tak tertaut; `stockPurchases` = pengeluaran tertaut; dengan `uncostedUsage = 0`: `get_financial_report(...)->summary->expenses = costs.total − (pemakaian+susut) + stockPurchases + capex`; item dipakai sebelum harga diisi → `uncostedUsage > 0` dan nilai mutasi itu tidak dihitung; bulan sebelum `costing_start` → `hppMethod = 'pembelian'`, angka sama dengan cara lama; dua cabang (satu lama, satu baru) dengan `p_store_id NULL` → `hppMethod = 'campuran'` dan total = jumlah per cabang.
- [ ] **Step 2: Jalankan** → FAIL.
- [ ] **Step 3: Implementasikan** perubahan fungsi; cerminkan ke setup.
- [ ] **Step 4: Jalankan kedua skrip pada container** → `SEMUA TES LULUS`; hapus container.
- [ ] **Step 5: Checkpoint.**

---

### Task 3: Lapisan data frontend

**Files:**
- Create: `src/utils/stockPurchases.ts`, `src/__tests__/utils/stockPurchases.test.ts`
- Modify: `src/types/index.ts` (InventoryItem, Expense, tipe mutasi riwayat stok), tempat normalisasi item/pengeluaran/mutasi yang sudah ada (temukan lewat pemakaian tipe-tipe itu), `src/utils/businessTargets.ts`, `src/utils/businessPlan.ts`, tes mereka

**Interfaces — Produces:**
- `InventoryItem.avgCost: number | null`; `Expense.inventoryMovementId: string | null`; mutasi riwayat `unitCost: number | null`; kind `'batal_beli'` dikenali (label "Batal beli").
- `stockPurchases.ts`:
  - `recordStockPurchase(i: { itemId: string; quantity: number; totalCost: number; date: string /*YYYY-MM-DD*/; note?: string; withExpense?: boolean }): Promise<{ movementId: string; expenseId: string | null; stock: number; avgCost: number | null }>`
  - `updateStockPurchase(i: { expenseId: string; quantity: number; totalCost: number; date: string; note?: string }): Promise<…sama>`
  - `cancelStockPurchase(expenseId: string): Promise<…sama>`
  - `setInventoryAvgCost(itemId: string, avgCost: number): Promise<number>`
  - `previewAvgCost(stock: number, avgCost: number | null, qty: number, total: number): number` — rumus Task 1 (untuk pratinjau di form).
  - Error DB diteruskan sebagai `Error(message)` dengan pesan asli; kode migrasi hilang (`PGRST202`,`PGRST205`,`42883`,`42P01`) → `Error('MIGRATION_MISSING')`.
  - Query key yang wajib di-invalidate setelah berhasil: inventaris, pengeluaran, riwayat stok (pakai key yang sudah dipakai konteks masing-masing), dan `['target-vs-actual']`. Ekspor `invalidateAfterStockPurchase(queryClient)`.
- `TargetVsActual`: `actual.stockPurchases: number`, `actual.uncostedUsage: number`, `hppMethod: 'pembelian' | 'pemakaian' | 'campuran'` (default `'pembelian'` bila kunci tidak ada).
- `buildComparison`: baris baru `stockPurchases` ("Pembelian stok", currency, info, status `none`, setelah `capex`); note baris `capex` diganti teks rekonsiliasi baru (Global Constraints) bila `hppMethod !== 'pembelian'`, selain itu teks lama.
- [ ] **Step 1: Tes** `previewAvgCost` (4 kasus Task 1: 25000, 23000, stok −1→25000, avg NULL); `recordStockPurchase` memanggil RPC `record_stock_purchase` dengan `p_item_id,p_quantity,p_total_cost,p_date,p_note,p_with_expense`; `PGRST202` → `MIGRATION_MISSING`; normalisasi `stockPurchases`/`uncostedUsage`/`hppMethod` (default); baris `stockPurchases` ada dan note rekonsiliasi sesuai metode.
- [ ] **Step 2: Jalankan** → FAIL. **Step 3: Implementasikan.** **Step 4:** `npx vitest run src/__tests__/utils` + type-check → PASS.
- [ ] **Step 5: Checkpoint.**

---

### Task 4: UI Inventaris — restok berharga, harga rata-rata, nilai stok

**Files:**
- Modify: `src/components/StockAdjustModal.tsx`, form item inventaris (`src/components/InventoryFormModal.tsx`), `src/pages/management/InventoryPage.tsx`, `src/components/StockHistoryModal.tsx`
- Test: tes komponen yang sudah ada untuk file tersebut + `src/__tests__/components/StockAdjustModal.test.tsx` (buat bila belum ada)

**Interfaces — Consumes:** Task 3 (`recordStockPurchase`, `setInventoryAvgCost`, `previewAvgCost`, `invalidateAfterStockPurchase`, `InventoryItem.avgCost`, `unitCost`).

Perilaku:
- StockAdjustModal mode **Restok**: Jumlah, **Total harga beli (Rp)**, Tanggal beli (default hari ini), centang **Catat sebagai pengeluaran** (default aktif), Catatan; pratinjau `Harga rata-rata baru: Rp…/<satuan>`; simpan → `recordStockPurchase`. Centang mati → isian harga disembunyikan, `withExpense:false`. Mode Kurangi/Atur tidak berubah. Audit log "Restok berharga".
- Form item: isian `Harga beli per <satuan>` (opsional) → `setInventoryAvgCost` saat disimpan bila berubah (hanya peran dengan akses kelola cabang).
- InventoryPage: kolom **Harga rata-rata** dan **Nilai stok** (`max(stock,0) × avgCost`), ringkasan **Total nilai stok**, lencana **Harga belum diisi**; di mobile tampil di kartu.
- StockHistoryModal: harga per mutasi bila ada; label `batal_beli`.
- [ ] **Step 1: Tes**: restok dengan total 75000 qty 3 memanggil `recordStockPurchase({ itemId, quantity: 3, totalCost: 75000, date: <hari ini>, withExpense: true })` dan menampilkan pratinjau `Rp 25.000`; centang dimatikan → `withExpense:false` tanpa isian harga; total 0 dengan centang aktif → tombol simpan nonaktif; Inventaris menampilkan "Harga belum diisi" untuk `avgCost: null` dan total nilai stok yang benar; mode Kurangi tetap memanggil jalur lama.
- [ ] **Step 2: FAIL → Step 3: implementasi → Step 4: PASS** (`npx vitest run src/__tests__/components src/__tests__/pages`, type-check).
- [ ] **Step 5: Checkpoint.**

---

### Task 5: UI Pengeluaran & Perbandingan & Bantuan

**Files:**
- Modify: `src/components/ExpenseFormModal.tsx`, `src/pages/management/ExpensesPage.tsx`, `src/contexts/ExpenseContext.tsx` (hanya bila perlu meneruskan `inventoryMovementId`), `src/pages/business/ComparisonTab.tsx`, `src/config/helpTopics.ts`
- Test: `src/__tests__/components/ExpenseFormModal.test.tsx`, `src/__tests__/pages/business/ComparisonTab.test.tsx`, tes ExpensesPage bila ada

**Interfaces — Consumes:** Task 3.

Perilaku:
- ExpenseFormModal (tambah baru) dengan kategori **Bahan Baku**: centang **Tambah ke stok** → pilih item (cabang yang sama; daftar dari data inventaris yang sudah ada) + Jumlah; Simpan → `recordStockPurchase({ itemId, quantity, totalCost: amount, date, note: description })` alih-alih `onSave`. Tanpa centang → perilaku lama.
- ExpensesPage: baris dengan `inventoryMovementId` menampilkan lencana **Restok <item>**; tombol Edit/Hapus biasa diganti **Ubah pembelian** (form qty/total/tanggal → `updateStockPurchase`) dan **Batalkan pembelian** (konfirmasi → `cancelStockPurchase`), hanya untuk peran Admin/Super Admin; pesan error DB ditampilkan apa adanya lewat toast. Audit log untuk pembelian dari form pengeluaran, ubah pembelian, dan batal pembelian.
- ComparisonTab: baris "Pembelian stok" otomatis (Task 3); teks metode HPP di atas tabel (`HPP dihitung dari pembelian bahan` / `dari bahan terpakai` / `campuran (berbeda per cabang)`); bila `uncostedUsage > 0` tampilkan peringatan (teks Global Constraints) dengan tautan ke `/inventory` (cek rute halaman Inventaris yang sebenarnya di `src/App.tsx`).
- helpTopics: topik Inventaris & kalkulator menjelaskan restok berharga, harga rata-rata, pembatalan, HPP dari pemakaian, dan baris Pembelian stok.
- [ ] **Step 1: Tes**: Bahan Baku + Tambah ke stok memanggil `recordStockPurchase` (bukan `onSave`); kategori lain tidak menampilkan centang; pengeluaran tertaut menampilkan "Ubah pembelian"/"Batalkan pembelian" untuk Admin dan tidak untuk Kasir; ComparisonTab dengan `uncostedUsage: 3` menampilkan peringatan dan `hppMethod: 'pemakaian'` menampilkan teks metode.
- [ ] **Step 2: FAIL → Step 3: implementasi → Step 4:** `npx vitest run` (penuh), `npm run type-check`, `npm run lint`, prettier pada file yang disentuh → bersih (catat kegagalan milik sesi lain tanpa memperbaikinya).
- [ ] **Step 5: Checkpoint akhir** — ingatkan pemilik: migrasi 20261214, 20261217, 20261218 belum diterapkan ke produksi.
