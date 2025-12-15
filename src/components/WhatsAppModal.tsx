import React from 'react';
import useToasts from '../contexts/useToasts';
import Modal from './Modal';
import { SendIcon } from './icons';
import { Transaction, Customer, OrderStatus } from '@/types';
import { useAuditLogs } from '../contexts/AuditLogContext';
import { useSettings } from '../contexts/SettingsContext';

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
    let defaultMessage = '';
    const itemsList = transaction.items
      .map(
        (item) =>
          `- ${item.quantity} ${item.unit} ${item.serviceName} @ Rp${item.price.toLocaleString('id-ID')} = Rp${item.subtotal.toLocaleString('id-ID')}`,
      )
      .join('\n');
    const subtotal =
      transaction.subtotal ||
      transaction.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const discount = transaction.discount || 0;
    const tax = transaction.tax || 0;
    const total = transaction.total || subtotal - discount + tax;
    const amountPaid = transaction.amountPaid || 0;
    const rawRemaining = total - amountPaid;
    const remainingBalance = rawRemaining > 0 ? rawRemaining : 0;
    const invoiceNumber = transaction.invoiceCode || transaction.id.slice(-6).toUpperCase();

    // Footer custom dari settings atau default
    const defaultFooter = `🔍 Cek status cucian Anda:\nhttps://www.emaklaundry.my.id/\n\n💬 Bantu kami lebih baik! Berikan kritik & saran:\nhttps://forms.gle/8JnjZZ4cu5oTXGYr9`;
    const footer = settings?.whatsappFooter || defaultFooter;

    if (transaction.orderStatus === OrderStatus.Processing) {
      defaultMessage =
        `Halo ${customer.name},\n\n` +
        `Terima kasih telah mempercayakan laundry Anda kepada kami. Berikut adalah detail pesanan Anda:\n` +
        `─────────────────────────────\n` +
        `🧾 *No. Invoice*: ${invoiceNumber}\n` +
        `📅 *Tanggal*: ${new Date(transaction.createdAt).toLocaleDateString('id-ID')}\n` +
        `─────────────────────────────\n` +
        `*Daftar Item:*\n${itemsList}\n` +
        `─────────────────────────────\n` +
        `Subtotal: Rp${subtotal.toLocaleString('id-ID')}\n` +
        `Diskon: Rp${discount.toLocaleString('id-ID')}\n` +
        `Pajak: Rp${tax.toLocaleString('id-ID')}\n` +
        `Total: Rp${total.toLocaleString('id-ID')}\n` +
        `Dibayar: Rp${amountPaid.toLocaleString('id-ID')}\n` +
        `Sisa Tagihan: Rp${remainingBalance.toLocaleString('id-ID')}\n` +
        `💳 *Status Bayar*: ${transaction.paymentStatus}\n` +
        `⏳ *Estimasi Selesai*: ${new Date(transaction.estimatedCompletionDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}\n` +
        `─────────────────────────────\n` +
        `Kami akan menginformasikan kembali jika pesanan Anda sudah siap diambil.\n\n` +
        `${footer}\n\n` +
        `Salam hangat,\nTim Emak Laundry`;
    } else if (transaction.orderStatus === OrderStatus.Ready) {
      defaultMessage =
        `Halo ${customer.name},\n\n` +
        `Pesanan laundry Anda dengan No. Invoice *${invoiceNumber}* sudah *SIAP DIAMBIL*.\n` +
        `─────────────────────────────\n` +
        `*Daftar Item:*\n${itemsList}\n` +
        `─────────────────────────────\n` +
        `Total Tagihan: Rp${total.toLocaleString('id-ID')}\n` +
        `Sisa Tagihan: Rp${remainingBalance.toLocaleString('id-ID')}\n` +
        `─────────────────────────────\n` +
        `Silakan datang ke toko kami untuk pengambilan.\n\n` +
        `${footer}\n\n` +
        `Terima kasih,\nTim Emak Laundry`;
    } else {
      defaultMessage =
        `Halo ${customer.name},\n\n` +
        `Pesanan laundry Anda dengan No. Invoice *${invoiceNumber}* sudah *SELESAI*.\n` +
        `─────────────────────────────\n` +
        `*Daftar Item:*\n${itemsList}\n` +
        `─────────────────────────────\n` +
        `Total: Rp${total.toLocaleString('id-ID')}\n` +
        `Status: LUNAS\n` +
        `─────────────────────────────\n` +
        `Terima kasih telah menggunakan layanan kami.\n\n` +
        `${footer}\n\n` +
        `Tim Emak Laundry`;
    }
    return defaultMessage;
  }, [transaction, customer, settings]);

  const handleSend = () => {
    if (!customer?.phone) {
      addToast('Nomor telepon pelanggan tidak ditemukan.', 'error');
      return;
    }
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
    let phone = customer.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = isMobile
      ? `https://wa.me/${phone}?text=${encodedMessage}`
      : `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;

    if (transaction) {
      addAuditLog(
        `Mengirim notifikasi WhatsApp untuk transaksi ${transaction.id} kepada ${customer.name}.`,
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
          <button
            onClick={handleSend}
            className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-6 py-3 flex items-center"
          >
            <SendIcon className="w-5 h-5 mr-2" />
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
          <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">
            Isi Pesan
          </label>
          <div
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
