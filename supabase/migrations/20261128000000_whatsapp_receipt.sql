-- Struk WhatsApp:
-- * transactions."whatsappSentAt": kapan struk/notifikasi terakhir dikirim via WhatsApp,
--   supaya kasir tahu transaksi mana yang belum dikirimi struk.
-- * settings."businessName" / "trackingUrl": nama usaha & link cek status yang dipakai
--   di pesan WhatsApp (sebelumnya ditulis langsung di kode).
-- Semua kolom nullable tanpa default: data lama tidak berubah, aplikasi memakai nilai bawaan.
alter table public.transactions
  add column if not exists "whatsappSentAt" timestamptz;

alter table public.settings
  add column if not exists "businessName" text,
  add column if not exists "trackingUrl" text;
