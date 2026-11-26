# Indeks Dokumentasi — Emak Laundry Web Kasir

Satu daftar untuk semua dokumentasi proyek. **Diperbarui:** 26 November 2026.

## Mulai dari sini

| Saya ingin…                                                            | Baca                                                                                      |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Menjalankan aplikasi di komputer sendiri                               | [../README.md](../README.md) — Mulai cepat                                                |
| Membuat atau memperbarui database                                      | [../supabase/setup/README.md](../supabase/setup/README.md)                                |
| Deploy ke production / merilis versi baru                              | [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)                                      |
| Memahami struktur folder                                               | [STRUCTURE.md](STRUCTURE.md)                                                              |
| Berkontribusi (branch, commit, cek sebelum PR)                         | [CONTRIBUTING.md](CONTRIBUTING.md)                                                        |
| Menulis atau menjalankan tes                                           | [../src/\_\_tests\_\_/README.md](../src/__tests__/README.md)                              |
| Memahami cara aplikasi menyimpan data dengan aman (retry & verifikasi) | [reports/DATA_CONSISTENCY.md](reports/DATA_CONSISTENCY.md)                                |
| Mengajari kasir/admin memakai aplikasi                                 | Di aplikasi: **Bantuan & Panduan → Bantuan / Tutorial** (isi: `src/config/helpTopics.ts`) |

## Fitur

- [features/EXCEL_IMPORT_EXPORT.md](features/EXCEL_IMPORT_EXPORT.md) — import/export pelanggan, layanan, transaksi, dan backup Excel
- [features/WHATSAPP_FOOTER.md](features/WHATSAPP_FOOTER.md) — footer pesan WhatsApp
- [features/MAINTENANCE_MODE.md](features/MAINTENANCE_MODE.md) — mode maintenance (Super Admin)
- [features/SCHEDULED_MAINTENANCE_COST_UPDATE.md](features/SCHEDULED_MAINTENANCE_COST_UPDATE.md) — catatan perubahan biaya perawatan aset (Des 2025)

## Keamanan & privasi

- [security/SECURITY.md](security/SECURITY.md) — praktik keamanan & checklist
- [security/PRIVACY.md](security/PRIVACY.md) — anti-indexing (aplikasi privat)
- [security/LICENSE](security/LICENSE)

## Catatan historis

Dokumen bertanggal ini dipertahankan sebagai arsip. Path dan fitur di dalamnya bisa sudah berubah
(misalnya folder `database/` sekarang `supabase/`, dan fitur diskon/pajak/saldo sudah dihapus).

- [reports/FINAL_AUDIT_REPORT.md](reports/FINAL_AUDIT_REPORT.md) — audit kode, Des 2025
- [reports/IMPROVEMENTS.md](reports/IMPROVEMENTS.md) — daftar perbaikan dari audit, Des 2025
- [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md) — reorganisasi file, Des 2025

## Menambah dokumen baru

1. Taruh di subfolder yang sesuai (`features/`, `deployment/`, `security/`).
2. Tambahkan satu baris di indeks ini.
3. Jangan menyalin isi dokumen lain; tautkan saja.
