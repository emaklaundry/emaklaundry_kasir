# Desain: Restok ↔ Pengeluaran terhubung & HPP dari pemakaian stok

Tanggal: 2026-11-28 · Status: draf, menunggu persetujuan pemilik
Melanjutkan: [2026-11-27-rencana-vs-realisasi-design.md](2026-11-27-rencana-vs-realisasi-design.md)

## 1. Maksud & alasan

Di tab Perbandingan, HPP nyata saat ini diambil dari **pembelian** bahan (pengeluaran
kategori Bahan Baku/Perlengkapan). Akibatnya, bulan saat pemilik belanja stok banyak terlihat
boros, padahal bahan itu baru terpakai di bulan-bulan berikutnya. Selain itu, restok stok dan
pengeluaran dicatat terpisah: bisa tercatat dua kali atau terlewat.

Pemilik ingin **restok dan pengeluaran saling terhubung** (dipilih: pendekatan A), dan HPP
dihitung dari **bahan yang benar-benar terpakai**. Ini juga fondasi untuk proyek akuntansi
(nilai persediaan).

## 2. Sasaran

1. Setiap item inventaris punya **harga beli rata-rata** (rata-rata tertimbang, per satuan item).
2. **Restok = pembelian**: satu isian menambah stok **dan** membuat pengeluaran "Bahan Baku"
   yang tertaut, dalam satu transaksi database.
3. **Jalan pintas di form Pengeluaran**: bila kategori "Bahan Baku", pengguna bisa memilih item
   + jumlah → stok otomatis bertambah (fungsi database yang sama).
4. Mengubah atau menghapus pembelian yang tertaut selalu mengubah **kedua sisi**.
5. **HPP nyata** di Perbandingan = nilai bahan terpakai (potong stok otomatis per nota ×
   harga rata-rata saat itu) + susut stok (opname/penyesuaian) + pembelian bahan yang tidak
   masuk stok.
6. Pembelian stok **tidak** dihitung sebagai biaya bulan itu; ditampilkan sebagai baris info
   "Pembelian stok" dengan catatan rekonsiliasi ke Laporan.
7. Halaman Inventaris menampilkan harga beli rata-rata dan **nilai stok** per item + total.

## 3. Bukan sasaran

- Jurnal/neraca (proyek akuntansi).
- Metode FIFO/LIFO, banyak harga per batch, atau pemasok/utang pemasok.
- Mengubah halaman Laporan: Laporan tetap basis kas (pengeluaran apa adanya).
- Menghitung ulang HPP bulan lalu dengan harga yang baru diisi (lihat 6.5).

## 4. Anti-sasaran

- Pembelian yang sama tercatat dua kali (sebagai stok **dan** sebagai biaya HPP di bulan yang sama).
- Stok bertambah tanpa pengeluaran, atau pengeluaran tanpa stok, karena proses terhenti di tengah.
- Pengeluaran tertaut diedit/dihapus langsung sehingga stok dan harga rata-rata tidak sinkron.
- Item tanpa harga beli membuat HPP diam-diam 0 tanpa peringatan.
- Angka Perbandingan tidak bisa dicocokkan dengan Laporan.

## 5. Batasan

Sama dengan proyek sebelumnya: React + TS + Supabase (RLS); migrasi baru yang aman diulang,
dicerminkan di `supabase/setup/0.complete_setup.sql`; fungsi `SET search_path`; UI berbahasa
Indonesia, mode gelap, mobile; uji SQL hanya di database percobaan lokal; tidak ada commit
oleh Claude; perubahan database produksi hanya dengan izin pemilik.

Kondisi sekarang yang relevan:
- `inventory_items` (stok numeric(12,3), tanpa harga), `inventory_movements` (kind: `awal`,
  `restok`, `penyesuaian`, `opname`, `transaksi`, `koreksi_transaksi`; quantity +/−).
- Semua perubahan stok lewat `apply_inventory_delta(...)`; restok manual lewat
  `adjust_inventory_stock(p_item_id, 'tambah', …)` dari `StockAdjustModal`.
- Potong stok otomatis per nota membuat mutasi `transaksi` / `koreksi_transaksi`.
- `expenses` punya kolom tautan lain (`attendanceId`, `recurringTemplateId`) — pola yang sama
  dipakai untuk tautan baru.

## 6. Keputusan

### 6.1 Pendekatan (dipilih pemilik: A)

| Opsi | Ringkas | Untung | Rugi |
|---|---|---|---|
| **A. Restok sebagai pintu utama + jalan pintas dari Pengeluaran** (dipilih) | Form restok meminta total harga → pengeluaran otomatis; form pengeluaran "Bahan Baku" bisa memilih item → stok otomatis | Karyawan mencatat dari tempat yang biasa; satu fungsi DB untuk keduanya | Dua form diubah |
| B. Hanya lewat restok | Pengeluaran Bahan Baku diarahkan ke Inventaris | Sederhana | Membingungkan; pembelian di luar daftar inventaris repot |
| C. Hanya lewat pengeluaran | Restok manual hanya untuk koreksi | — | Stok bergantung pada rincian pengeluaran; rawan lupa |

### 6.2 Model data (usulan Claude)

- `inventory_items.avg_cost numeric(14,4) NULL CHECK (avg_cost >= 0)` — harga beli rata-rata
  per satuan item; NULL = "harga belum diisi".
- `inventory_movements.unit_cost numeric(14,4) NULL` — salinan harga rata-rata **saat mutasi
  terjadi** (untuk restok: harga beli per satuan item pada pembelian itu). Diisi oleh
  `apply_inventory_delta` untuk semua jenis mutasi. Dengan salinan ini, HPP bulan lalu tidak
  berubah ketika harga rata-rata berubah.
- `expenses."inventoryMovementId" uuid NULL UNIQUE REFERENCES inventory_movements(id)` — tautan
  pengeluaran ↔ mutasi restok.

### 6.3 Fungsi database (usulan Claude)

- `record_stock_purchase(p_item_id uuid, p_quantity numeric, p_total_cost numeric, p_date date,
  p_note text, p_with_expense boolean DEFAULT true) RETURNS jsonb` — satu transaksi:
  1. kunci item; harga rata-rata baru = (stok × avg_lama + total) ÷ (stok + qty) bila stok > 0
     dan avg_lama tidak NULL, selain itu total ÷ qty; stok negatif dianggap 0 dalam rumus;
  2. mutasi `restok` dengan `unit_cost = total ÷ qty`;
  3. bila `p_with_expense`: pengeluaran kategori **Bahan Baku**, deskripsi
     `Restok: <nama item> (<qty> <satuan>)`, tanggal `p_date`, cabang item, tertaut ke mutasi.
  `p_with_expense = false` dipakai untuk stok masuk tanpa biaya (hadiah/sisa): mutasi `restok`
  dengan `unit_cost = avg_lama` dan avg tidak berubah. `p_total_cost = 0` dengan
  `p_with_expense = true` ditolak.
- `update_stock_purchase(p_expense_id uuid, p_quantity numeric, p_total_cost numeric, p_date date,
  p_note text)` dan `cancel_stock_purchase(p_expense_id uuid)` — membalik pembelian lama (mutasi
  `penyesuaian` negatif + koreksi harga rata-rata dengan rumus kebalikan, dijaga agar tidak
  negatif/tak terdefinisi: bila stok tersisa ≤ 0 setelah dibalik, avg dipertahankan), lalu
  (untuk update) mencatat ulang. Ditolak bila stok saat ini kurang dari jumlah yang dibatalkan,
  dengan pesan yang menjelaskan bahwa sebagian sudah terpakai dan sarankan opname.
- Trigger pada `expenses`: UPDATE/DELETE langsung pada baris yang punya `inventoryMovementId`
  ditolak dengan pesan "Pengeluaran ini terhubung ke restok <item>. Ubah lewat Inventaris
  atau tombol Ubah pembelian." Fungsi-fungsi di atas melewatinya dengan setting lokal transaksi.
- `set_inventory_avg_cost(p_item_id uuid, p_avg_cost numeric)` — Admin/Super Admin mengisi atau
  mengoreksi harga rata-rata secara manual (mis. stok lama); dicatat di audit log.
- Hak akses: `record_stock_purchase` mengikuti siapa yang boleh restok **dan** boleh mencatat
  pengeluaran di cabang itu (`can_manage_inventory_item` + aturan INSERT expenses yang ada).
  Ubah/batal pembelian dan `set_inventory_avg_cost`: Admin cabang & Super Admin.

### 6.4 HPP & Perbandingan (mengubah `get_target_vs_actual`)

- `costs.hpp` = 
  (a) nilai **pemakaian**: Σ(−quantity × unit_cost) untuk mutasi `transaksi` dan
      `koreksi_transaksi` dalam periode (koreksi positif mengurangi);
  (b) + **susut stok**: Σ(−quantity × unit_cost) untuk mutasi `opname` dan `penyesuaian` yang
      **tidak** berasal dari pembatalan pembelian (barang hilang/rusak menambah HPP, temuan
      stok mengurangi);
  (c) + pengeluaran kategori Bahan Baku/Perlengkapan yang **tidak** tertaut ke mutasi
      (pembelian bahan di luar inventaris).
- Pengeluaran yang tertaut (pembelian stok) dikeluarkan dari biaya → kunci baru
  `actual.stockPurchases` (baris info "Pembelian stok", status none).
- Kunci baru `actual.uncostedUsage` = jumlah mutasi pemakaian dalam periode yang `unit_cost`-nya
  NULL → peringatan di Perbandingan: "N pemakaian bahan belum punya harga beli — HPP lebih
  rendah dari sebenarnya. Isi harga di Inventaris."
- Catatan rekonsiliasi berubah menjadi: "Laba bersih di Laporan = laba operasional + nilai
  bahan terpakai & susut − pembelian stok − belanja modal." Tes SQL harus membuktikan
  persamaan ini terhadap `get_financial_report`.
- Mutasi `awal` dan `restok` tidak masuk HPP.

### 6.5 Stok lama & harga yang belum diisi

- Item tanpa harga ditandai "Harga belum diisi" di Inventaris; form item mendapat isian
  "Harga beli per <satuan>" (memanggil `set_inventory_avg_cost`).
- Mutasi yang terjadi sebelum harga diisi tetap `unit_cost` NULL (tidak dihitung ulang) —
  muncul sebagai `uncostedUsage` di bulan tersebut.

### 6.6 Antarmuka

- **StockAdjustModal, mode Restok**: isian Jumlah, **Total harga beli (Rp)**, Tanggal beli
  (default hari ini), kotak centang "Catat sebagai pengeluaran" (default aktif), Catatan.
  Menampilkan pratinjau "Harga rata-rata baru: Rp…/<satuan>". Mode Kurangi/Set tetap seperti
  sekarang (penyesuaian).
- **ExpenseFormModal**: bila kategori "Bahan Baku", muncul pilihan "Tambah ke stok" → pilih item
  (cabang yang sama) + jumlah; menyimpan lewat `record_stock_purchase`. Pengeluaran tertaut
  menampilkan lencana "Restok <item>" dan tombol **Ubah pembelian** / **Batalkan pembelian**
  (bukan Edit/Hapus biasa).
- **InventoryPage**: kolom Harga rata-rata dan Nilai stok; ringkasan "Total nilai stok"; lencana
  "Harga belum diisi". **StockHistoryModal**: tampilkan harga per mutasi bila ada.
- **ComparisonTab**: baris "Pembelian stok" (info), peringatan `uncostedUsage`, catatan
  rekonsiliasi baru. Halaman Bantuan diperbarui.

### 6.7 Keputusan tambahan (hasil pemeriksaan pembangun; keputusan Claude, bisa dikoreksi)

1. **Peralihan metode HPP per cabang.** Disimpan `inventory_store_settings.costing_start date`
   (tabel pengaturan inventaris per cabang yang sudah ada), diisi otomatis = tanggal pertama
   kali sebuah item cabang itu mendapat harga beli (lewat restok berharga atau
   `set_inventory_avg_cost`). Bulan **sebelum** bulan `costing_start` memakai cara lama
   (HPP = pengeluaran Bahan Baku/Perlengkapan, tanpa baris Pembelian stok); bulan
   `costing_start` dan sesudahnya memakai cara baru. Tujuannya agar riwayat bulan lalu tidak
   tiba-tiba berubah drastis. `get_target_vs_actual` mengembalikan `hppMethod: 'pembelian' |
   'pemakaian'` dan Perbandingan menuliskannya ("HPP dihitung dari pembelian bahan" /
   "dari bahan terpakai"). Untuk gabungan semua cabang, tiap cabang dihitung dengan metodenya
   sendiri lalu dijumlah.
2. **Koreksi nota** (`koreksi_transaksi`) memakai `unit_cost` rata-rata tertimbang dari mutasi
   asli nota itu (bukan harga rata-rata saat ini), agar edit/hapus nota menetralkan HPP
   dengan tepat. Bila mutasi asli tidak punya harga, koreksi juga NULL.
3. **Penautan mutasi.** Pembangun boleh menambah setting lokal `app.inv_unit_cost` /
   `app.inv_kind` dan mengubah trigger `log_inventory_movement` agar menyimpan `unit_cost`
   dan mengembalikan id mutasi (mis. lewat fungsi varian baru), selama tanda tangan dan
   perilaku pemanggil lama tetap sama.
4. **Bulan sebuah mutasi** = `created_at` di zona waktu `p_tz` (sama dengan nota). Restok
   bertanggal mundur: pengeluaran memakai tanggal beli, mutasi memakai waktu pencatatan, dan
   harga rata-rata berubah saat dicatat. Ini diterima.
5. **Jenis mutasi baru `batal_beli`** (CHECK constraint diperluas) untuk pembalikan pembelian,
   agar tidak tercampur dengan susut stok. `batal_beli` tidak masuk HPP. Persamaan
   rekonsiliasi dijamin hanya ketika `uncostedUsage = 0`; tes SQL menguji kondisi itu.
6. **Hak akses.** Siapa pun yang boleh restok sekaligus mencatat pengeluaran di cabang itu
   (termasuk Kasir) boleh membuat pembelian. Ubah/batal pembelian hanya Admin cabang & Super
   Admin; trigger menolak edit langsung untuk semua peran. Audit log dicatat dari aplikasi
   untuk buat/ubah/batal pembelian dan pengisian harga manual.
7. **Data lama** tidak ditautkan ulang. Restok tanpa harga tetap bisa: matikan "Catat sebagai
   pengeluaran" (`p_with_expense = false`). Bila centang aktif, total harga wajib > 0.
8. **Satu satuan per item.** Jumlah restok dan harga rata-rata memakai satuan item yang sama
   (tidak ada konversi dus → ml). "Harga beli per satuan" di 6.2 berarti per satuan item.

## 7. Diserahkan ke pembangun

- Pembulatan (simpan presisi 4 desimal, tampilkan rupiah bulat).
- Cara melewatkan trigger penolakan edit (setting lokal transaksi, seperti pola `app.inv_*`).
- Cara menyalin `unit_cost` di `apply_inventory_delta` tanpa mengubah tanda tangan pemanggil
  lama (parameter opsional baru).
- Tes: skrip psql di `supabase/scripts/` untuk rumus rata-rata, pembatalan, HPP & rekonsiliasi;
  tes Vitest untuk form.
