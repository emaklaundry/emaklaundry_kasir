import React from 'react';
import useToasts from '../contexts/useToasts';
import Modal from './Modal';
import { SendIcon } from './icons';
import { Transaction, Customer, OrderStatus, PaymentStatus } from '@/types';
import { useAuditLogs } from '../contexts/AuditLogContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatTransactionId } from '@/utils/uiHelpers';
import { normalizeWhatsAppPhone } from '@/utils/whatsappPhone';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  customer: Customer | null;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  transaction,
  customer,
}) => {
  const { addToast } = useToasts();
  const { addAuditLog } = useAuditLogs();
  const { settings } = useSettings();

  const message = React.useMemo(() => {
    if (!transaction || !customer) return '';
    const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
    const line = '─────────────────────────────';
    const itemsList = transaction.items
      .map(
        (item) =>
          `- ${item.quantity} ${item.unit} ${item.serviceName} @ ${rp(item.price)} = ${rp(item.subtotal)}`,
      )
      .join('\n');
    const subtotal =
      transaction.subtotal ||
      transaction.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const discount = transaction.discount || 0;
    const tax = transaction.tax || 0;
    const total = transaction.total || subtotal;
    const amountPaid = transaction.amountPaid || 0;
    const remainingBalance = Math.max(total - amountPaid, 0);
    const isPaid = transaction.paymentStatus === PaymentStatus.Paid || remainingBalance === 0;
    const invoiceNumber = formatTransactionId(transaction);
    const trackingUrl = `https://emaklaundry.my.id/?invoice=${encodeURIComponent(invoiceNumber)}`;

    // Footer custom dari settings atau default
    const defaultFooter = `🔍 Cek status cucian Anda:\nhttps://emaklaundry.my.id/\n\n💬 Bantu kami lebih baik! Berikan kritik & saran:\nhttps://forms.gle/8JnjZZ4cu5oTXGYr9`;
    const footer = settings?.whatsappFooter || defaultFooter;
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
    if (remainingBalance > 0) costLines.push(`Sisa Tagihan: ${rp(remainingBalance)}`);
    costLines.push(`💳 *Status Bayar*: ${isPaid ? PaymentStatus.Paid : PaymentStatus.Unpaid}`);
    const costBlock = costLines.join('\n');

    const estimated = transaction.estimatedCompletionDate
      ? new Date(transaction.estimatedCompletionDate)
      : null;
    const estimatedText =
      estimated && !Number.isNaN(estimated.getTime())
        ? estimated.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
        : null;

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
        `${line}\n` +
        `${costBlock}\n` +
        (estimatedText ? `⏳ *Estimasi Selesai*: ${estimatedText}\n` : '') +
        `${line}\n` +
        `Kami akan menginformasikan kembali jika pesanan Anda sudah siap diambil.\n\n` +
        `${footer}\n\n` +
        `Salam hangat,\nTim Emak Laundry`
      );
    }
    if (transaction.orderStatus === OrderStatus.Ready) {
      return (
        `Halo ${customer.name},\n\n` +
        `Pesanan laundry Anda dengan No. Invoice *${invoiceNumber}* sudah *SIAP DIAMBIL*.\n` +
        `🔗 *Cek Status*: ${trackingUrl}\n` +
        `${line}\n` +
        `*Daftar Item:*\n${itemsList}\n` +
        `${line}\n` +
        `${costBlock}\n` +
        `${line}\n` +
        `Silakan datang ke toko kami untuk pengambilan.\n\n` +
        `${footer}\n\n` +
        `Terima kasih,\nTim Emak Laundry`
      );
    }
    return (
      `Halo ${customer.name},\n\n` +
      `Pesanan laundry Anda dengan No. Invoice *${invoiceNumber}* sudah *SELESAI*.\n` +
      `🔗 *Cek Status*: ${trackingUrl}\n` +
      `${line}\n` +
      `*Daftar Item:*\n${itemsList}\n` +
      `${line}\n` +
      `${costBlock}\n` +
      `${line}\n` +
      `${closingMessage}\n\n` +
      `${footer}\n\n` +
      `Tim Emak Laundry`
    );
  }, [transaction, customer, settings]);

  const handleSend = () => {
    const phone = normalizeWhatsAppPhone(customer?.phone);
    if (!customer || !phone) {
      addToast('Nomor telepon pelanggan tidak ditemukan atau tidak valid.', 'error');
      return;
    }
    // wa.me berlaku di HP maupun laptop: membuka aplikasi WhatsApp (Desktop/HP)
    // bila terpasang, atau menawarkan WhatsApp Web bila tidak.
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    if (transaction) {
      const invoiceNumber = formatTransactionId(transaction);
      addAuditLog(
        `Mengirim notifikasi WhatsApp untuk transaksi ${invoiceNumber} kepada ${customer.name}.`,
        transaction.storeId,
      );
    }

    window.open(whatsappUrl, '_blank');
    onClose();
  };

  if (!isOpen || !transaction || !customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kirim Notifikasi WhatsApp"
      footer={
        <>
          <button onClick={handleSend} className="btn btn-primary">
            <SendIcon className="w-5 h-5" />
            Kirim
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-base text-slate-500 dark:text-slate-400">Pesan akan dikirim ke:</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {customer.name} ({customer.phone})
          </p>
        </div>
        <div>
          <p id="wa-message-label" className="form-label">
            Isi Pesan
          </p>
          <div
            aria-labelledby="wa-message-label"
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {message}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppModal;
