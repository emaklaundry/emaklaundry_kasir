import React, { useState, useEffect } from 'react';
import { useToasts } from '../contexts/ToastContext';
import Modal from './Modal';
import { SendIcon } from './icons';
import { Transaction, Customer, OrderStatus } from '@/types';

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
  const [message, setMessage] = useState('');
  const { addToast } = useToasts();

  useEffect(() => {
    if (transaction && customer) {
      let defaultMessage = '';
      const itemsList = transaction.items
        .map((item) => `- ${item.quantity} ${item.unit} ${item.serviceName}`)
        .join('\n');
      const remainingBalance = transaction.total - transaction.amountPaid;
      const shortId = transaction.invoice_code || transaction.id.slice(-6).toUpperCase();

      if (transaction.orderStatus === OrderStatus.Processing) {
        defaultMessage =
          `Halo ${customer.name},\n\n` +
          `Terima kasih telah mempercayakan laundry Anda kepada kami. Berikut adalah detail transaksi Anda:\n` +
          `─────────────────────────────\n` +
          `🧾 *ID Transaksi*: ${shortId}\n` +
          `📅 *Tanggal*: ${new Date(transaction.createdAt).toLocaleDateString('id-ID')}\n` +
          `─────────────────────────────\n` +
          `*Daftar Item:*\n${itemsList}\n` +
          `─────────────────────────────\n` +
          `💰 *Total*: Rp ${transaction.total.toLocaleString('id-ID')}\n` +
          `💳 *Status Bayar*: ${transaction.paymentStatus}\n` +
          `⏳ *Estimasi Selesai*: ${new Date(transaction.estimatedCompletionDate).toLocaleDateString('id-ID')}\n` +
          `─────────────────────────────\n` +
          `Kami akan menginformasikan kembali jika pesanan Anda sudah siap diambil.\n\n` +
          `Salam hangat,\nTim Emak Laundry`;
      } else if (transaction.orderStatus === OrderStatus.Ready) {
        defaultMessage =
          `Halo ${customer.name},\n\n` +
          `Pesanan laundry Anda dengan ID *${shortId}* sudah *SIAP DIAMBIL*.\n` +
          `─────────────────────────────\n` +
          `💰 *Total Tagihan*: Rp ${transaction.total.toLocaleString('id-ID')}\n` +
          `💸 *Sisa Tagihan*: Rp ${remainingBalance > 0 ? remainingBalance.toLocaleString('id-ID') : 0}\n` +
          `─────────────────────────────\n` +
          `Silakan datang ke toko kami untuk pengambilan.\n\n` +
          `Terima kasih atas kepercayaan Anda.\nTim Emak Laundry`;
      } else {
        // Completed
        defaultMessage =
          `Halo ${customer.name},\n\n` +
          `Pesanan laundry Anda dengan ID *${shortId}* sudah *SELESAI & LUNAS*.\n` +
          `Pesanan sudah bisa diambil di toko kami. Mohon tunjukkan pesan ini saat pengambilan.\n\n` +
          `Terima kasih telah menggunakan layanan kami.\nTim Emak Laundry`;
      }
      setMessage(defaultMessage);
    }
  }, [transaction, customer]);

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
