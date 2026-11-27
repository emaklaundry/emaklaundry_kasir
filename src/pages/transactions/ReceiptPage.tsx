import * as React from 'react';
import { flushSync } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PrinterIcon,
  ChevronLeftIcon,
  ShoppingCartIcon,
  SettingsIcon,
} from '../../components/icons';
import PrinterSettingsPanel from '../../components/PrinterSettingsPanel';
import EmptyState from '../../components/EmptyState';
import { useSettings } from '../../contexts/SettingsContext';
import { useStores } from '../../contexts/StoreContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { ALL_CUSTOMERS_QUERY_KEY, fetchAllCustomers } from '../../contexts/CustomerContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { usePrinter } from '../../hooks/usePrinter';

import { supabase } from '../../utils/supabaseClient';
import { formatTransactionId } from '@/utils/uiHelpers';
import { buildReceiptHeader } from '@/utils/receiptHeader';
import { buildTransactionReceiptLines } from '@/utils/receiptLines';
import { fetchReceiptPrintCount, recordReceiptPrint } from '@/utils/receiptPrints';
import ReceiptPreview from '../../components/ReceiptPreview';

import { Transaction } from '@/types';

const ReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { settings } = useSettings();
  const { stores } = useStores();
  const { transactions } = useTransactions();
  const navigate = useNavigate();
  const { addAuditLog } = useAuditLogs();

  const { printerSettings, printing, runPrint, panelProps } = usePrinter();
  const [showPrinterSettings, setShowPrinterSettings] = React.useState(false);

  const { data: customersRaw = [] } = useQuery({
    queryKey: ALL_CUSTOMERS_QUERY_KEY,
    queryFn: fetchAllCustomers,
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

  // Berapa kali struk ini sudah dicetak (null = tidak diketahui → tanpa tanda CETAK ULANG).
  const [printedCount, setPrintedCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchReceiptPrintCount(id).then((n) => {
      if (!cancelled) setPrintedCount(n);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
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

  const header = buildReceiptHeader(
    settings,
    stores.find((s) => s.id === tx.storeId),
  );
  // Pratinjau menampilkan cetakan berikutnya (sudah dicetak n kali → berikutnya ke-n+1).
  const nextPrintNumber = printedCount == null ? undefined : printedCount + 1;
  const previewLines = buildTransactionReceiptLines(tx, customer, header, settings, {
    printNumber: nextPrintNumber,
  });

  const handlePrint = async () => {
    const recorded = await recordReceiptPrint(tx.id);
    const printNumber = recorded ?? nextPrintNumber;
    const lines = buildTransactionReceiptLines(tx, customer, header, settings, { printNumber });
    // Di HP yang tercetak adalah DOM pratinjau, jadi tanda CETAK ULANG harus sudah
    // tergambar sebelum dialog cetak dibuka.
    if (recorded != null) flushSync(() => setPrintedCount(recorded - 1));
    const ok = await runPrint(lines);
    if (recorded != null) setPrintedCount(recorded);
    if (ok) {
      addAuditLog(
        `Mencetak receipt untuk transaksi ${formatTransactionId(tx)}${
          printNumber && printNumber > 1 ? ` (cetak ulang ke-${printNumber})` : ''
        }.`,
        tx.storeId,
      );
    }
  };

  return (
    <div className="max-w-md mx-auto rounded-lg border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800">
      <ReceiptPreview lines={previewLines} paperWidthMm={printerSettings.paperWidthMm} />

      <div className="mt-6 flex flex-col sm:flex-row gap-4 print-hide">
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

      {showPrinterSettings && <PrinterSettingsPanel {...panelProps} />}
    </div>
  );
};

export default ReceiptPage;
