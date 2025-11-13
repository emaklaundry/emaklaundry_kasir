import React, { useState, useMemo, useEffect } from 'react';
import { useUsers } from '../../contexts/UserContext';
import { User, UserRole, Store } from '@/types';
import { PlusCircleIcon, EditIcon, Trash2Icon, PowerIcon, UsersIcon, SearchIcon, ArrowUpIcon, ArrowDownIcon } from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useStores } from '../../contexts/StoreContext';
import { useAppContext } from '../../contexts/AppContext';
import { useToasts } from '../../contexts/ToastContext';
import UserFormModal from '../../components/UserFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useSortableData } from '../../hooks/useSortableData';

function UsersPage() {
    const { currentUser, selectedStoreId } = useAppContext();
    const { addToast, updateToast } = useToasts();
    // Ambil data users dari Supabase (props/context/hook) sesuai implementasi fetch profiles
    const { stores } = useStores();
    const { addAuditLog } = useAuditLogs();
    const { users, updateUser } = useUsers();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenFormModal = (user: User | null = null) => {
        setCurrentUserToEdit(user);
        setIsFormModalOpen(true);
    };

    const handleToggleStatus = (user: User) => {
        setUserToToggleStatus(user);
    };


    const handleAddUser = () => {
        addToast('Penambahan pengguna baru harus dilakukan via Supabase Dashboard (Authentication). Setelah itu, profil dapat diedit di halaman ini.', 'info');
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentUserToEdit(null);
    };

    const handleSaveUser = async (userData: Omit<User, 'id'>) => {
        const finalData = { ...userData };
        if (finalData.role === UserRole.SuperAdmin) {
            finalData.storeId = undefined;
            finalData.isActive = true;
            finalData.canGiveDiscount = true;
        } else if (!finalData.storeId) {
            addToast('Silakan pilih cabang untuk peran ini.', 'warning');
            return;
        }

        const toastId = addToast('Menyimpan pengguna...', 'info');
        setIsSavingUser(true);
        try {
            if (currentUserToEdit && currentUserToEdit.id) {
                await updateUser(currentUserToEdit.id, {
                    name: finalData.name,
                    role: finalData.role,
                    storeId: finalData.storeId,
                    isActive: finalData.isActive,
                    canGiveDiscount: finalData.canGiveDiscount
                });
                addAuditLog(`Memperbarui data pengguna: "${finalData.name}".`);
                updateToast(toastId, 'Pengguna berhasil diperbarui!', 'success');
                handleCloseFormModal();
            } else {
                updateToast(toastId, 'Penambahan pengguna baru harus dilakukan via Supabase Dashboard (Authentication).', 'info');
            }
        } catch (error: any) {
            updateToast(toastId, `Gagal menyimpan: ${error.message}`, 'error');
        } finally {
            setIsSavingUser(false);
        }
    };



    const confirmToggleStatus = async () => {
        if (userToToggleStatus) {
            const toastId = addToast(`${userToToggleStatus.isActive ? 'Menonaktifkan' : 'Mengaktifkan'} pengguna...`, 'info');
            setIsSavingUser(true);
            try {
                const newStatus = !userToToggleStatus.isActive;
                await updateUser(userToToggleStatus.id, { isActive: newStatus });
                addAuditLog(`Mengubah status pengguna "${userToToggleStatus.name}" menjadi ${newStatus ? 'Aktif' : 'Tidak Aktif'}.`);
                updateToast(toastId, `Status pengguna ${userToToggleStatus.name} diubah menjadi ${newStatus ? 'Aktif' : 'Tidak Aktif'}.`, 'success');
            } catch (error: any) {
                updateToast(toastId, `Gagal mengubah status: ${error.message}`, 'error');
            } finally {
                setUserToToggleStatus(null);
                setIsSavingUser(false);
            }
        }
    };
    const usersWithStore = useMemo(() => users.map(user => ({
        ...user,
        storeName: stores.find(s => s.id === user.storeId)?.name || 'N/A'
    })), [users, stores]);

    type UserWithStore = (typeof usersWithStore)[0];

    const filteredUsers = useMemo(() => usersWithStore.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [usersWithStore, searchTerm]);

    const { items: sortedUsers, requestSort, sortConfig } = useSortableData<UserWithStore>(filteredUsers);
    
    const getSortIcon = (key: keyof UserWithStore) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
        return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
    };



    return (
        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            {isSavingUser && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/60 flex items-center justify-center rounded-lg z-20">
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">Memproses...</span>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Pengguna</h1>
                <div className="w-full md:w-auto flex items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari pengguna..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <button onClick={handleAddUser} className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Tambah Pengguna
                    </button>
                </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3"><button onClick={() => requestSort('name')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Nama {getSortIcon('name')}</button></th>
                            <th className="px-4 py-3"><button onClick={() => requestSort('role')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Peran {getSortIcon('role')}</button></th>
                             {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                                <th className="px-4 py-3"><button onClick={() => requestSort('storeName')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Cabang {getSortIcon('storeName')}</button></th>
                             )}
                            <th className="px-4 py-3"><button onClick={() => requestSort('isActive')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Status {getSortIcon('isActive')}</button></th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.length > 0 ? (
                            sortedUsers.map(user => {
                                const isSuperAdmin = user.role === UserRole.SuperAdmin;
                                return (
                                    <tr key={user.id} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{user.name}</td>
                                        <td className="px-4 py-3">{user.role}</td>
                                        {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                                            <td className="px-4 py-3">{user.role !== UserRole.SuperAdmin ? user.storeName : '-'}</td>
                                        )}
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-sm font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex items-center space-x-2">
                                            <button onClick={() => handleOpenFormModal(user)} title="Edit" className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                            <button 
                                                onClick={() => handleToggleStatus(user)} 
                                                title={isSuperAdmin ? "Super Admin tidak bisa dinonaktifkan" : (user.isActive ? "Nonaktifkan" : "Aktifkan")} 
                                                disabled={isSuperAdmin}
                                                className={`p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${user.isActive ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-500 dark:hover:text-yellow-400' : 'text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                <PowerIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 5 : 4}>
                                    <EmptyState
                                        icon={<UsersIcon className="mx-auto w-12 h-12 text-slate-400" />}
                                        title={searchTerm ? 'Pengguna Tidak Ditemukan' : 'Belum Ada Pengguna'}
                                        description={searchTerm ? 'Coba kata kunci lain atau tambahkan pengguna baru.' : 'Mulai dengan menambahkan pengguna pertama Anda.'}
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                 {sortedUsers.length > 0 ? (
                    sortedUsers.map(user => {
                        const isSuperAdmin = user.role === UserRole.SuperAdmin;
                        return (
                            <div key={user.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{user.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{user.role}</p>
                                        {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && user.role !== UserRole.SuperAdmin && (
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{user.storeName}</p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                        {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-2 border-t dark:border-slate-600 pt-2">
                                    <button onClick={() => { setCurrentUserToEdit(user); setIsFormModalOpen(true); }} title="Edit" className="p-2 rounded-md text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-600"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => setUserToToggleStatus(user)} title={isSuperAdmin ? "Super Admin tidak bisa dinonaktifkan" : (user.isActive ? "Nonaktifkan" : "Aktifkan")} disabled={isSuperAdmin} className={`p-2 rounded-md ${user.isActive ? 'text-yellow-600' : 'text-green-600'} hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50`}><PowerIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <EmptyState
                        icon={<UsersIcon className="mx-auto w-12 h-12 text-slate-400" />}
                        title={searchTerm ? 'Pengguna Tidak Ditemukan' : 'Belum Ada Pengguna'}
                        description={searchTerm ? 'Coba kata kunci lain atau tambahkan pengguna baru.' : 'Mulai dengan menambahkan pengguna pertama Anda.'}
                    />
                )}
            </div>

            {isFormModalOpen && (
                <UserFormModal 
                    user={currentUserToEdit} 
                    onClose={handleCloseFormModal}
                    onSave={handleSaveUser}
                    stores={stores.filter(s => s.isActive)}
                />
            )}


            {userToToggleStatus && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setUserToToggleStatus(null)}
                    onConfirm={confirmToggleStatus}
                    title={`${userToToggleStatus.isActive ? 'Nonaktifkan' : 'Aktifkan'} Pengguna`}
                    message={`Apakah Anda yakin ingin ${userToToggleStatus.isActive ? 'menonaktifkan' : 'mengaktifkan'} pengguna "${userToToggleStatus.name}"?`}
                    confirmText={userToToggleStatus.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    confirmColor={userToToggleStatus.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}
                />
            )}
        </div>
    );
};

export default UsersPage;