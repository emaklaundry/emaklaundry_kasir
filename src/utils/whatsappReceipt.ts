import { Customer, OrderStatus, PaymentStatus, Settings, Store, Transaction } from '@/types';
import { formatTransactionId } from '@/utils/uiHelpers';

export const DEFAULT_BUSINESS_NAME = 'Emak Laundry';
export const DEFAULT_TRACKING_URL = 'https://emaklaundry.my.id/';
const FEEDBACK_URL = 'https://forms.gle/8JnjZZ4cu5oTXGYr9';

/** Footer default: link kritik & saran. Link cek status per-invoice sudah ditulis di badan pesan. */
export const buildDefaultWhatsAppFooter = () => `💬 Kritik & saran: ${FEEDBACK_URL}`;

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
  const businessName = settings?.businessName?.trim() || DEFAULT_BUSINESS_NAME;
  const trackingBase = settings?.trackingUrl?.trim() || DEFAULT_TRACKING_URL;

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

  const footer = settings?.whatsappFooter?.trim() || buildDefaultWhatsAppFooter();
  const closingMessage =
    settings?.receiptMessage?.trim() || 'Terima kasih telah menggunakan layanan kami.';

  const formatDate = (value: Date | string | undefined | null, withTime = false) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(
      'id-ID',
      withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' },
    );
  };

  // ── Kepala: nama usaha / cabang
  const storeName = store?.name?.trim();
  const storeAddress = store?.address?.trim();
  const header = [
    `*${storeName ? `${businessName} – ${storeName}` : businessName}*`,
    storeAddress || null,
  ];

  // ── Sapaan + status pesanan (satu kalimat)
  const statusLine =
    transaction.orderStatus === OrderStatus.Processing
      ? `Halo ${customer.name}, pesanan Anda sudah kami terima dan sedang diproses.`
      : transaction.orderStatus === OrderStatus.Ready
        ? `Halo ${customer.name}, pesanan Anda sudah *SIAP DIAMBIL* ✅`
        : `Halo ${customer.name}, pesanan Anda sudah *SELESAI* ✅`;

  // ── Info invoice
  const createdText = formatDate(transaction.createdAt);
  const estimatedText =
    transaction.orderStatus === OrderStatus.Processing
      ? formatDate(transaction.estimatedCompletionDate, true)
      : null;
  const infoBlock = [
    `🧾 No. Invoice: *${invoiceNumber}*`,
    createdText ? `📅 Tanggal: ${createdText}` : null,
    estimatedText ? `⏳ Estimasi Selesai: ${estimatedText}` : null,
  ];

  // ── Rincian item
  const itemsBlock = [
    '*Rincian*',
    ...transaction.items.map(
      (item) =>
        `• ${item.serviceName} ${item.quantity} ${item.unit} × ${rp(item.price)} = ${rp(item.subtotal)}`,
    ),
  ];

  // ── Pembayaran: subtotal/diskon/pajak hanya muncul bila ada potongan atau pajak,
  // supaya jumlah item tetap cocok dengan total yang ditagih.
  const paymentBlock: (string | null)[] = [];
  if (discount > 0 || tax > 0) {
    paymentBlock.push(`Subtotal: ${rp(subtotal)}`);
    if (discount > 0) paymentBlock.push(`Diskon: -${rp(discount)}`);
    if (tax > 0) paymentBlock.push(`Pajak: ${rp(tax)}`);
  }
  paymentBlock.push(`*Total: ${rp(total)}*`);
  paymentBlock.push(
    `Dibayar: ${rp(amountPaid)}${amountPaid > 0 && transaction.paymentMethod ? ` (${transaction.paymentMethod})` : ''}`,
  );
  if (change > 0) paymentBlock.push(`Kembalian: ${rp(change)}`);
  paymentBlock.push(
    isPaid
      ? `Status Bayar: *${PaymentStatus.Paid.toUpperCase()}* ✅`
      : `Status Bayar: *${PaymentStatus.Unpaid.toUpperCase()}* – Sisa Tagihan: ${rp(remainingBalance)}`,
  );

  const notes = transaction.notes?.trim();
  const notesBlock = notes ? [`📝 Catatan: ${notes}`] : [];

  // ── Penutup sesuai status
  const closing =
    transaction.orderStatus === OrderStatus.Processing
      ? 'Kami kabari lagi saat pesanan siap diambil.'
      : transaction.orderStatus === OrderStatus.Ready
        ? isPaid
          ? 'Silakan ambil di toko kami. Terima kasih!'
          : `Silakan ambil di toko kami, pembayaran ${rp(remainingBalance)} dapat dilakukan saat pengambilan. Terima kasih!`
        : closingMessage;

  const sections: (string | null)[][] = [
    header,
    [statusLine],
    infoBlock,
    itemsBlock,
    paymentBlock,
    notesBlock,
    [`🔍 Cek status: ${trackingUrl}`],
    [closing, `– Tim ${businessName}`],
    [footer],
  ];

  return sections
    .map((lines) => lines.filter((l): l is string => !!l).join('\n'))
    .filter(Boolean)
    .join('\n\n');
}
