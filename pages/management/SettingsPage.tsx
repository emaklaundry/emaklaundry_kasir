
import React, { useState } from 'react';
import { mockSettings } from '../../data/mockData';
import { Settings } from '../../types';

const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(mockSettings);
    const [isSaved, setIsSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would save to a backend.
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
