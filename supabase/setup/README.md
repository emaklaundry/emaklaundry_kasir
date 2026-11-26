# Database & Backend Emak Laundry: Peta Lengkap

Satu halaman untuk melihat **semua** bagian backend: database dan fungsi server (Edge Functions).
`SETUP_GUIDE.md` dan `DEPLOYMENT.md` di folder ini hanya menunjuk ke halaman ini.

**Diperbarui:** 26 November 2026 · **Versi setup:** 3.5.0

---

## 1. Di mana semuanya berada

```
emaklaundry_kasir/
└── supabase/                      ← SEMUA backend di sini; nama & letak folder wajib tetap (dipakai CLI)
    ├── config.toml                ← pengaturan CLI & Edge Functions
    ├── functions/                 ← 5 fungsi server (TypeScript/Deno)
    ├── setup/
    │   ├── 0.complete_setup.sql   ← SELURUH skema database dalam 1 file (setup dari nol)
    │   ├── 1.seed_data_awal.sql   ← cabang, profil pengguna, pengaturan awal (data uji)
    │   ├── 2.jalankan_setelah_deploy.sql ← perubahan live yang masih menunggu deploy (sementara)
    │   └── README.md              ← halaman ini
    ├── seeds/                     ← data contoh: layanan, inventaris, aset, perawatan
    └── backup/                    ← cadangan data asli (xlsx/csv/pdf); file .sql di sini tidak masuk git
```

Supabase CLI hanya dipakai untuk `config.toml` dan `functions/` (deploy Edge Functions).
Folder `migrations/` **tidak dipakai lagi**: skema database dikelola lewat satu file
`0.complete_setup.sql`, dan perubahan ke database live dijalankan manual di SQL Editor.

Folder `supabase/` harus tetap di root proyek dengan nama itu: Supabase CLI hanya mencarinya di sana.

---

## 2. Isi `0.complete_setup.sql`

| Section | Isi |
|---|---|
| 1 | DROP TABLES (dikomentari, untuk reset total) |
| 2 | Tabel inti: stores, profiles, customers, services, transactions, expenses, dll. + RLS |
| 3 | RPC: `get_public_services`, `update_transaction_progress`, `bulk_update_order_status` |
| 4 | Keamanan & performa: validasi, index, RLS tambahan |
| 5 | Trigger otomatis (`updatedAt`, dll.) |
| 6 | HRM Lite: employees, attendance, advances, payroll + RLS per cabang (`can_manage_store`) |
| 7 | Resep inventaris, stock opname, SOP |
| 8 | Biaya bulanan berulang (Listrik, Air, Wi-Fi) |
| 9 | Profil karyawan & login PIN |
| 10 | Kunci akses fungsi SECURITY DEFINER (cabut akses `anon`/client dari fungsi admin & trigger) |
| 11 | PIN supervisor: tabel, RPC `set_my_supervisor_pin` / `request_supervisor_approval`. Trigger `enforce_supervisor_approval` masih dikomentari sampai UI PIN Kasir siap |
| 12 | Karyawan: alamat, tanggal mulai, jam shift & hari kerja, toleransi terlambat, insentif bulanan. Aman dijalankan ulang |

---

## 3. Fungsi server (Edge Functions)

Semua ada di `supabase/functions/<nama>/index.ts`. Fungsi ini **tidak** ikut terbuat oleh file SQL;
harus di-deploy terpisah.

| Fungsi | Dipakai oleh | Kegunaan |
|---|---|---|
| `employee-login` | Halaman Login (`src/pages/LoginPage.tsx`) | Daftar profil karyawan & login dengan PIN 6 digit |
| `manage-employee-login` | Manajemen Karyawan (`src/utils/employeeLogin.ts`) | Atur/reset PIN, sinkronkan status, dan cabut login karyawan |
| `create-user` | Manajemen Pengguna (`src/contexts/UserContext.tsx`) | Buat akun Admin/Kasir/Super Admin dengan email & password |
| `check-order` | Tidak dipanggil dari aplikasi kasir (untuk situs publik cek pesanan) | Cek status pesanan pelanggan |
| `get-services` | Tidak dipanggil dari aplikasi kasir (untuk situs publik) | Daftar layanan publik |

Variabel yang dibutuhkan (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sudah otomatis
tersedia di Supabase). Yang harus Anda isi sendiri:

| Secret | Isi | Dipakai oleh |
|---|---|---|
| `ALLOWED_ORIGIN` | Domain aplikasi, contoh `https://kasir.emaklaundry.my.id` (boleh beberapa, pisahkan koma) | employee-login, manage-employee-login, create-user, check-order |

Tanpa `ALLOWED_ORIGIN`, fungsi hanya bisa dipanggil dari `localhost` (pengembangan).

---

## 4. Setup database BARU dari nol

1. **Skema** — Supabase Dashboard → SQL Editor → tempel & jalankan `supabase/setup/0.complete_setup.sql`.
2. **Data awal** (opsional, untuk uji) — jalankan `supabase/setup/1.seed_data_awal.sql`.
   Profil di file ini merujuk ID akun yang harus sudah ada di Authentication.
3. **Data contoh** (opsional) — jalankan `supabase/seeds/00_full_seed_bundle.sql`.
4. **Hubungkan CLI ke project** (sekali saja):
   ```
   supabase login
   supabase link --project-ref <project-ref>
   ```
5. **Deploy fungsi server & atur domain:**
   ```
   supabase functions deploy employee-login manage-employee-login create-user check-order get-services
   supabase secrets set ALLOWED_ORIGIN=https://domain-aplikasi-anda
   ```
6. **Akun pertama** — buat satu pengguna di Dashboard → Authentication, lalu ubah `role` profilnya menjadi
   `Super Admin` di tabel `profiles`. Pengguna berikutnya bisa dibuat dari menu Manajemen Pengguna.

Alternatif lewat terminal (butuh `psql`; connection string ada di Dashboard → Project Settings → Database):

```
psql "postgresql://<USER>:<PASSWORD>@<HOST>:5432/postgres" -f supabase/setup/0.complete_setup.sql
```

> `0.complete_setup.sql` **tidak** aman dijalankan ulang di database yang sudah berisi tabel
> (banyak `CREATE TABLE` tanpa `IF NOT EXISTS`). Untuk database yang sudah berjalan, lihat bagian 5.

---

## 5. Memperbarui database PRODUCTION yang sudah berjalan

Perubahan dijalankan manual: Supabase Dashboard → SQL Editor → tempel SQL perubahannya → Run.

Urutan saat rilis tergantung jenis perubahan:

- **Menambah** tabel/kolom/fungsi: jalankan SQL dulu, **baru** deploy frontend (frontend baru butuh
  kolom itu sudah ada).
- **Menghapus** kolom/fungsi: deploy frontend & edge function dulu, **baru** jalankan SQL (frontend lama
  masih memakai kolom itu). Simpan SQL-nya sementara di `2.jalankan_setelah_deploy.sql`.

Perubahan yang sedang menunggu di production (per 26 Nov 2026):

| Kapan | SQL | Isi |
|---|---|---|
| **Sebelum** frontend baru live | Section 12 dari `0.complete_setup.sql` (salin bagian itu saja) | Kolom profil, jadwal & kompensasi karyawan. Tanpa ini, menyimpan data di halaman Karyawan gagal |
| **Sesudah** frontend baru live **dan** `supabase functions deploy create-user manage-employee-login` | `2.jalankan_setelah_deploy.sql` | Hapus sisa saldo diskon, Pajak (%), Diskon (%), dan `canGiveDiscount` |

---

## 6. Menambah perubahan database baru

1. Tulis perubahannya langsung di `0.complete_setup.sql` (Section yang sesuai, atau Section baru), lalu
   naikkan nomor versi di kepala file dan perbarui tabel bagian 2 halaman ini.
2. Tulis juga SQL perubahan yang aman untuk database yang sudah berjalan (`IF NOT EXISTS`,
   `CREATE OR REPLACE`, `DROP ... IF EXISTS`) dan jalankan di SQL Editor production sesuai urutan di bagian 5.

Dengan begitu file setup selalu bisa membuat ulang database yang sama persis dengan production.

---

## 7. Cek cepat setelah setup

```sql
-- Tabel yang ada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Semua tabel publik memakai RLS (hasil harus kosong)
SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;

-- Aturan akses yang berlaku
SELECT tablename, policyname, roles, cmd, qual FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename, policyname;
```

---

## 8. Masalah yang diketahui

- **Production, 25 Nov 2026:** data `customers` dan `transactions` bisa dibaca tanpa login memakai kunci
  publik. **Dicek ulang 26 Nov 2026: sudah tertutup.** Aturan SELECT yang tersisa di kedua tabel
  mewajibkan login (`get_my_role()` / `get_my_store_id()`), dan semua tabel publik memakai RLS.
  Ulangi cek dengan query `pg_policies` di bagian 7 setiap ada perubahan aturan.
- **QRIS statis belum tersimpan:** isian "QRIS statis" di Pengaturan dan pembayaran QRIS dinamis membaca
  `settings."qrisStaticCode"`, tetapi kolom itu tidak ada di database live maupun di `0.complete_setup.sql`.
