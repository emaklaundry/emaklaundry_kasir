import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';

const SettingsPage: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const { addAuditLog } = useAuditLogs();
    const { addToast } = useToasts();

    const [formData, setFormData] = useState(settings);

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumber = ['taxRate', 'discountRate'].includes(name);
        setFormData(prev => (prev ? { ...prev, [name]: isNumber ? parseFloat(value) || 0 : value } : null));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        try {
            await updateSettings(formData);
            addAuditLog('Menyimpan perubahan pada Pengaturan Aplikasi.');
            addToast('Pengaturan berhasil disimpan!', 'success');
        } catch (error: any) {
            addToast(`Gagal menyimpan: ${error.message}`, 'error');
        }
    };

    if (!formData) {
        return <div>Loading settings...</div>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-white">Pengaturan Aplikasi</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="receiptMessage" className="block mb-2 text-lg font-medium text-slate-900 dark:text-white">Pesan di Struk</label>
                    <textarea 
                        id="receiptMessage" 
                        name="receiptMessage"
                        value={formData.receiptMessage}
                        onChange={handleChange}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="taxRate" className="block mb-2 text-lg font-medium text-slate-900 dark:text-white">Pajak (%)</label>
                        <input 
                            type="number"
                            id="taxRate"
                            name="taxRate"
                            value={formData.taxRate}
                            onChange={handleChange}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="discountRate" className="block mb-2 text-lg font-medium text-slate-900 dark:text-white">Diskon (%)</label>
                        <input 
                            type="number"
                            id="discountRate"
                            name="discountRate"
                            value={formData.discountRate}
                            onChange={handleChange}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                </div>
                <button type="submit" className="mt-6 px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800">Simpan</button>
            </form>
        </div>
    );
};

export default SettingsPage;
