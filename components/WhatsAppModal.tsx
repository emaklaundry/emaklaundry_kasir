import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Transaction, Customer, OrderStatus } from '../types';
import { SendIcon } from './icons';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  customer: Customer | null;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, transaction, customer }) => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (transaction && customer) {
            let defaultMessage = '';
            if (transaction.orderStatus === OrderStatus.Ready) {
                defaultMessage = `Halo ${customer.name},\n\nPesanan laundry Anda dengan ID ${transaction.id} sudah SIAP DIAMBIL.\n\nSilakan datang ke toko kami untuk mengambilnya.\n\nTerima kasih!`;
            } else { // Assumes the only other case is Completed
                defaultMessage = `Halo ${customer.name},\n\nPesanan laundry Anda dengan ID ${transaction.id} sudah SELESAI dan LUNAS.\n\nPesanan sudah bisa diambil di toko kami. Mohon tunjukkan struk ini saat pengambilan.\n\nTerima kasih!`;
            }
            setMessage(defaultMessage);
        }
    }, [transaction, customer]);

    const handleSend = () => {
        if (!customer?.phone) {
            alert('Nomor telepon pelanggan tidak ditemukan.');
            return;
        }
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
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
                    <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">
                        Tutup
                    </button>
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
                    <label htmlFor="whatsappMessage" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Isi Pesan</label>
                    <textarea
                        id="whatsappMessage"
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default WhatsAppModal;