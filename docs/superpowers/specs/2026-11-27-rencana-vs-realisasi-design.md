# Desain: Rencana vs Realisasi (Simulasi Bisnis sebagai Patokan)

Tanggal: 2026-11-27 · Status: draf, menunggu persetujuan pemilik

## 1. Maksud & alasan

Pemilik ingin Simulasi Bisnis Laundry tidak lagi sekadar kalkulator coba-coba, tetapi
menjadi **patokan (target) resmi** bisnis, lalu **membandingkan hasil nyata dengan
ekspektasi** agar bisnis bisa dijalankan secara profesional.

Saat ini [BusinessCalculatorPage.tsx](../../../src/pages/business/BusinessCalculatorPage.tsx)
hanya menghitung di browser: tidak tersimpan, tidak per cabang, tidak terhubung ke data
nyata, dan HPP berupa persentase tebakan.

Proyek ini adalah **proyek pertama** dari permintaan yang lebih besar. Proyek berikutnya
(terpisah, didesain belakangan) adalah **akuntansi lengkap** (daftar akun, jurnal, buku
besar, neraca, arus kas, penyusutan, tutup buku). Kategori pengeluaran baru di proyek ini
disiapkan agar kelak bisa dipetakan ke daftar akun.

## 2. Sasaran

1. Super Admin dapat menyimpan angka simulasi sebagai **Target** per cabang.
2. Satu target **default** berlaku untuk setiap bulan; bulan tertentu dapat diberi target
   khusus (mis. musim karpet, Lebaran).
3. Halaman **Perbandingan** menampilkan Target vs Nyata vs Selisih per bulan untuk:
   - volume per layanan (Kiloan kg/hari, Satuan pcs/hari, Sepatu pasang/hari, Karpet m²/bulan),
   - omzet per layanan dan total,
   - HPP/bahan, gaji, sewa, marketing & pemeliharaan, biaya lain,
   - laba bersih, margin, dan perkiraan balik modal.
4. Di bulan berjalan, ditampilkan **"on track"**: target pro-rata sampai hari ini
   (target × hari berjalan / jumlah hari bulan itu) dibanding nyata sampai hari ini,
   plus grafik jalur kumulatif harian (target garis lurus vs nyata).
5. Kategori pengeluaran diperbarui (pilihan A) agar biaya nyata dapat dipisah sesuai baris
   simulasi.
6. Kartu ringkas **"Target bulan ini"** di Dashboard (untuk peran yang berhak) yang menautkan
   ke Perbandingan.

## 3. Bukan sasaran

- Akuntansi berpasangan (jurnal, neraca, arus kas, penyusutan) — proyek berikutnya.
- Harga beli per item inventaris / HPP berbasis pemakaian stok — ditunda ke proyek
  akuntansi (lihat 6.4).
- Memigrasikan pengeluaran lama ke kategori baru secara otomatis.
- Target per karyawan atau per kasir.
- Proyeksi multi-tahun / rencana pembukaan cabang baru.

## 4. Anti-sasaran (gagal meski "jalan")

- Angka "Nyata" tidak bisa dicocokkan dengan halaman Laporan untuk periode & cabang yang sama.
  Pendapatan diterima harus identik dengan `get_financial_report`; total pengeluaran
  Laporan = biaya operasional Perbandingan + belanja modal (baris rekonsiliasi, lihat 6.4).
- Admin cabang dapat melihat/mengubah target atau angka cabang lain.
- Simulasi lama (coba-coba tanpa menyimpan) jadi hilang atau lebih repot dipakai.
- Pengeluaran berkategori lama "hilang" dari perbandingan (harus tetap terhitung, minimal
  di baris "Biaya lain").

## 5. Batasan

- Stack: React + TypeScript + Vite + Tailwind + Supabase (Postgres, RLS). Ikuti pola yang ada.
- Perhitungan "Nyata" dilakukan di database via RPC `SECURITY INVOKER` (RLS tetap berlaku),
  meniru pola `get_financial_report` di
  [20261206000000_laporan_keuangan.sql](../../../supabase/migrations/20261206000000_laporan_keuangan.sql),
  zona waktu default `Asia/Jakarta`.
- Perubahan skema lewat migrasi baru di `supabase/migrations/` **dan** disalin ke
  `supabase/setup/0.complete_setup.sql` (konvensi repo). Migrasi harus aman dijalankan ulang.
- Hak akses memakai sistem permission yang ada (`PermissionRoute`, mis. `business.hub`).
- Antarmuka berbahasa Indonesia, responsif/mobile, mendukung mode gelap seperti halaman lain.
- Transaksi tidak memakai diskon/pajak (sudah dihapus, Nov 2026).
- Pemilik menjalankan beberapa sesi Claude paralel; jangan membatalkan perubahan orang lain.
  Claude tidak melakukan commit/push — pemilik yang melakukannya.

## 6. Keputusan yang sudah diambil

### 6.1 Pendekatan (dipilih pemilik: opsi 1)

| Opsi | Ringkas | Untung | Rugi |
|---|---|---|---|
| **1. Simulasi jadi pusat Rencana vs Realisasi** (dipilih) | Halaman Simulasi punya tab **Rencana** & **Perbandingan**; angka nyata dari RPC baru | Semua di satu tempat; angka konsisten dengan Laporan; RLS tetap berlaku | Perlu tabel target + pembaruan kategori |
| 2. Perbandingan di halaman Laporan | Kolom Target/Selisih di ReportsPage | Pemilik sudah biasa ke Laporan | ReportsPage sudah ±1.300 baris; rincian volume per layanan tidak cocok |
| 3. Hitung di browser | Tanpa RPC | Cepat dibuat | Angka bisa beda dari Laporan; lambat bila nota banyak |

### 6.2 Kategori pengeluaran (dipilih pemilik: A)

Tambah kategori yang lebih rinci dan jadikan **satu daftar tunggal** (sekarang tidak
konsisten: form memakai `Operasional, Listrik, Air, Gaji, Perlengkapan, Lainnya`,
filter memakai `Aset / Inventaris, Operasional, Pemeliharaan, Gaji, Lainnya`).

Daftar baru (usulan Claude) dan pemetaannya ke baris simulasi:

| Kategori pengeluaran | Baris simulasi |
|---|---|
| Bahan Baku (deterjen, pewangi, plastik, hanger) | HPP / Bahan |
| Perlengkapan *(lama)* | HPP / Bahan |
| Gaji | Gaji |
| Sewa Tempat | Sewa |
| Listrik | Utilitas |
| Air | Utilitas |
| Marketing & Promosi | Marketing & Pemeliharaan |
| Pemeliharaan | Marketing & Pemeliharaan |
| Operasional *(lama; Wi-Fi, dll.)* | Biaya lain |
| Lainnya | Biaya lain |
| Aset / Inventaris | **tidak** masuk biaya bulanan (belanja modal → dibandingkan dengan Investasi) |

Konsekuensi: simulasi mendapat baris baru **Utilitas (Listrik & Air)** dan **Biaya lain**,
dan baris "Marketing & Maintenance" tetap. Kategori lama tetap valid (data lama tidak diubah).
Kategori disimpan di satu konstanta bersama di frontend; kolom `expenses.category` tetap
`text`. Template pengeluaran bulanan & gaji otomatis tetap memakai nama kategori yang sama.

### 6.3 Peran

- **Super Admin**: membuat/mengubah target semua cabang; melihat perbandingan per cabang
  dan gabungan semua cabang (target gabungan = jumlah target cabang).
- **Admin**: hanya melihat perbandingan cabangnya sendiri; tidak dapat mengubah target.
- **Kasir/peran lain**: tidak melihat fitur ini (mengikuti permission `business.hub` yang ada;
  bila perlu, tambahkan permission baru `business.targets.manage` untuk menyimpan target).

### 6.4 Sumber angka "Nyata" (keputusan Claude, bisa dikoreksi)

| Baris | Sumber |
|---|---|
| Volume per layanan | `transactions.items` (jsonb) → `quantity` dikelompokkan per `services.category` (Kiloan/Satuan/Sepatu/Karpet), berdasarkan tanggal nota dibuat; nota batal tidak dihitung |
| Omzet per layanan | jumlah `subtotal` item per kategori layanan (nilai transaksi, basis tanggal nota) |
| Pendapatan diterima (total) | `transaction_payments` (basis tanggal bayar) — sama dengan Laporan |
| HPP / Bahan | pengeluaran kategori Bahan Baku + Perlengkapan (basis kas). HPP berbasis pemakaian stok ditunda karena `inventory_items` belum punya harga beli |
| Gaji | pengeluaran kategori Gaji (termasuk gaji harian otomatis) |
| Sewa, Utilitas, Marketing & Pemeliharaan, Biaya lain | pengeluaran sesuai tabel 6.2, memakai `report_expense_lines()` agar perawatan aset ikut terhitung sama seperti Laporan |
| Laba operasional | pendapatan diterima − biaya operasional (semua baris biaya di atas, **tanpa** belanja modal). Dibandingkan dengan "Laba bersih" target |
| Belanja modal (rekonsiliasi) | pengeluaran kategori Aset / Inventaris + baris "Pembelian Aset" dari `report_expense_lines()`. Ditampilkan sebagai baris informasi di bawah laba, dengan catatan "Laba bersih di Laporan = laba operasional − belanja modal" sehingga angkanya bisa dicocokkan dengan Laporan |
| Pemeliharaan Aset | baris "Pemeliharaan Aset" dari `report_expense_lines()` → Marketing & Pemeliharaan (biaya operasional) |
| Investasi nyata | akumulasi belanja modal sejak `start_date` target; dibandingkan dengan `investment` target |
| Balik modal | investasi target ÷ laba operasional nyata bulan itu (∞ bila ≤ 0); juga tampilkan akumulasi laba operasional sejak `start_date` vs investasi target (progres %) |

**Alasan memisahkan belanja modal** (keputusan Claude): simulasi memperlakukan investasi
terpisah dari biaya bulanan. Kalau pembelian mesin dikurangkan dari laba bulan itu, bulan
tersebut terlihat rugi besar padahal operasionalnya sehat. Laporan tetap memakai basis kas
seperti sekarang; baris rekonsiliasi menjembatani keduanya.

**Volume per layanan** (keputusan Claude): omzet dikelompokkan per `services.category`
(sama dengan Laporan). Volume Karpet m² hanya menghitung item kategori Karpet yang
satuannya m²/meter; item Karpet per pcs (Keset, Sajadah) ikut omzet Karpet, tetapi tidak
ikut volume m². Volume Kiloan = item satuan kg; Satuan dan Sepatu = jumlah `quantity`.

**Per hari** (keputusan Claude): "per hari" = total volume ÷ **hari kalender** dalam periode
(bulan penuh = jumlah hari bulan itu; bulan berjalan = hari yang sudah lewat termasuk hari
ini). Omzet target bulanan memakai jumlah hari bulan itu yang sebenarnya, bukan ×30 tetap.

**Pro-rata bulan berjalan** (keputusan Claude): volume, omzet, pendapatan, dan HPP
dibandingkan dengan target pro-rata harian. Biaya tetap (gaji, sewa, utilitas, marketing &
pemeliharaan, biaya lain) dibandingkan dengan target **sebulan penuh** dan berstatus
"berjalan" (bukan ⚠) sampai bulan selesai, karena biaya ini sering dibayar sekaligus.
Laba bulan berjalan ditampilkan apa adanya dengan label "sementara".

Halaman Perbandingan harus menuliskan dengan jelas basis tiap angka (nota vs uang
diterima) agar tidak membingungkan.

### 6.5 Model data (usulan)

- Tabel baru `business_targets`:
  - `id`, `store_id` (FK stores, wajib), `period` (`date` hari pertama bulan, **NULL = default**),
  - `investment`, dan per layanan: `kiloan_kg_per_day`, `kiloan_price`, `satuan_pcs_per_day`,
    `satuan_price`, `sepatu_pairs_per_day`, `sepatu_price`, `karpet_m2_per_month`, `karpet_price`,
  - biaya bulanan: `cost_salary`, `cost_rent`, `cost_utilities`, `cost_marketing`, `cost_other`,
  - persen HPP per layanan (`hpp_kiloan_pct`, dst.),
  - `start_date` (awal operasi/target, untuk akumulasi balik modal), `notes`,
    `updated_at`, `updated_by`.
  - Unik per (`store_id`, `period`) dengan NULLS NOT DISTINCT.
  - RLS: SELECT untuk Super Admin (semua) & Admin (cabangnya); INSERT/UPDATE/DELETE hanya
    Super Admin.
- Target efektif bulan X = baris `period = X` bila ada, selain itu baris default.
- RPC baru `get_target_vs_actual(p_store_id uuid, p_month date, p_tz text default 'Asia/Jakarta')`
  → jsonb berisi target efektif, angka nyata (bulan penuh & sampai hari ini), dan seri
  harian kumulatif omzet & pendapatan. `p_store_id NULL` = gabungan (hanya Super Admin).

### 6.6 Antarmuka

- `/business?tab=kalkulator` menjadi halaman dengan dua sub-tab:
  - **Rencana**: kalkulator yang sekarang (tetap bisa dipakai coba-coba). Untuk Super Admin
    ada pemilih cabang + pemilih "Default / bulan tertentu", tombol **Muat target tersimpan**
    dan **Simpan sebagai target**. Ada indikator bila isian berbeda dari target tersimpan.
  - **Perbandingan**: pemilih bulan (default bulan berjalan) dan cabang (Super Admin: termasuk
    "Semua cabang"); tabel Target | Nyata | Selisih | Status (✓ / ⚠) seperti sketsa di bawah;
    di bulan berjalan tambah kolom "Target s.d. hari ini"; grafik kumulatif harian.
- Dashboard: kartu "Target bulan ini" (omzet & laba: nyata vs target pro-rata) bila cabang
  punya target; menaut ke tab Perbandingan.
- Kosong: bila belum ada target, tampilkan ajakan "Atur target" (Super Admin) atau
  "Target belum diatur oleh pemilik" (Admin).

```
Bulan: November 2026 · Cabang A           Target     Nyata      Selisih
Kiloan (kg/hari)                              80        71       -11% ⚠
Omzet total                              29,4 jt   26,1 jt    -3,3 jt ⚠
HPP / bahan                               5,9 jt    5,2 jt    +0,7 jt ✓
Gaji                                      6,0 jt    6,4 jt    -0,4 jt ⚠
Laba bersih                              14,0 jt   10,9 jt    -3,1 jt ⚠
Balik modal                              11,4 bln  14,7 bln
```

Status: pendapatan/volume/laba ✓ bila nyata ≥ target; biaya ✓ bila nyata ≤ target.

## 7. Diserahkan ke pembangun

- Nama permission baru dan penempatannya di sistem permission yang ada.
- Cara menangani item nota yang layanannya sudah dihapus/berubah kategori (usulan: pakai
  `services.category` saat ini, fallback "Lainnya" yang hanya masuk omzet total).
- Cara mengenali satuan m² dari `unit` item (variasi penulisan "m2", "m²", "meter").
- Toleransi status (mis. ⚠ hanya bila selisih > 5%) — boleh ditetapkan sendiri.
- Pustaka grafik: pakai yang sudah dipakai ReportsPage.
- Tes: RPC diuji dengan data contoh; komponen diuji dengan Vitest seperti tes yang ada.
- Pembaruan halaman Bantuan (`src/config/helpTopics.ts`) dan README fitur.
