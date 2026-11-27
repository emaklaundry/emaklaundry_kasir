import React, { useEffect, useRef, useState } from 'react';
import { XIcon, UserPlusIcon, RefreshCwIcon, UploadIcon } from './icons';
import { parseVcf, VcfContact } from '../utils/vcfParser';
import { normalizePhone } from '../utils/phone';

const readFileAsText = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

interface VcfContactsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: VcfContact[]) => Promise<void>;
  existingPhones: string[];
}

const VcfContactsImportModal: React.FC<VcfContactsImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingPhones,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<VcfContact[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setContacts([]);
      setFileName('');
      setError(null);
      setSelectedContacts(new Set());
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const existingSet = new Set(existingPhones.map(normalizePhone).filter(Boolean));

  // Buang kontak yang nomornya sudah ada di database, lalu terapkan pencarian
  const filteredContacts = contacts.filter((contact) => {
    if (existingSet.has(normalizePhone(contact.phone))) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        contact.name.toLowerCase().includes(term) || contact.phone.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsReading(true);
    setError(null);
    try {
      const parsed = parseVcf(await readFileAsText(file));
      if (parsed.length === 0) {
        setError('Tidak ada kontak dengan nama dan nomor telepon di file ini.');
      }
      setContacts(parsed);
      setFileName(file.name);
      setSelectedContacts(new Set());
      setSearchTerm('');
    } catch {
      setError('Gagal membaca file. Pastikan file berformat .vcf (vCard).');
    } finally {
      setIsReading(false);
    }
  };

  const toggleContact = (id: string) => {
    const next = new Set(selectedContacts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedContacts(next);
  };

  const selectAll = () => setSelectedContacts(new Set(filteredContacts.map((c) => c.id)));
  const deselectAll = () => setSelectedContacts(new Set());

  const handleImport = async () => {
    const contactsToImport = contacts.filter((c) => selectedContacts.has(c.id));
    if (contactsToImport.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(contactsToImport);
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const hasFile = fileName !== '' && contacts.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <UserPlusIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Import Kontak dari File .vcf
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {hasFile
                  ? `${fileName} · ${filteredContacts.length} kontak tersedia untuk diimport`
                  : 'Pilih file kontak hasil export dari HP atau Google Contacts'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Tutup dialog"
          >
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          id="vcf-import-file"
          name="vcf-import-file"
          type="file"
          accept=".vcf,.vcard,text/vcard,text/x-vcard"
          onChange={handleFileChange}
          className="hidden"
          data-testid="vcf-file-input"
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!hasFile ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                <UploadIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Pilih File Kontak
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
                Export kontak dari aplikasi Kontak di HP atau dari contacts.google.com sebagai
                file .vcf, lalu pilih file tersebut di sini.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isReading}
                className="btn btn-primary"
              >
                {isReading ? (
                  <RefreshCwIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadIcon className="w-5 h-5" />
                )}
                Pilih File .vcf
              </button>
              {error && (
                <p role="alert" className="mt-4 text-sm text-red-500">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Search & Actions Bar */}
              <div className="p-4 border-b dark:border-slate-700 space-y-3">
                <label htmlFor="vcf-contacts-search" className="sr-only">
                  Cari kontak
                </label>
                <input
                  id="vcf-contacts-search"
                  name="vcf-contacts-search"
                  type="text"
                  placeholder="Cari kontak..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input py-2 outline-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Hapus Pilihan
                    </button>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedContacts.size} dipilih
                  </span>
                </div>
              </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">
                      {searchTerm
                        ? 'Tidak ada kontak yang cocok'
                        : 'Semua kontak sudah ada di database'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => (
                      <label
                        key={contact.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedContacts.has(contact.id)
                            ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                            : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          className="h-5 w-5 shrink-0 accent-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {contact.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {contact.phone}
                            {contact.address && ` · ${contact.address}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Ganti File
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={selectedContacts.size === 0 || isImporting}
                    className="btn btn-primary btn-sm"
                  >
                    {isImporting && <RefreshCwIcon className="w-4 h-4 animate-spin" />}
                    Import ({selectedContacts.size})
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VcfContactsImportModal;
