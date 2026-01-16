import React, { useState, useEffect } from 'react';
import { XIcon, UserPlusIcon, CheckIcon, RefreshCwIcon } from './icons';
import useGoogleContacts, { GoogleContact } from '../hooks/useGoogleContacts';

interface GoogleContactsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: GoogleContact[]) => Promise<void>;
  existingPhones: string[];
}

const GoogleContactsImportModal: React.FC<GoogleContactsImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingPhones,
}) => {
  const { contacts, isLoading, error, isAuthenticated, signIn, signOut, fetchContacts } =
    useGoogleContacts();
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch contacts when authenticated
  useEffect(() => {
    if (isAuthenticated && contacts.length === 0) {
      fetchContacts();
    }
  }, [isAuthenticated, contacts.length, fetchContacts]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedContacts(new Set());
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Normalize phone number for comparison
  const normalizePhone = (phone: string) => phone.replace(/[^0-9]/g, '');

  // Filter contacts to exclude existing customers and apply search
  const filteredContacts = contacts.filter((contact) => {
    const phoneNormalized = normalizePhone(contact.phone);
    const isExisting = existingPhones.some((p) => normalizePhone(p) === phoneNormalized);
    if (isExisting) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        contact.name.toLowerCase().includes(term) || contact.phone.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const toggleContact = (resourceName: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(resourceName)) {
      newSelected.delete(resourceName);
    } else {
      newSelected.add(resourceName);
    }
    setSelectedContacts(newSelected);
  };

  const selectAll = () => {
    setSelectedContacts(new Set(filteredContacts.map((c) => c.resourceName)));
  };

  const deselectAll = () => {
    setSelectedContacts(new Set());
  };

  const handleImport = async () => {
    const contactsToImport = contacts.filter((c) => selectedContacts.has(c.resourceName));
    if (contactsToImport.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(contactsToImport);
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

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
                Import dari Google Contacts
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isAuthenticated
                  ? `${filteredContacts.length} kontak tersedia untuk diimport`
                  : 'Hubungkan akun Google Anda'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!isAuthenticated ? (
            /* Not Authenticated View */
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Hubungkan dengan Google
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
                Izinkan akses ke Google Contacts Anda untuk mengimport data pelanggan secara
                otomatis
              </p>
              <button
                onClick={signIn}
                disabled={isLoading}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCwIcon className="w-5 h-5 animate-spin text-slate-600" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span className="text-slate-700 font-medium">Masuk dengan Google</span>
              </button>
              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
          ) : (
            /* Authenticated View */
            <>
              {/* Search & Actions Bar */}
              <div className="p-4 border-b dark:border-slate-700 space-y-3">
                <input
                  type="text"
                  placeholder="Cari kontak..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
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
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCwIcon className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-slate-500">Memuat kontak...</span>
                  </div>
                ) : filteredContacts.length === 0 ? (
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
                      <div
                        key={contact.resourceName}
                        onClick={() => toggleContact(contact.resourceName)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedContacts.has(contact.resourceName)
                            ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                            : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedContacts.has(contact.resourceName)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-slate-300 dark:border-slate-500'
                          }`}
                        >
                          {selectedContacts.has(contact.resourceName) && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {contact.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {contact.phone}
                            {contact.address && ` · ${contact.address}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
                <button
                  onClick={signOut}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Ganti Akun
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={selectedContacts.size === 0 || isImporting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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

export default GoogleContactsImportModal;
