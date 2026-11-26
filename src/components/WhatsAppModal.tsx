import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useToasts from '../contexts/useToasts';
import Modal from './Modal';
import { SendIcon } from './icons';
import { Transaction, Customer } from '@/types';
import { useAuditLogs } from '../contexts/AuditLogContext';
import { useSettings } from '../contexts/SettingsContext';
import { useStores } from '../contexts/StoreContext';
import { useCustomerMutations } from '../contexts/CustomerContext';
import { markTransactionWhatsAppSent } from '../contexts/TransactionContext';
import { formatTransactionId } from '@/utils/uiHelpers';
import { normalizeWhatsAppPhone } from '@/utils/whatsappPhone';
import { buildWhatsAppReceiptMessage } from '@/utils/whatsappReceipt';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  customer: Customer | null;
}

const formatSentAt = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
};

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  transaction,
  customer,
}) => {
  const { addToast } = useToasts();
  const { addAuditLog } = useAuditLogs();
  const { settings } = useSettings();
  const { stores } = useStores();
  const { updateCustomer } = useCustomerMutations();
  const queryClient = useQueryClient();

  const store = React.useMemo(
    () => stores.find((s) => s.id === transaction?.storeId) ?? null,
    [stores, transaction?.storeId],
  );

  // Pesan selalu disusun otomatis dari data transaksi dan tidak bisa diedit kasir,
  // supaya isinya konsisten dan nominal tidak bisa diubah sebelum dikirim.
  const message = React.useMemo(() => {
    if (!transaction || !customer) return '';
    return buildWhatsAppReceiptMessage({ transaction, customer, settings, store });
  }, [transaction, customer, settings, store]);

  // Nomor tujuan dikunci ke data pelanggan bila sudah valid, supaya struk tidak bisa
  // dialihkan ke nomor lain. Hanya pelanggan tanpa nomor valid yang boleh diisi di sini,
  // dan nomor itu wajib disimpan ke data pelanggan (jejaknya tercatat).
  const savedPhone = normalizeWhatsAppPhone(customer?.phone);
  const isPhoneLocked = savedPhone !== null;
  const [phoneInput, setPhoneInput] = React.useState('');

  // Reset isian setiap kali modal dibuka untuk transaksi/pelanggan tertentu.
  React.useEffect(() => {
    if (!isOpen) return;
    setPhoneInput(customer?.phone ?? '');
  }, [isOpen, transaction?.id, customer?.id, customer?.phone]);

  const phone = isPhoneLocked ? savedPhone : normalizeWhatsAppPhone(phoneInput);

  const handleSend = () => {
    if (!transaction || !customer) return;
    if (!phone) {
      addToast('Nomor WhatsApp belum diisi atau tidak valid.', 'error');
      return;
    }
    if (!message.trim()) {
      addToast('Isi pesan tidak boleh kosong.', 'error');
      return;
    }

    // Buka WhatsApp langsung di event klik (sebelum await) agar tidak diblokir popup blocker.
    // wa.me berlaku di HP maupun laptop: membuka aplikasi WhatsApp bila terpasang,
    // atau menawarkan WhatsApp Web bila tidak.
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    const invoiceNumber = formatTransactionId(transaction);
    addAuditLog(
      `Mengirim notifikasi WhatsApp untuk transaksi ${invoiceNumber} kepada ${customer.name} (+${phone})` +
        (isPhoneLocked ? '.' : ', nomor baru diisi saat pengiriman.'),
      transaction.storeId,
    );

    void markTransactionWhatsAppSent(transaction.id)
      .then(() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ['transactions'] }),
          queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] }),
        ]),
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        addToast(`Struk terkirim, tetapi penanda "sudah dikirim" gagal disimpan: ${msg}`, 'error');
      });

    if (!isPhoneLocked) {
      void updateCustomer(customer.id, { phone: phoneInput.trim() })
        .then(() => addToast(`Nomor HP ${customer.name} disimpan.`, 'success'))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          addToast(`Nomor HP gagal disimpan ke data pelanggan: ${msg}`, 'error');
        });
    }

    onClose();
  };

  if (!isOpen || !transaction || !customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kirim Notifikasi WhatsApp"
      footer={
        <button onClick={handleSend} className="btn btn-primary" disabled={!phone}>
          <SendIcon className="w-5 h-5" />
          {transaction.whatsappSentAt ? 'Kirim Ulang' : 'Kirim'}
        </button>
      }
    >
      <div className="space-y-4">
        {transaction.whatsappSentAt && (
          <p
            role="status"
            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
          >
            ✓ Sudah pernah dikirim: {formatSentAt(transaction.whatsappSentAt)}
          </p>
        )}

        <div>
          {isPhoneLocked ? (
            <>
              <p className="form-label">Kirim ke</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {customer.name} (+{savedPhone})
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Nomor diambil dari data pelanggan. Untuk mengubahnya, buka halaman Pelanggan.
              </p>
            </>
          ) : (
            <>
              <label htmlFor="wa-phone" className="form-label">
                Kirim ke {customer.name}
              </label>
              <input
                id="wa-phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                className="form-input"
                placeholder="Contoh: 0812 3456 7890"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                aria-invalid={!phone}
                aria-describedby="wa-phone-hint"
              />
              <p
                id="wa-phone-hint"
                className={`mt-1 text-sm ${phone ? 'text-slate-500 dark:text-slate-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {phone
                  ? `Akan dikirim ke +${phone}. Nomor ini otomatis disimpan ke data pelanggan.`
                  : customer.phone
                    ? 'Nomor di data pelanggan tidak valid. Isi nomor WhatsApp yang benar.'
                    : 'Pelanggan belum punya nomor HP. Isi nomor WhatsApp-nya di sini.'}
              </p>
            </>
          )}
        </div>

        <div>
          <p id="wa-message-label" className="form-label">
            Isi Pesan
          </p>
          <div
            aria-labelledby="wa-message-label"
            className="max-h-96 overflow-y-auto bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {message}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pesan disusun otomatis dari data transaksi. Ubah teks penutup di menu Pengaturan.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppModal;
