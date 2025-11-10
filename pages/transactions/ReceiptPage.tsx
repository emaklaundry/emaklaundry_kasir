
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockTransactions, mockCustomers, mockSettings } from '../../data/mockData';
import { PrinterIcon, ChevronLeftIcon } from '../../components/icons';
import { useSettings } from '../../contexts/SettingsContext';

const ReceiptPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { settings } = useSettings();
    // In a real app, you would fetch from a single source. Here we combine transaction context and mock data.
    const transaction = mockTransactions.find(t => t.id === id);
    const customer = transaction ? mockCustomers.find(c => c.id === transaction.customerId) : null;
    

    if (!transaction || !customer) {
        return (
            <div className="text-center p-10">
                <p className="text-xl text-slate-500 dark:text-slate-400">Transaksi tidak ditemukan.</p>
                <Link to="/transactions" className="mt-4 inline-block text-blue-600 hover:underline">Kembali ke Daftar Transaksi</Link>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Laundry POS</h1>
                <p className="text-base text-slate-500 dark:text-slate-400">Struk Transaksi</p>
            </div>

            <div className="border-b-2 border-dashed border-slate-300 dark:border-slate-600 pb-4 mb-4">
                <div className="flex justify-between text-base">
                    <span className="text-slate-500 dark:text-slate-400">No. Invoice</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{transaction.id}</span>
                </div>
                <div className="flex justify-between text-base">
                    <span className="text-slate-500 dark:text-slate-400">Tanggal</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(transaction.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-base">
                    <span className="text-slate-500 dark:text-slate-400">Pelanggan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{customer.name}</span>
                </div>
                 <div className="flex justify-between text-base">
                    <span className="text-slate-500 dark:text-slate-400">Status Bayar</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{transaction.paymentStatus}</span>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                {transaction.items.map((item, index) => (
                    <div key={index} className="flex text-base">
                        <div className="flex-grow">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{item.serviceName}</p>
                            <p className="text-slate-500 dark:text-slate-400">{item.quantity} {item.unit} @ Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                    </div>
                ))}
            </div>

            <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>Rp {transaction.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {transaction.discount > 0 && (
                    <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
                        <span>Diskon</span>
                        <span>- Rp {transaction.discount.toLocaleString('id-ID')}</span>
                    </div>
                )}
                {transaction.tax > 0 && (
                    <div className="flex justify-between text-base text-slate-600 dark:text-slate-400">
                        <span>Pajak</span>
                        <span>+ Rp {transaction.tax.toLocaleString('id-ID')}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white pt-2 border-t border-slate-300 dark:border-slate-600">
                    <span>Total</span>
                    <span>Rp {transaction.total.toLocaleString('id-ID')}</span>
                </div>
            </div>
            
            <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
                <p>Estimasi Selesai: {new Date(transaction.estimatedCompletionDate).toLocaleDateString('id-ID')}</p>
                <p className="mt-2">{settings.receiptMessage}</p>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 print-hide">
                 <Link to="/transactions" className="flex-1 flex items-center justify-center text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3.5 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" />
                    Kembali
                </Link>
                <button onClick={() => window.print()} className="flex-1 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5">
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Cetak
                </button>
            </div>
        </div>
    );
};

export default ReceiptPage;
