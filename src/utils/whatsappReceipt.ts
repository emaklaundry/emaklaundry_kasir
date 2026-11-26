import { Customer, OrderStatus, PaymentStatus, Settings, Store, Transaction } from '@/types';
import { formatTransactionId } from '@/utils/uiHelpers';

export const DEFAULT_BUSINESS_NAME = 'Emak Laundry';
export const DEFAULT_TRACKING_URL = 'https://emaklaundry.my.id/';
const FEEDBACK_URL = 'https://forms.gle/8JnjZZ4cu5oTXGYr9';

export const buildDefaultWhatsAppFooter = (trackingBase: string = DEFAULT_TRACKING_URL) =>
  `🔍 Cek status cucian Anda:\n${trackingBase}\n\n💬 Bantu kami lebih baik! Berikan kritik & saran:\n${FEEDBACK_URL}`;

/** Link cek status untuk satu invoice, aman bila base URL sudah punya query string. */
export function buildTrackingUrl(base: string, invoiceNumber: string): string {
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}invoice=${encodeURIComponent(invoiceNumber)}`;
}

interface BuildArgs {
  transaction: Transaction;
  customer: Customer;
  settings?: Settings | null;
  store?: Store | null;
}

/** Susun pesan struk WhatsApp sesuai status pesanan. */
export function buildWhatsAppReceiptMessage({
  transaction,
  customer,
  settings,
  store,
}: BuildArgs): string {
  const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
  const line = '─────────────────────────────';
  const businessName = settings?.businessName?.trim() || DEFAULT_BUSINESS_NAME;
  const trackingBase = settings?.trackingUrl?.trim() || DEFAULT_TRACKING_URL;

  const itemsList = transaction.items
    .map(
      (item) =>
        `- ${item.quantity} ${item.unit} ${item.serviceName} @ ${rp(item.price)} = ${rp(item.subtotal)}`,
    )
    .join('\n');
  const subtotal =
    transaction.subtotal || transaction.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const discount = transaction.discount || 0;
  const tax = transaction.tax || 0;
  const total = transaction.total || subtotal;
  const amountPaid = transaction.amountPaid || 0;
  const change = transaction.change || 0;
  const remainingBalance = Math.max(total - amountPaid, 0);
  const isPaid = transaction.paymentStatus === PaymentStatus.Paid || remainingBalance === 0;
  const invoiceNumber = formatTransactionId(transaction);
  const trackingUrl = buildTrackingUrl(trackingBase, invoiceNumber);

  const footer = settings?.whatsappFooter || buildDefaultWhatsAppFooter(trackingBase);
  const closingMessage =
    settings?.receiptMessage?.trim() || 'Terima kasih telah menggunakan layanan kami.';

  // Rincian biaya: subtotal/diskon/pajak hanya muncul bila ada potongan atau pajak,
  // supaya jumlah item tetap cocok dengan total yang ditagih.
  const costLines: string[] = [];
  if (discount > 0 || tax > 0) {
    costLines.push(`Subtotal: ${rp(subtotal)}`);
    if (discount > 0) costLines.push(`Diskon: -${rp(discount)}`);
    if (tax > 0) costLines.push(`Pajak: ${rp(tax)}`);
  }
  costLines.push(`Total: ${rp(total)}`);
  costLines.push(`Dibayar: ${rp(amountPaid)}`);
  if (amountPaid > 0 && transaction.paymentMethod) {
    costLines.push(`Metode Bayar: ${transaction.paymentMethod}`);
  }
  if (change > 0) costLines.push(`Kembalian: ${rp(change)}`);
  if (remainingBalance > 0) costLines.push(`Sisa Tagihan: ${rp(remainingBalance)}`);
  costLines.push(`💳 *Status Bayar*: ${isPaid ? PaymentStatus.Paid : PaymentStatus.Unpaid}`);
  const costBlock = costLines.join('\n');

  const notes = transaction.notes?.trim();
  const notesLine = notes ? `📝 *Catatan*: ${notes}\n` : '';

  const estimated = transaction.estimatedCompletionDate
    ? new Date(transaction.estimatedCompletionDate)
    : null;
  const estimatedText =
    estimated && !Number.isNaN(estimated.getTime())
      ? estimated.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
      : null;

  const storeName = store?.name?.trim();
  const storeAddress = store?.address?.trim();
  const storeBlock = storeName
    ? `📍 *${businessName} – ${storeName}*${storeAddress ? `\n${storeAddress}` : ''}\n\n`
    : '';
  const signTeam = `Tim ${businessName}`;

  if (transaction.orderStatus === OrderStatus.Processing) {
    return (
      `Halo ${customer.name},\n\n` +
      `Terima kasih telah mempercayakan laundry Anda kepada kami. Berikut adalah detail pesanan Anda:\n` +
      `${line}\n` +
      `🧾 *No. Invoice*: ${invoiceNumber}\n` +
      `🔗 *Cek Status*: ${trackingUrl}\n` +
      `📅 *Tanggal*: ${new Date(transaction.createdAt).toLocaleDateString('id-ID')}\n` +
      `${line}\n` +
      `*Daftar Item:*\n${itemsList}\n` +
      notesLine +
      `${line}\n` +
      `${costBlock}\n` +
      (estimatedText ? `⏳ *Estimasi Selesai*: ${estimatedText}\n` : '') +
      `${line}\n` +
      `Kami akan menginformasikan kembali jika pesanan Anda sudah siap diambil.\n\n` +
      `${footer}\n\n` +
      storeBlock +
      `Salam hangat,\n${signTeam}`
    );
  }
  if (transaction.orderStatus === OrderStatus.Ready) {
    return (
      `Halo ${customer.name},\n\n` +
      `Pesanan laundry Anda dengan No. Invoice *${invoiceNumber}* sudah *SIAP DIAMBIL*.\n` +
      `🔗 *Cek Status*: ${trackingUrl}\n` +
      `${line}\n` +
      `*Daftar Item:*\n${itemsList}\n` +
      notesLine +
      `${line}\n` +
      `${costBlock}\n` +
      `${line}\n` +
      `Silakan datang ke toko kami untuk pengambilan.\n\n` +
      `${footer}\n\n` +
      storeBlock +
      `Terima kasih,\n${signTeam}`
    );
  }
  return (
    `Halo ${customer.name},\n\n` +
    `Pesanan laundry Anda dengan No. Invoice *${invoiceNumber}* sudah *SELESAI*.\n` +
    `🔗 *Cek Status*: ${trackingUrl}\n` +
    `${line}\n` +
    `*Daftar Item:*\n${itemsList}\n` +
    notesLine +
    `${line}\n` +
    `${costBlock}\n` +
    `${line}\n` +
    `${closingMessage}\n\n` +
    `${footer}\n\n` +
    storeBlock +
    signTeam
  );
}
