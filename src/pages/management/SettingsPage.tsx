import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';

const SettingsPage: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const { addAuditLog } = useAuditLogs();
    const { addToast, updateToast } = useToasts();

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

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

            setIsSaving(true);
            // Create a replaceable toast and keep its id so we can update it later
            const toastId = addToast('Menyimpan perubahan...', 'info');
            try {
                await updateSettings(formData);
                addAuditLog('Menyimpan perubahan pada Pengaturan Aplikasi.');
                updateToast(toastId, 'Pengaturan berhasil disimpan!', 'success');
            } catch (error: any) {
                updateToast(toastId, `Gagal menyimpan: ${error.message}`, 'error');
            } finally {
                setIsSaving(false);
            }
    };

    if (!formData) {
        return <div>Loading settings...</div>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto relative">
            {isSaving && (
                <div className="absolute inset-0 z-50 bg-white/60 dark:bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <span className="text-lg font-medium text-slate-900 dark:text-white">Menyimpan perubahan...</span>
                    </div>
                </div>
            )}
            <h1 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-white">Pengaturan Aplikasi</h1>
            <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSaving}>
                <div>
                    <label htmlFor="receiptMessage" className="block mb-2 text-lg font-medium text-slate-900 dark:text-white">Pesan di Struk</label>
                    <textarea 
                        id="receiptMessage" 
                        name="receiptMessage"
                        value={formData.receiptMessage}
                        onChange={handleChange}
                        disabled={isSaving}
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
                            disabled={isSaving}
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
                            disabled={isSaving}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                </div>
                <button type="submit" disabled={isSaving} className="mt-6 px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3">
                    {isSaving && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                    )}
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
            </form>
        </div>
    );
};

export default SettingsPage;
