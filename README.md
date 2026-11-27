# Emak Laundry — Web Kasir

Aplikasi kasir dan manajemen laundry multi-cabang berbasis web (PWA). Dipakai kasir untuk transaksi
harian dan admin untuk mengelola pelanggan, layanan, stok, karyawan, aset, pengeluaran, dan laporan.

**Versi:** 2.7.1 · **Diperbarui:** 26 November 2026

---

## Fitur

**Kasir**

- Transaksi kiloan, satuan, sepatu, dan karpet (per meter), dengan catatan per item.
- Pembayaran Tunai, QRIS dinamis, dan Transfer Bank. Total = jumlah harga layanan; tidak ada diskon,
  pajak, atau pembulatan.
- Status pesanan Diproses → Siap Diambil → Selesai, struk cetak, dan pesan WhatsApp ke pelanggan.
- Login karyawan dengan memilih nama + PIN 6 angka.

**Admin & Super Admin**

- Pelanggan, layanan, inventaris (stok minimum, stock opname, resep pemakaian bahan), dan pengeluaran
  (termasuk tagihan bulanan).
- Karyawan: profil, cabang, jadwal shift & hari kerja, toleransi terlambat, gaji/komisi/insentif, dan
  akun login PIN. Absensi masuk/pulang.
- Aset & jadwal perawatan, laporan keuangan & performa kasir, log audit, backup & restore Excel.
- Rencana vs Realisasi: target bisnis per cabang (Default atau per bulan) dibandingkan dengan omzet,
  pendapatan diterima, biaya, dan laba nyata; ringkasan "Target bulan ini" di Dashboard.
- PIN Supervisor untuk menyetujui aksi sensitif Kasir.
- Multi-cabang: data dipisah per cabang dengan Row Level Security; Super Admin melihat semua cabang.

Panduan pemakaian untuk pengguna ada di dalam aplikasi: menu **Bantuan & Panduan → Bantuan / Tutorial**.

---

## Mulai cepat (development)

Butuh Node.js 20+ dan akses ke project Supabase.

```bash
npm install
cp .env.example .env    # isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev             # http://localhost:3000
```

Database baru dari nol: ikuti [supabase/setup/README.md](./supabase/setup/README.md) bagian 4.

| Perintah             | Kegunaan                                         |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Server pengembangan                              |
| `npm run build`      | Build production ke `dist/`                      |
| `npm run type-check` | Pemeriksaan TypeScript                           |
| `npm run lint`       | ESLint                                           |
| `npm test`           | Semua tes (Vitest)                               |
| `npm run test:all`   | Cek format + lint + tes, jalankan sebelum commit |

---

## Dokumentasi

| Untuk                     | Dokumen                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| Semua dokumentasi         | [docs/00-INDEX.md](./docs/00-INDEX.md)                           |
| Database & Edge Functions | [supabase/setup/README.md](./supabase/setup/README.md)           |
| Deploy & rilis            | [docs/deployment/DEPLOYMENT.md](./docs/deployment/DEPLOYMENT.md) |
| Struktur folder           | [docs/STRUCTURE.md](./docs/STRUCTURE.md)                         |
| Kontribusi                | [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)                   |
| Tes                       | [src/\_\_tests\_\_/README.md](./src/__tests__/README.md)         |

---

## Teknologi

- **Frontend:** React 18, React Router 7, Vite 6, Tailwind CSS 3, PWA (vite-plugin-pwa)
- **Bahasa:** TypeScript 5.8 (target ES2024)
- **Data:** TanStack Query 5, Supabase JS 2
- **Backend:** Supabase (PostgreSQL 17, Auth, Edge Functions Deno)
- **Hosting:** Vercel
- **Tes:** Vitest 4, React Testing Library

---

## Perubahan

### Belum dirilis (26 November 2026)

- **Dihapus:** saldo diskon pelanggan (pembulatan tunai ke saldo), Pajak (%) & Diskon (%) di
  Pengaturan, diskon manual di transaksi, dan izin pengguna "Bisa Beri Diskon".
- **Baru:** halaman Bantuan / Tutorial dengan pencarian dan tur interaktif; menu samping dikelompokkan
  menjadi 6 kategori; PIN Supervisor di Pengaturan; manajemen karyawan lengkap (profil, jadwal,
  kompensasi, akun login) dengan filter dan tampilan kartu di ponsel.
- **Diperbaiki:** reset PIN karyawan yang sudah punya login; menonaktifkan karyawan yang punya login;
  tampilan responsif (sidebar menjadi laci di bawah 1024px, tabel bisa digeser, safe-area ponsel).
- **Keamanan:** RLS untuk tabel karyawan/absensi/kasbon/gaji; fungsi admin tidak bisa dipanggil tanpa
  login.
- **Langkah rilis database:** lihat [supabase/setup/README.md](./supabase/setup/README.md) bagian 5.

### v2.7.0 (26 Desember 2024)

Fungsi RPC `get_public_services` menambah `wash_type`, skrip setup digabung menjadi
`0.complete_setup.sql`, dan perbaikan tampilan transaksi di ponsel.

---

## Kontak

Bug atau permintaan fitur: [mhmdnvn18@gmail.com](mailto:mhmdnvn18@gmail.com).
