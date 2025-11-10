
import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const SettingsPage: React.FC = () => {
    const { settings, setSettings } = useSettings();
    const [isSaved, setIsSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumber = ['taxRate', 'discountRate'].includes(name);
        setSettings(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Context state is already updated. In a real app, this would save to a backend.
        console.log('Settings saved:', settings);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-white">Pengaturan Aplikasi</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="receiptMessage" className="block mb-2 text-lg font-medium text-slate-900 dark:text-white">Pesan di Struk</label>
                    <textarea 
                        id="receiptMessage" 
                        name="receiptMessage"
                        value={settings.receiptMessage} 
                        onChange={handleChange} 
                        rows={4} 
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        placeholder="Contoh: Terima kasih telah menggunakan jasa kami!"
                    />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pesan ini akan ditampilkan di bagian bawah setiap struk transaksi.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="taxRate" className="block mb-2 text-lg font-medium text-slate-900 dark:text-white">Pajak (%)</label>
                        <input 
                            type="number"
                            id="taxRate"
                            name="taxRate"
                            value={settings.taxRate}
                            onChange={handleChange}
                            min="0"
                            step="0.1"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                         <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tarif pajak default untuk semua transaksi.</p>
                    </div>
                     <div>
                        <label htmlFor="discountRate" className="block mb-2 text-lg font-medium text-slate-900 dark:text-white">Diskon (%)</label>
                        <input 
                            type="number"
                            id="discountRate"
                            name="discountRate"
                            value={settings.discountRate}
                            onChange={handleChange}
                            min="0"
                            step="0.1"
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                         <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Diskon default untuk semua transaksi.</p>
                    </div>
                </div>


                <div className="flex items-center gap-4">
                    <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-8 py-3.5">
                        Simpan Pengaturan
                    </button>
                    {isSaved && <span className="text-green-600 dark:text-green-400 text-base">Pengaturan berhasil disimpan!</span>}
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;
