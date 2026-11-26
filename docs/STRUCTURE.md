# Struktur Proyek

Peta folder Emak Laundry Web Kasir dan tempat menaruh kode baru. **Diperbarui:** 26 November 2026.

## Ringkas

```
emaklaundry_kasir/
├── src/                     Aplikasi React (lihat di bawah)
├── supabase/                Semua backend — peta lengkap: supabase/setup/README.md
│   ├── setup/               0.complete_setup.sql (skema), 1.seed_data_awal.sql, 2.jalankan_setelah_deploy.sql
│   ├── seeds/               Data contoh: 00_full_seed_bundle.sql + 1–4.seed_*.sql
│   ├── functions/           Edge Functions: employee-login, manage-employee-login, create-user, check-order, get-services
│   ├── backup/              Cadangan data asli (xlsx/csv); file .sql di sini tidak masuk git
│   └── config.toml          Pengaturan Supabase CLI
├── public/                  Ikon, manifest PWA, robots.txt, gambar QRIS
├── docs/                    Dokumentasi pengembang — indeks: docs/00-INDEX.md
├── brief/, manual-book/     Bahan referensi (instalasi listrik, manual mesin cuci)
├── index.html               Entry HTML
├── vite.config.ts           Build, dev server (port 3000), PWA
├── vitest.config.ts         Konfigurasi tes (+ vitest.setup.ts)
├── eslint.config.js, tailwind.config.js, tsconfig.json, postcss.config.cjs
├── vercel.json              Rewrite SPA & header cache untuk Vercel
└── .env.example             Contoh variabel lingkungan
```

## `src/`

```
src/
├── index.tsx                Entry React
├── App.tsx                  Routing + penjaga akses (AdminRoute, SuperAdminRoute)
├── sw.js                    Service worker PWA
├── components/
│   ├── layout/              Layout, Header, Sidebar, BottomNavBar
│   ├── features/            Komponen alur transaksi (CustomerSelector, ServiceSelector, TransactionItemsTable, Tutorial)
│   ├── employees/           EmployeeFormModal
│   ├── widgets/             PWAUpdatePrompt, VersionInfo, WeatherWidget
│   ├── icons.tsx            Semua ikon SVG
│   ├── Modal.tsx            Dialog dasar (bottom sheet di ponsel)
│   └── *Modal.tsx, ...      Modal & komponen lain per fitur
├── config/
│   ├── navigation.ts        Kelompok menu sidebar + aturan akses per peran
│   ├── helpTopics.ts        Isi halaman Bantuan / Tutorial
│   └── tutorialSteps.ts     Langkah tur interaktif
├── contexts/                State global (AppContext, TransactionContext, EmployeeContext, ...)
├── hooks/                   Hook kustom (useTutorial, usePagination, useSortableData, ...)
├── pages/
│   ├── transactions/        Daftar, transaksi baru, detail, struk
│   ├── management/          Pelanggan, layanan, inventaris, karyawan, absensi, aset, pengguna, pengaturan, backup, ...
│   ├── business/            Kalkulator Bisnis
│   └── *.tsx                Dashboard, Laporan, Log Audit, Bantuan, Dokumentasi, Login, Aksi Cepat
├── types/                   index.ts (tipe aplikasi), hrm.ts (karyawan), supabase.ts (tipe database)
├── utils/                   Logika murni & klien Supabase (lihat tabel di bawah)
├── data/                    Data statis (spesifikasi mesin cuci)
└── __tests__/               Tes, dikelompokkan seperti src/ — panduan: src/__tests__/README.md
```

Beberapa utilitas penting:

| File | Isi |
|---|---|
| `utils/supabaseClient.ts` | Klien Supabase + RPC transaksi |
| `utils/mappers.ts`, `utils/employeeMappers.ts` | Konversi baris database ↔ tipe aplikasi |
| `utils/employeeLogin.ts` | Panggilan edge function login karyawan |
| `utils/supervisorApproval.ts` | RPC PIN Supervisor |
| `utils/excelUtils.ts`, `utils/backupUtils.ts` | Import/export & backup Excel |
| `utils/retryUtils.ts` | Retry & verifikasi penyimpanan data |

## Menaruh kode baru

| Menambah… | Di sini | Jangan lupa |
|---|---|---|
| Halaman | `src/pages/` | Rute di `App.tsx` (pakai `AdminRoute` bila khusus admin), judul di `components/layout/Layout.tsx`, menu di `config/navigation.ts`, topik di `config/helpTopics.ts` |
| Komponen fitur | `src/components/` atau subfolder fiturnya | Pakai `Modal.tsx` untuk dialog |
| Logika tanpa UI | `src/utils/` | Tes di `src/__tests__/utils/` |
| Kolom/tabel database | `supabase/setup/0.complete_setup.sql` | Ikuti [supabase/setup/README.md](../supabase/setup/README.md) bagian 6, perbarui `src/types/supabase.ts` |

## Penamaan

| Jenis | Format | Contoh |
|---|---|---|
| Komponen & halaman | PascalCase.tsx | `CustomerFormModal.tsx` |
| Utilitas, hook, konfigurasi | camelCase.ts | `supabaseClient.ts`, `useTutorial.ts` |
| Tes | NamaFile.test.ts(x) | `EmployeesPage.test.tsx` |
| Dokumentasi | UPPERCASE.md | `DEPLOYMENT.md` |
