import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PrinterIcon,
  ChevronLeftIcon,
  ShoppingCartIcon,
  SettingsIcon,
} from '../../components/icons';
import PrinterSettingsPanel from '../../components/PrinterSettingsPanel';
import useToasts from '../../contexts/useToasts';
import EmptyState from '../../components/EmptyState';
import { useSettings } from '../../contexts/SettingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { fetchCustomers } from '../../contexts/CustomerContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';

import { supabase } from '../../utils/supabaseClient';
import { formatTransactionId } from '@/utils/uiHelpers';
import {
  PrinterSettings,
  ReceiptLine,
  buildTestReceipt,
  describePrintError,
  getConnectedPrinterName,
  loadPrinterSettings,
  printReceipt,
  resetPrinterConnection,
  savePrinterSettings,
} from '@/utils/thermalPrinter';

import { Transaction, TransactionItem, TransactionItemDetail } from '@/types';

const ReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { settings } = useSettings();
  const { transactions } = useTransactions();
  const navigate = useNavigate();
  const { addAuditLog } = useAuditLogs();
  const { addToast } = useToasts();

  const [printerSettings, setPrinterSettings] =
    React.useState<PrinterSettings>(loadPrinterSettings);
  const [showPrinterSettings, setShowPrinterSettings] = React.useState(false);
  const [printing, setPrinting] = React.useState(false);
  const [connectedName, setConnectedName] = React.useState<string | null>(() =>
    getConnectedPrinterName(printerSettings.method),
  );

  const changePrinterSettings = (next: PrinterSettings) => {
    if (next.method !== printerSettings.method) {
      setConnectedName(getConnectedPrinterName(next.method));
    }
    setPrinterSettings(next);
    savePrinterSettings(next);
  };

  const runPrint = async (lines: ReceiptLine[], chooseDevice = false): Promise<boolean> => {
    setPrinting(true);
    try {
      if (chooseDevice) resetPrinterConnection();
      await printReceipt(lines, printerSettings, chooseDevice);
      setConnectedName(getConnectedPrinterName(printerSettings.method));
      return true;
    } catch (err) {
      setConnectedName(getConnectedPrinterName(printerSettings.method));
      addToast(describePrintError(err), 'error');
      return false;
    } finally {
      setPrinting(false);
    }
  };

  const { data: customersRaw = [] } = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });

  // Normalize customers to always be an array
  const customers = Array.isArray(customersRaw) ? customersRaw : (customersRaw?.data ?? []);

  const transaction = transactions.find((t) => t.id === id);
  const [fetchedTransaction, setFetchedTransaction] = React.useState<Transaction | null>(null);
  React.useEffect(() => {
    if (!transaction && id) {
      supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (data) setFetchedTransaction(data as unknown as Transaction);
        });
    }
  }, [transaction, id]);

  const tx = transaction || fetchedTransaction;
  const customer = tx ? customers.find((c) => c.id === tx.customerId) : null;

  if (!tx || !customer) {
    return (
      <EmptyState
        icon={<ShoppingCartIcon className="mx-auto w-12 h-12 text-slate-400" />}
        title="Transaksi tidak ditemukan"
        description="Transaksi yang Anda cari tidak tersedia atau telah dihapus."
      >
        <Link to="/transactions" className="mt-4 inline-block text-blue-600 hover:underline">
          Kembali ke Daftar Transaksi
        </Link>
      </EmptyState>
    );
  }

  const remainingBalance = tx.total - tx.amountPaid;
  // Nota lama (sebelum diskon/pajak dihapus) bisa punya total ≠ subtotal.
  const legacyAdjustment = tx.total - tx.subtotal;

  const rp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const buildReceiptLines = (): ReceiptLine[] => {
    const lines: ReceiptLine[] = [
      { type: 'text', text: 'Laundry POS', align: 'center', bold: true, size: 'large' },
      { type: 'text', text: 'Struk Transaksi', align: 'center' },
      { type: 'divider' },
      { type: 'pair', left: 'No. Invoice', right: formatTransactionId(tx) },
      { type: 'pair', left: 'Tanggal', right: new Date(tx.createdAt).toLocaleString('id-ID') },
      { type: 'pair', left: 'Pelanggan', right: customer.name },
      { type: 'pair', left: 'Status Bayar', right: String(tx.paymentStatus) },
      { type: 'divider' },
    ];
    for (const item of tx.items) {
      lines.push({ type: 'text', text: item.serviceName, bold: true });
      lines.push({
        type: 'pair',
        left: `${item.quantity} ${item.unit} @ ${rp(item.price)}`,
        right: rp(item.subtotal),
      });
      item.itemDetails?.slice(0, item.quantity).forEach((detail, i) => {
        if (detail.note) lines.push({ type: 'text', text: `  - Item #${i + 1}: ${detail.note}` });
      });
      if (item.taggedItems) lines.push({ type: 'text', text: `  Rincian: ${item.taggedItems}` });
    }
    lines.push({ type: 'divider' });
    if (legacyAdjustment !== 0) {
      lines.push({ type: 'pair', left: 'Subtotal', right: rp(tx.subtotal) });
      lines.push({
        type: 'pair',
        left: 'Penyesuaian',
        right: `${legacyAdjustment < 0 ? '- ' : '+ '}${rp(Math.abs(legacyAdjustment))}`,
      });
    }
    lines.push({ type: 'pair', left: 'TOTAL', right: rp(tx.total), bold: true });
    lines.push({ type: 'divider' });
    lines.push({ type: 'pair', left: 'Metode Bayar', right: tx.paymentMethod || '-' });
    lines.push({ type: 'pair', left: 'Dibayar', right: rp(tx.amountPaid) });
    if (tx.change > 0) lines.push({ type: 'pair', left: 'Kembalian', right: rp(tx.change) });
    lines.push({
      type: 'pair',
      left: 'Sisa Tagihan',
      right: rp(remainingBalance > 0 ? remainingBalance : 0),
      bold: true,
    });
    lines.push({ type: 'divider' });
    lines.push({
      type: 'text',
      align: 'center',
      text: `Estimasi Selesai: ${
        tx.estimatedCompletionDate
          ? new Date(tx.estimatedCompletionDate).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : '-'
      }`,
    });
    lines.push({ type: 'blank' });
    lines.push({
      type: 'text',
      align: 'center',
      text: settings?.receiptMessage ?? 'Terima kasih telah menggunakan layanan kami.',
    });
    return lines;
  };

  const handlePrint = async () => {
    const ok = await runPrint(buildReceiptLines());
    if (ok) addAuditLog(`Mencetak receipt untuk transaksi ${formatTransactionId(tx)}.`, tx.storeId);
  };

  return (
    <div
      style={{ '--receipt-width': `${printerSettings.paperWidthMm}mm` } as React.CSSProperties}
      className="max-w-md mx-auto rounded-lg border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-800 receipt-print"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Laundry POS</h1>
        <p className="text-base text-slate-500 dark:text-slate-400">Struk Transaksi</p>
      </div>

      <div className="border-b-2 border-dashed border-slate-300 dark:border-slate-600 pb-4 mb-4">
        <div className="flex justify-between text-base">
          <span className="text-slate-500 dark:text-slate-400">No. Invoice</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {formatTransactionId(tx)}
          </span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-slate-500 dark:text-slate-400">Tanggal</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {new Date(tx.createdAt).toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-slate-500 dark:text-slate-400">Pelanggan</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{customer.name}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-slate-500 dark:text-slate-400">Status Bayar</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {tx.paymentStatus}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {tx.items.map((item: TransactionItem, index: number) => (
          <div key={index} className="flex flex-col text-base py-1">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.serviceName}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {item.quantity} {item.unit} @ Rp {item.price.toLocaleString('id-ID')}
                </p>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Rp {item.subtotal.toLocaleString('id-ID')}
              </p>
            </div>
            {item.itemDetails
              ?.slice(0, item.quantity)
              .some((d: TransactionItemDetail) => d.note) && (
              <div className="pl-4 mt-1 space-y-0.5">
                {item.itemDetails?.slice(0, item.quantity).map(
                  (detail: TransactionItemDetail, detailIndex: number) =>
                    detail.note && (
                      <p key={detailIndex} className="text-sm text-slate-500 dark:text-slate-400">
                        - Item #{detailIndex + 1}: {detail.note}
                      </p>
                    ),
                )}
              </div>
            )}
            {item.taggedItems && (
              <div className="pl-4 mt-1">
                <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                  Rincian: {item.taggedItems}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-4 mt-4 space-y-2">
        {legacyAdjustment !== 0 && (
          <>
            <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span>Rp {tx.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
              <span>Penyesuaian</span>
              <span>
                {legacyAdjustment < 0 ? '- ' : '+ '}Rp{' '}
                {Math.abs(legacyAdjustment).toLocaleString('id-ID')}
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white pt-2 border-t border-slate-300 dark:border-slate-600">
          <span>Total</span>
          <span>Rp {tx.total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-4 mt-4 space-y-2">
        <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
          <span>Metode Bayar</span>
          <span>{tx.paymentMethod || '-'}</span>
        </div>
        <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
          <span>Dibayar</span>
          <span>Rp {tx.amountPaid.toLocaleString('id-ID')}</span>
        </div>
        {tx.change > 0 && (
          <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
            <span>Kembalian</span>
            <span>Rp {tx.change.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg text-slate-900 dark:text-white">
          <span>Sisa Tagihan</span>
          <span>Rp {remainingBalance > 0 ? remainingBalance.toLocaleString('id-ID') : 0}</span>
        </div>
      </div>

      <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
        <p>
          Estimasi Selesai:{' '}
          {tx.estimatedCompletionDate
            ? new Date(tx.estimatedCompletionDate).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : '-'}
        </p>
        <p className="mt-2">
          {settings?.receiptMessage ?? 'Terima kasih telah menggunakan layanan kami.'}
        </p>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 print-hide">
        <button onClick={() => navigate(-1)} className="btn btn-secondary flex-1">
          <ChevronLeftIcon className="w-5 h-5" />
          Kembali
        </button>
        <button onClick={handlePrint} disabled={printing} className="btn btn-primary flex-1">
          <PrinterIcon className="w-5 h-5" />
          {printing ? 'Mencetak…' : 'Cetak'}
        </button>
        <button
          type="button"
          onClick={() => setShowPrinterSettings((v) => !v)}
          className="btn btn-secondary"
          aria-expanded={showPrinterSettings}
          aria-label="Pengaturan printer"
          title="Pengaturan printer"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {showPrinterSettings && (
        <PrinterSettingsPanel
          settings={printerSettings}
          onChange={changePrinterSettings}
          onTestPrint={() => runPrint(buildTestReceipt(printerSettings))}
          onChooseDevice={() => runPrint(buildTestReceipt(printerSettings), true)}
          connectedName={connectedName}
          busy={printing}
        />
      )}
    </div>
  );
};

export default ReceiptPage;
