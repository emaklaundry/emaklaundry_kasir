import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  BookOpenIcon, 
  PrinterIcon, 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  SaveIcon, 
  XIcon,
  FileTextIcon
} from 'lucide-react';
import useAppContext from '../../contexts/useAppContext';
import { UserRole } from '@/types';

interface SOP {
  id: string;
  title: string;
  category: string;
  content: string;
  display_order: number;
}

const SOPPage = () => {
  const { currentUser } = useAppContext();
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
      if (error.code === '42P01') { // undefined_table
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
      display_order: sops.length + 1
    });
  };

  const handleSave = async () => {
    if (!editForm.title || !editForm.content) return;

    const payload = {
       title: editForm.title,
       category: editForm.category || 'Umum',
       content: editForm.content,
       display_order: editForm.display_order || 0,
       updated_at: new Date().toISOString()
    };

    if (isEditing === 'new') {
      const { error } = await supabase
        .from('standard_operating_procedures')
        .insert([payload]);
      if (error) alert('Error saving: ' + error.message);
    } else {
      const { error } = await supabase
        .from('standard_operating_procedures')
        .update(payload)
        .eq('id', isEditing!);
      if (error) alert('Error updating: ' + error.message);
    }

    setIsEditing(null);
    setEditForm({});
    setLoading(true); // Manually set loading for refresh
    fetchSops();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SOP?')) return;
    
    const { error } = await supabase
      .from('standard_operating_procedures')
      .delete()
      .eq('id', id);
    
    if (error) alert('Error deleting: ' + error.message);
    setLoading(true); // Manually set loading for refresh
    fetchSops();
  };

  // Group SOPs by category
  const groupedSops = sops.reduce((acc, sop) => {
    if (!acc[sop.category]) acc[sop.category] = [];
    acc[sop.category].push(sop);
    return acc;
  }, {} as Record<string, SOP[]>);

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white print:min-h-0">
      {/* Header - No Print */}
      <div className="print:hidden p-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpenIcon className="w-6 h-6 text-brand-blue-600" />
              SOP (Standard Operating Procedures)
            </h1>
            <p className="text-slate-500 mt-1">Dokumen standar operasional laundry.</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <PlusIcon className="w-4 h-4" />
                Tambah SOP
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors shadow-sm"
            >
              <PrinterIcon className="w-4 h-4" />
              Cetak A4
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[210mm] mx-auto p-6 md:p-8 print:p-0 print:max-w-none print:mx-0">
        
        {/* Editor Modal / Container */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
                <h3 className="text-lg font-bold text-slate-800">
                  {isEditing === 'new' ? 'Buat SOP Baru' : 'Edit SOP'}
                </h3>
                <button onClick={() => setIsEditing(null)} className="text-slate-400 hover:text-slate-600">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul SOP</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="Contoh: Penerimaan Laundry Kiloan"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                   <input // Simple input for now, could be select
                    type="text" 
                    list="categories"
                    value={editForm.category || ''}
                    onChange={e => setEditForm({...editForm, category: e.target.value})}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="Contoh: Kasir, Produksi, Umum"
                   />
                   <datalist id="categories">
                     <option value="Umum" />
                     <option value="Kasir" />
                     <option value="Produksi" />
                     <option value="Admin" />
                   </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Urutan</label>
                  <input
                    type="number"
                    value={editForm.display_order || 0}
                    onChange={e => setEditForm({...editForm, display_order: parseInt(e.target.value)})}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Konten Prosedur</label>
                  <textarea
                    rows={12}
                    value={editForm.content || ''}
                    onChange={e => setEditForm({...editForm, content: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="Tulis langkah-langkah SOP di sini..."
                  ></textarea>
                   <p className="text-xs text-slate-500 mt-1">Tekan Enter untuk baris baru.</p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setIsEditing(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 shadow-sm"
                >
                  <SaveIcon className="w-4 h-4" />
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE AREA */}
        <div id="sop-document" className="bg-white rounded-none shadow-none print:w-full">
          
          {/* Print Header */}
          <div className="hidden print:block mb-8 pb-4 border-b-2 border-black">
             <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider">Standar Operasional Prosedur</h1>
                    <p className="text-sm text-gray-600">Emak Laundry & Cleaners</p>
                 </div>
                 <div className="text-right text-xs">
                    <p>Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
                 </div>
             </div>
          </div>

          {loading ? (
             <div className="p-10 text-center text-slate-400 print:hidden">Loading SOP data...</div>
          ) : sops.length === 0 ? (
             <div className="p-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl print:hidden">
               <FileTextIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
               <p>Belum ada SOP yang dibuat.</p>
               {isAdmin && <p className="text-sm mt-1">Klik "Tambah SOP" untuk membuat dokumen baru.</p>}
             </div>
          ) : (
            <div className="space-y-8 print:space-y-6">
              {Object.entries(groupedSops).map(([category, items]) => (
                <div key={category} className="break-inside-avoid">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200 print:border-black uppercase tracking-wide">
                    {category}
                  </h2>
                  <div className="space-y-6">
                    {items.map((sop) => (
                      <div key={sop.id} className="group relative bg-white rounded-lg border border-slate-200 p-6 print:border-black print:rounded-none print:p-4 break-inside-avoid shadow-sm print:shadow-none hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                           <h3 className="text-lg font-bold text-slate-900 print:text-black">{sop.title}</h3>
                           {isAdmin && (
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                               <button 
                                 onClick={() => handleEdit(sop)}
                                 className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                 title="Edit"
                               >
                                 <EditIcon className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleDelete(sop.id)}
                                 className="p-1 text-red-600 hover:bg-red-50 rounded"
                                 title="Delete"
                               >
                                 <TrashIcon className="w-4 h-4" />
                               </button>
                             </div>
                           )}
                        </div>
                        <div className="prose prose-sm max-w-none text-slate-700 print:text-black whitespace-pre-wrap leading-relaxed">
                          {sop.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Print Footer */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
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
    </div>
  );
};

export default SOPPage;
