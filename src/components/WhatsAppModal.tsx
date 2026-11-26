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

  const generatedMessage = React.useMemo(() => {
    if (!transaction || !customer) return '';
    return buildWhatsAppReceiptMessage({ transaction, customer, settings, store });
  }, [transaction, customer, settings, store]);

  // draft = hasil edit kasir; null = pakai pesan otomatis (ikut berubah bila data selesai dimuat).
  const [draft, setDraft] = React.useState<string | null>(null);
  const [phoneInput, setPhoneInput] = React.useState('');
  const [savePhone, setSavePhone] = React.useState(false);

  // Reset isian setiap kali modal dibuka untuk transaksi/pelanggan tertentu.
  React.useEffect(() => {
    if (!isOpen) return;
    setDraft(null);
    setPhoneInput(customer?.phone ?? '');
    setSavePhone(!normalizeWhatsAppPhone(customer?.phone));
  }, [isOpen, transaction?.id, customer?.id, customer?.phone]);

  const message = draft ?? generatedMessage;
  const phone = normalizeWhatsAppPhone(phoneInput);
  const phoneChanged = phone !== null && phone !== normalizeWhatsAppPhone(customer?.phone);

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
      `Mengirim notifikasi WhatsApp untuk transaksi ${invoiceNumber} kepada ${customer.name}.`,
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

    if (phoneChanged && savePhone) {
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
              ? `Akan dikirim ke +${phone}`
              : customer.phone
                ? 'Nomor tidak valid. Periksa kembali nomor WhatsApp pelanggan.'
                : 'Pelanggan belum punya nomor HP. Isi nomor WhatsApp-nya di sini.'}
          </p>
          {phoneChanged && (
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={savePhone}
                onChange={(e) => setSavePhone(e.target.checked)}
              />
              Simpan nomor ini ke data pelanggan
            </label>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="wa-message" className="form-label">
              Isi Pesan
            </label>
            {draft !== null && (
              <button
                type="button"
                className="btn btn-ghost text-sm"
                onClick={() => setDraft(null)}
              >
                Kembalikan pesan awal
              </button>
            )}
          </div>
          <textarea
            id="wa-message"
            className="form-input min-h-64 font-normal"
            rows={14}
            value={message}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppModal;
