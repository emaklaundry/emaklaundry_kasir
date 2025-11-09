import React, { useState } from 'react';
import { mockSettings } from '../../data/mockData';
import { AppSettings } from '../../types';

const formatRupiah = (number: number | string): string => {
    if (typeof number === 'string') {
        number = parseFloat(number.replace(/[^\d]/g, ''));
    }
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('id-ID').format(number);
};

const parseRupiah = (formattedString: string): number => {
    return parseInt(formattedString.replace(/[^\d]/g, ''), 10) || 0;
};

const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>(mockSettings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (name === 'deliveryFeePerKm') {
             setSettings(prev => ({ ...prev, deliveryFeePerKm: parseRupiah(value) }));
        } else if (name === 'taxRate') {
            setSettings(prev => ({ ...prev, taxRate: parseFloat(value) }));
        } else {
             setSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Settings saved:", settings);
        alert("Pengaturan berhasil disimpan!");
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-white">Pengaturan Aplikasi</h1>
            <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="openTime" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Jam Buka</label>
                        <input type="time" id="openTime" name="openTime" value={settings.openTime} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="closeTime" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Jam Tutup</label>
                        <input type="time" id="closeTime" name="closeTime" value={settings.closeTime} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="taxRate" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Tarif Pajak (%)</label>
                    <input type="number" id="taxRate" name="taxRate" value={settings.taxRate} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="deliveryFeePerKm" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Biaya Pengiriman per Km (Rp)</label>
                    <input type="text" id="deliveryFeePerKm" name="deliveryFeePerKm" value={formatRupiah(settings.deliveryFeePerKm)} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="whatsappNumber" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nomor WhatsApp</label>
                    <input type="tel" id="whatsappNumber" name="whatsappNumber" value={settings.whatsappNumber} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                 <div>
                    <label htmlFor="receiptMessage" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Pesan di Struk</label>
                    <input type="text" id="receiptMessage" name="receiptMessage" value={settings.receiptMessage} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                 <div className="flex justify-end pt-4">
                    <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-8 py-4">Simpan Pengaturan</button>
                </div>
            </div>
        </form>
    );
};

export default SettingsPage;