import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Transaction, Customer, OrderStatus } from '@/types';
import { SendIcon } from './icons';
import { useToasts } from '../contexts/ToastContext';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  customer: Customer | null;
}

function WhatsAppModal({ isOpen, onClose, transaction, customer }: WhatsAppModalProps) {
    const [message, setMessage] = useState('');
    const { addToast } = useToasts();

    useEffect(() => {
        if (transaction && customer) {
            let defaultMessage = '';
            const itemsList = transaction.items.map(item => `- ${item.quantity} ${item.unit} ${item.serviceName}`).join('\n');
            const remainingBalance = transaction.total - transaction.amountPaid;

            if (transaction.orderStatus === OrderStatus.Processing) {
                 defaultMessage = `Halo ${customer.name},\n\nTerima kasih telah menggunakan layanan kami. Berikut adalah rincian transaksi Anda:\n\nID Transaksi: ${transaction.id}\nTanggal: ${new Date(transaction.createdAt).toLocaleDateString('id-ID')}\n\nItem:\n${itemsList}\n\nTotal: Rp ${transaction.total.toLocaleString('id-ID')}\nStatus Bayar: ${transaction.paymentStatus}\nEstimasi Selesai: ${new Date(transaction.estimatedCompletionDate).toLocaleDateString('id-ID')}\n\nKami akan memberitahu Anda lagi ketika pesanan Anda sudah siap diambil.\n\nTerima kasih!`;
            } else if (transaction.orderStatus === OrderStatus.Ready) {
                defaultMessage = `Halo ${customer.name},\n\nPesanan laundry Anda dengan ID ${transaction.id} sudah SIAP DIAMBIL.\n\nTotal Tagihan: Rp ${transaction.total.toLocaleString('id-ID')}\nSisa Tagihan: Rp ${remainingBalance > 0 ? remainingBalance.toLocaleString('id-ID') : 0}\n\nSilakan datang ke toko kami untuk mengambilnya.\n\nTerima kasih!`;
            } else { // Assumes the only other case is Completed
                defaultMessage = `Halo ${customer.name},\n\nPesanan laundry Anda dengan ID ${transaction.id} sudah SELESAI dan LUNAS.\n\nPesanan sudah bisa diambil di toko kami. Mohon tunjukkan struk ini saat pengambilan.\n\nTerima kasih!`;
            }
            setMessage(defaultMessage);
        }
    }, [transaction, customer]);

    const handleSend = () => {
        if (!customer?.phone) {
            addToast('Nomor telepon pelanggan tidak ditemukan.', 'error');
            return;
        }
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const phone = customer.phone.replace(/\D/g, '');
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
                    <button onClick={handleSend} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-6 py-3 flex items-center">
                        <SendIcon className="w-5 h-5 mr-2" />
                        Kirim
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <p className="text-base text-slate-500 dark:text-slate-400">Pesan akan dikirim ke:</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{customer.name} ({customer.phone})</p>
                </div>
                <div>
                    <label className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Isi Pesan</label>
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
}

export default WhatsAppModal;