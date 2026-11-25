# Database & Backend Emak Laundry: Peta Lengkap

Satu halaman untuk melihat **semua** bagian backend: database, migrasi, dan fungsi server (Edge Functions).
Dokumen ini menggantikan isi lama README ini. `SETUP_GUIDE.md` dan `DEPLOYMENT.md` di folder ini sudah
lama (masih menyebut `complete_setup.sql` dan `seed_data.sql` yang tidak ada lagi); pakai halaman ini.

**Diperbarui:** 25 November 2026 · **Versi setup:** 3.3.0

---

## 1. Di mana semuanya berada

```
emaklaundry_kasir/
└── supabase/                      ← SEMUA backend di sini; nama & letak folder wajib tetap (dipakai CLI)
    ├── config.toml                ← pengaturan CLI & Edge Functions
    ├── migrations/                ← perubahan database bertahap untuk database yang SUDAH berjalan
    ├── functions/                 ← 5 fungsi server (TypeScript/Deno)
    ├── setup/
    │   ├── 0.complete_setup.sql   ← SELURUH skema database dalam 1 file (setup dari nol)
    │   ├── 1.seed_data_awal.sql   ← cabang, profil pengguna, pengaturan awal (data uji)
    │   └── README.md              ← halaman ini
    ├── seeds/                     ← data contoh: layanan, inventaris, aset, perawatan
    └── backup/                    ← cadangan data asli (xlsx/csv/pdf); file .sql di sini tidak masuk git
```

Supabase CLI hanya membaca `config.toml`, `migrations/`, dan `functions/`. Folder `setup/`, `seeds/`,
dan `backup/` tidak disentuh CLI, jadi aman berada di sini.

Kenapa ada dua tempat untuk SQL?

| | `supabase/setup/0.complete_setup.sql` | `supabase/migrations/*.sql` |
|---|---|---|
| Dipakai untuk | Membuat database **baru dari nol** | Memperbarui database **production yang sudah ada** |
| Cara menjalankan | Tempel di Supabase SQL Editor | `supabase db push` |
| Isi | Semua migrasi sudah tergabung di sini | Satu file per perubahan, berurutan |

Folder `supabase/` harus tetap di root proyek dengan nama itu: Supabase CLI hanya mencarinya di sana.

---

## 2. Isi `0.complete_setup.sql`

| Section | Isi | Sumber migrasi |
|---|---|---|
| 1 | DROP TABLES (dikomentari, untuk reset total) | – |
| 2 | Tabel inti: stores, profiles, customers, services, transactions, expenses, dll. + RLS | – |
| 3 | RPC: `get_public_services`, `update_transaction_progress`, `bulk_update_order_status` | – |
| 4 | Keamanan & performa: validasi, index, RLS tambahan | – |
| 5 | Trigger otomatis (`updatedAt`, dll.) | – |
| 6 | HRM Lite: employees, attendance, advances, payroll | `20261125040000_ensure_employees_table.sql` |
| 7 | Resep inventaris, stock opname, SOP | – |
| 8 | Biaya bulanan berulang (Listrik, Air, Wi-Fi) | `20261125042146_recurring_monthly_expenses.sql` |
| 9 | Profil karyawan & login PIN | `20261125043507_employee_profile_pin_login.sql` |
| 10 | Saldo diskon pelanggan (pembulatan tunai ke atas + buku catatan saldo) | `20261125160000_customer_discount_balance.sql` |

Section 8–10 adalah salinan utuh file migrasinya.

---

## 3. Fungsi server (Edge Functions)

Semua ada di `supabase/functions/<nama>/index.ts`. Fungsi ini **tidak** ikut terbuat oleh file SQL;
harus di-deploy terpisah.

| Fungsi | Dipakai oleh | Kegunaan |
|---|---|---|
| `employee-login` | Halaman Login (`src/pages/LoginPage.tsx`) | Daftar profil karyawan & login dengan PIN 6 digit |
| `manage-employee-login` | Manajemen Karyawan (`src/pages/management/EmployeesPage.tsx`) | Aktifkan/ubah/hapus login PIN karyawan |
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
5. **Tandai migrasi sebagai sudah berjalan**, karena isinya sudah ada di file setup:
   ```
   supabase migration repair --status applied 20261125040000 20261125042146 20261125043507 20261125160000
   ```
6. **Deploy fungsi server & atur domain:**
   ```
   supabase functions deploy employee-login manage-employee-login create-user check-order get-services
   supabase secrets set ALLOWED_ORIGIN=https://domain-aplikasi-anda
   ```
7. **Akun pertama** — buat satu pengguna di Dashboard → Authentication, lalu ubah `role` profilnya menjadi
   `Super Admin` di tabel `profiles`. Pengguna berikutnya bisa dibuat dari menu Manajemen Pengguna.

> `0.complete_setup.sql` **tidak** aman dijalankan ulang di database yang sudah berisi tabel
> (banyak `CREATE TABLE` tanpa `IF NOT EXISTS`). Untuk database yang sudah berjalan, pakai migrasi.

---

## 5. Memperbarui database PRODUCTION yang sudah berjalan

```
supabase migration list          # lihat migrasi mana yang belum berjalan di server
supabase db push                 # jalankan migrasi yang belum berjalan
supabase functions deploy <nama> # kalau ada fungsi yang berubah
```

Urutan saat rilis: **migrasi dulu, baru deploy frontend.** Frontend baru bisa memakai kolom yang belum
ada di database lama, sehingga transaksi gagal tersimpan bila urutannya terbalik.

---

## 6. Menambah perubahan database baru

1. Buat file baru di `supabase/migrations/` dengan nama `YYYYMMDDHHMMSS_deskripsi.sql`.
2. Jalankan di production dengan `supabase db push`.
3. Salin isi file itu ke `0.complete_setup.sql` sebagai Section baru, perbarui tabel di bagian 2
   halaman ini, dan naikkan nomor versi di kepala file setup.

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

- **Data karyawan HRM terlalu terbuka di file setup:** aturan akses `employees`, `attendance`,
  `advances`, dan `payroll` di Section 6 memakai `USING (true)`.
- **Production, 25 Nov 2026:** data `customers` dan `transactions` bisa dibaca tanpa login memakai kunci
  publik. Aturan penyebabnya tidak ada di repo ini (ditambahkan langsung di server). Cek dengan query
  `pg_policies` di bagian 7, lalu tutup lewat migrasi baru.
