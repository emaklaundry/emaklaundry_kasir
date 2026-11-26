import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import {
  BookOpenIcon,
  PrinterIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  FileTextIcon,
} from 'lucide-react';
import useAppContext from '../../contexts/useAppContext';
import useToasts from '../../contexts/useToasts';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { UserRole } from '@/types';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { SpinnerIcon } from '../../components/icons';

interface SOP {
  id: string;
  title: string;
  category: string;
  content: string;
  display_order: number;
}

const SOPPage = () => {
  const { currentUser } = useAppContext();
  const { addToast } = useToasts();
  const [confirm, confirmDialog] = useConfirmDialog();
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null); // ID being edited, or 'new'
  const [editForm, setEditForm] = useState<Partial<SOP>>({});

  const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

  const fetchSops = React.useCallback(async () => {
    // Note: We don't set loading(true) here to avoid "setState in effect" lint error.
    // Initial state is already true. For manual refresh, set loading true before calling this.
    const { data, error } = await supabase
      .from('standard_operating_procedures')
      .select('*')
      .order('category')
      .order('display_order');

    if (error) {
      console.error('Error fetching SOPs:', error);
      // Fallback data if table doesn't exist yet (for demo/dev experience)
      if (error.code === '42P01') {
        // undefined_table
        console.warn('SOP table missing, using mock data. Please run migration.');
      }
    } else {
      setSops(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchSops();
  }, [fetchSops]);

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = (sop: SOP) => {
    setIsEditing(sop.id);
    setEditForm(sop);
  };

  const handleCreate = () => {
    setIsEditing('new');
    setEditForm({
      title: '',
      category: 'Umum',
      content: '',
      display_order: sops.length + 1,
    });
  };

  const handleSave = async () => {
    if (!editForm.title || !editForm.content) return;

    const payload = {
      title: editForm.title,
      category: editForm.category || 'Umum',
      content: editForm.content,
      display_order: editForm.display_order || 0,
      updated_at: new Date().toISOString(),
    };

    const { error } =
      isEditing === 'new'
        ? await supabase.from('standard_operating_procedures').insert([payload])
        : await supabase.from('standard_operating_procedures').update(payload).eq('id', isEditing!);
    if (error) {
      // Editor dibiarkan terbuka agar isian tidak hilang.
      addToast(`Gagal menyimpan SOP: ${error.message}`, 'error');
      return;
    }

    addToast('SOP tersimpan.', 'success');
    setIsEditing(null);
    setEditForm({});
    setLoading(true); // Manually set loading for refresh
    fetchSops();
  };

  const handleDelete = async (sop: SOP) => {
    const ok = await confirm({
      title: 'Hapus SOP',
      message: `Hapus SOP "${sop.title}"? Tindakan ini tidak bisa dibatalkan.`,
    });
    if (!ok) return;

    const { error } = await supabase
      .from('standard_operating_procedures')
      .delete()
      .eq('id', sop.id);
    if (error) {
      addToast(`Gagal menghapus SOP: ${error.message}`, 'error');
      return;
    }
    addToast('SOP dihapus.', 'success');
    setLoading(true); // Manually set loading for refresh
    fetchSops();
  };

  // Group SOPs by category
  const groupedSops = Object.groupBy(sops, (sop) => sop.category);

  const field = (key: string) => `sop-${key}`;

  return (
    <div className="min-h-screen print:min-h-0 print:bg-white">
      {/* Header - No Print */}
      <div className="border-b border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
              <BookOpenIcon className="h-6 w-6 text-brand-blue-600 dark:text-brand-blue-400" />
              SOP (Standard Operating Procedures)
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Dokumen standar operasional laundry.
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={handleCreate} className="btn btn-primary btn-sm">
                <PlusIcon className="h-4 w-4" />
                Tambah SOP
              </button>
            )}
            <button onClick={handlePrint} className="btn btn-secondary btn-sm">
              <PrinterIcon className="h-4 w-4" />
              Cetak A4
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEditing !== null}
        onClose={() => setIsEditing(null)}
        title={isEditing === 'new' ? 'Buat SOP Baru' : 'Edit SOP'}
        footer={
          <>
            <button onClick={() => setIsEditing(null)} className="btn btn-secondary">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!editForm.title?.trim() || !editForm.content?.trim()}
              className="btn btn-primary"
            >
              <SaveIcon className="h-5 w-5" />
              Simpan
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor={field('title')} className="form-label">
              Judul SOP
            </label>
            <input
              id={field('title')}
              type="text"
              value={editForm.title || ''}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="form-input"
              placeholder="Contoh: Penerimaan Laundry Kiloan"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
            <div>
              <label htmlFor={field('category')} className="form-label">
                Kategori
              </label>
              <input
                id={field('category')}
                type="text"
                list="sop-categories"
                value={editForm.category || ''}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="form-input"
                placeholder="Contoh: Kasir, Produksi, Umum"
              />
              <datalist id="sop-categories">
                <option value="Umum" />
                <option value="Kasir" />
                <option value="Produksi" />
                <option value="Admin" />
              </datalist>
            </div>
            <div>
              <label htmlFor={field('order')} className="form-label">
                Urutan
              </label>
              <input
                id={field('order')}
                type="number"
                min={0}
                value={editForm.display_order || 0}
                onChange={(e) =>
                  setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 0 })
                }
                className="form-input"
              />
            </div>
          </div>
          <div>
            <label htmlFor={field('content')} className="form-label">
              Konten Prosedur
            </label>
            <textarea
              id={field('content')}
              rows={12}
              value={editForm.content || ''}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              className="form-input text-sm"
              placeholder="Tulis langkah-langkah SOP di sini..."
              aria-describedby={field('content-hint')}
              required
            />
            <p
              id={field('content-hint')}
              className="mt-1 text-sm text-slate-500 dark:text-slate-400"
            >
              Tekan Enter untuk baris baru. Judul dan konten wajib diisi.
            </p>
          </div>
        </div>
      </Modal>

      {/* Main Content */}
      <div className="mx-auto max-w-[210mm] p-6 md:p-8 print:mx-0 print:max-w-none print:p-0">
        {/* PRINTABLE AREA */}
        <div id="sop-document" className="print:w-full">
          {/* Print Header */}
          <div className="mb-8 hidden border-b-2 border-black pb-4 print:block">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-wider">
                  Standar Operasional Prosedur
                </h1>
                <p className="text-sm text-gray-600">Emak Laundry &amp; Cleaners</p>
              </div>
              <div className="text-right text-xs">
                <p>Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-10 print:hidden" role="status">
              <SpinnerIcon className="h-8 w-8 text-brand-blue-600" />
              <span className="sr-only">Memuat SOP…</span>
            </div>
          ) : sops.length === 0 ? (
            <div className="print:hidden">
              <EmptyState
                icon={<FileTextIcon className="h-12 w-12" />}
                title="Belum ada SOP"
                description="SOP membantu karyawan baru bekerja dengan standar yang sama di setiap cabang."
              >
                {isAdmin && (
                  <button onClick={handleCreate} className="btn btn-primary">
                    <PlusIcon className="h-5 w-5" />
                    Tambah SOP
                  </button>
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="space-y-8 print:space-y-6">
              {Object.entries(groupedSops).map(([category, items]) => (
                <section key={category} className="break-inside-avoid">
                  <h2 className="mb-4 border-b-2 border-slate-200 pb-2 text-xl font-bold uppercase tracking-wide text-slate-800 dark:border-slate-700 dark:text-slate-100 print:border-black">
                    {category}
                  </h2>
                  <div className="space-y-6">
                    {items?.map((sop) => (
                      <article
                        key={sop.id}
                        className="break-inside-avoid rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 print:rounded-none print:border-black print:p-4"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white print:text-black">
                            {sop.title}
                          </h3>
                          {isAdmin && (
                            <div className="flex flex-shrink-0 gap-1 print:hidden">
                              <button
                                onClick={() => handleEdit(sop)}
                                className="btn btn-ghost btn-icon btn-sm"
                                aria-label={`Edit ${sop.title}`}
                                title="Edit"
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(sop)}
                                className="btn btn-ghost btn-icon btn-sm text-red-600 dark:text-red-400"
                                aria-label={`Hapus ${sop.title}`}
                                title="Hapus"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 print:text-black">
                          {sop.content}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Print Footer */}
          <div className="mt-8 hidden border-t border-gray-300 pt-4 text-center text-xs text-gray-500 print:block">
            <p>Dokumen Internal - Dilarang menyebarluaskan tanpa izin.</p>
          </div>
        </div>

        {/* Global Print Styles Injection */}
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              background: white;
            }
            /* Hide Sidebar, Header, etc handled by utility classes 'print:hidden' already */
            /* Ensure text is black */
            * {
              color: black !important;
            }
          }
        `}</style>
      </div>
      {confirmDialog}
    </div>
  );
};

export default SOPPage;
