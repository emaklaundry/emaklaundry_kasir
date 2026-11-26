# Runbook Deploy & Rilis

Dipakai setiap kali merilis perubahan ke production. **Diperbarui:** 26 November 2026.

## Gambaran

| Bagian               | Di mana                             | Cara deploy                                                                                 |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| Frontend (React/PWA) | Vercel, project `emaklaundry-kasir` | Otomatis dari GitHub: push ke `Development` → preview, merge ke `main` → production         |
| Database             | Supabase (PostgreSQL)               | **Manual** di SQL Editor — lihat [supabase/setup/README.md](../../supabase/setup/README.md) |
| Edge Functions       | Supabase                            | **Manual**: `supabase functions deploy <nama>`                                              |

Frontend, database, dan edge function **tidak** ter-deploy bersamaan. Urutannya penting (langkah 3–6).

## Prasyarat

- Akses ke tim Vercel `emak-laundrys-projects` dan ke project Supabase.
- [Supabase CLI](https://supabase.com/docs/guides/cli) yang sudah `supabase login` dan
  `supabase link --project-ref <project-ref>`.
- Variabel lingkungan di Vercel (Project → Settings → Environment Variables), untuk Production dan
  Preview:

| Variabel                 | Wajib | Isi                                                                                               |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Ya    | URL project Supabase                                                                              |
| `VITE_SUPABASE_ANON_KEY` | Ya    | Kunci publik (anon) Supabase. Kunci ini memang terlihat di browser; keamanan data dijaga oleh RLS |
| `VITE_GOOGLE_CLIENT_ID`  | Tidak | Untuk import kontak Google                                                                        |

Versi aplikasi (`VITE_APP_VERSION`) diisi otomatis dari `package.json` saat build.

- Secret edge function: `supabase secrets set ALLOWED_ORIGIN=https://domain-aplikasi` (lihat
  [supabase/setup/README.md](../../supabase/setup/README.md) bagian 3).

## Langkah rilis

1. **Cek lokal** di branch `Development`:
   ```bash
   npm run test:all
   npm run build
   ```
2. **Cadangkan data**: di aplikasi, buka Backup & Restore → Download Full Backup. Wajib bila rilis
   menghapus kolom atau tabel.
3. **SQL penambahan** (tabel/kolom/fungsi baru): jalankan di Supabase SQL Editor **sebelum** frontend
   baru live.
4. **Frontend**: buka PR `Development` → `main`, merge. Tunggu deployment production di Vercel berstatus
   **Ready**.
5. **Edge function** yang berubah: `supabase functions deploy <nama-fungsi>`.
6. **SQL penghapusan** (kolom/fungsi lama): jalankan **setelah** langkah 4 dan 5 selesai. Simpan SQL-nya
   sementara di `supabase/setup/2.jalankan_setelah_deploy.sql`, lalu hapus file itu setelah dijalankan.
7. **Uji cepat** di production (lihat checklist di bawah).

Status per 26 November 2026: tidak ada SQL yang menunggu; production sama dengan
`0.complete_setup.sql` versi 3.6.0. Riwayat langkah tiap rilis ada di
[supabase/setup/README.md](../../supabase/setup/README.md) bagian 5.

## Checklist uji cepat

- [ ] Login Admin dengan email, dan login karyawan dengan nama + PIN.
- [ ] Buat transaksi tunai: total = jumlah harga layanan, kembalian benar, struk & WhatsApp terbuka.
- [ ] Lunasi transaksi "Bayar Nanti" dan tandai Selesai.
- [ ] Admin: simpan perubahan satu karyawan (menguji kolom baru di database).
- [ ] Kasir: menu Karyawan tidak tampil dan URL `/management/employees` dialihkan ke Dashboard.
- [ ] Halaman Bantuan / Tutorial terbuka dan pencarian berfungsi.
- [ ] Log Audit mencatat aktivitas di atas.

## Rollback

- **Frontend:** Vercel → Deployments → pilih deployment production sebelumnya → **Promote to
  Production** (atau Instant Rollback). Selesai dalam hitungan detik.
- **Edge function:** checkout commit sebelumnya, lalu `supabase functions deploy <nama>` lagi.
- **Database:** tidak ada rollback otomatis. SQL penambahan biasanya aman dibiarkan. SQL penghapusan
  **tidak bisa dibatalkan**: pulihkan dari backup langkah 2, atau dari backup otomatis Supabase
  (Dashboard → Database → Backups) bila paket project Anda menyediakannya. Karena itu frontend lama tidak boleh di-rollback setelah langkah 6,
  karena masih memakai kolom yang sudah dihapus.

## Masalah yang pernah terjadi

| Gejala                                                     | Penyebab                                                                          | Perbaikan                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Build Vercel gagal: `npm error ERESOLVE could not resolve` | Versi `vitest` dan `@vitest/coverage-v8` di `package.json` tidak sama persis      | Samakan versinya, jalankan `npm install`, commit `package-lock.json` |
| Build gagal: `Transform failed` / `Expected ")"`           | Error sintaks di kode                                                             | Jalankan `npm run build` lokal sebelum push                          |
| Login karyawan / buat pengguna gagal                       | Edge function belum di-deploy, atau `ALLOWED_ORIGIN` tidak memuat domain aplikasi | Langkah 5 dan secret `ALLOWED_ORIGIN`                                |
| Menyimpan karyawan gagal                                   | Kolom karyawan belum ada di database                                              | Jalankan Section 12 (langkah 3)                                      |
| 404 saat halaman di-refresh                                | —                                                                                 | Sudah ditangani `vercel.json` (rewrite ke `index.html`)              |

## Eskalasi

Masalah yang tidak tertangani: hubungi [mhmdnvn18@gmail.com](mailto:mhmdnvn18@gmail.com) dengan
tautan deployment Vercel dan pesan errornya.
