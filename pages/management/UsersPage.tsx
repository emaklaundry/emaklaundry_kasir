import React, { useState, useMemo } from 'react';
import { User, UserRole, Store } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, PowerIcon, UsersIcon, SearchIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useStores } from '../../contexts/StoreContext';
import { useAppContext } from '../../contexts/AppContext';
import UserFormModal from '../../components/UserFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';

const UsersPage: React.FC = () => {
    const { currentUser, users, allUsers, setAllUsers, setCurrentUser, selectedStoreId } = useAppContext();
    const { stores } = useStores();
    const { addAuditLog } = useAuditLogs();
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenFormModal = (user: User | null = null) => {
        setCurrentUserToEdit(user);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentUserToEdit(null);
    };

    const handleSaveUser = (user: Omit<User, 'id'>) => {
        const updatedUser = { ...(currentUserToEdit || {}), ...user, id: currentUserToEdit?.id || Date.now() } as User;
        
        if (currentUserToEdit) {
            setAllUsers(prev => prev.map(u => u.id === currentUserToEdit.id ? updatedUser : u));
            addAuditLog(`Memperbarui data pengguna: "${user.name}".`);
        } else {
            setAllUsers(prev => [...prev, updatedUser]);
            addAuditLog(`Menambahkan pengguna baru: "${user.name}".`);
        }

        // If the user being edited is the currently logged-in user, update their session
        if(currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }

        handleCloseFormModal();
    };

    const handleDelete = (user: User) => {
        if (user.role === UserRole.SuperAdmin) return;
        setUserToDelete(user);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            // If deleting the current user, log them out or switch to a default user.
            if (currentUser.id === userToDelete.id) {
                const superAdmin = allUsers.find(u => u.role === UserRole.SuperAdmin && u.id !== userToDelete.id);
                const nextUser = superAdmin || allUsers.find(u => u.id !== userToDelete.id);
                if (nextUser) {
                    setCurrentUser(nextUser);
                } else {
                    // This would only happen if the last user is deleted.
                    alert("Tidak bisa menghapus pengguna terakhir.");
                    setUserToDelete(null);
                    return;
                }
            }
            setAllUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            addAuditLog(`Menghapus pengguna: "${userToDelete.name}".`);
            setUserToDelete(null);
        }
    };

    const handleToggleStatus = (user: User) => {
        if (user.role === UserRole.SuperAdmin) return;
        setUserToToggleStatus(user);
    };

    const confirmToggleStatus = () => {
        if (userToToggleStatus) {
            const newStatus = !userToToggleStatus.isActive;
            setAllUsers(prev => prev.map(u => u.id === userToToggleStatus.id ? { ...u, isActive: newStatus } : u));
            addAuditLog(`Mengubah status pengguna "${userToToggleStatus.name}" menjadi ${newStatus ? 'Aktif' : 'Tidak Aktif'}.`);
            setUserToToggleStatus(null);
        }
    };
    
    const usersWithStore = useMemo(() => users.map(user => ({
        ...user,
        storeName: stores.find(s => s.id === user.storeId)?.name || 'N/A'
    })), [users, stores]);

    const filteredUsers = useMemo(() => usersWithStore.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [usersWithStore, searchTerm]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
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
                    <button onClick={() => handleOpenFormModal()} className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Tambah Pengguna
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Peran</th>
                             {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                                <th className="px-4 py-3">Cabang</th>
                             )}
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => {
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
                                            <button 
                                                onClick={() => handleDelete(user)} 
                                                title={isSuperAdmin ? "Super Admin tidak bisa dihapus" : "Hapus"} 
                                                disabled={isSuperAdmin}
                                                className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Trash2Icon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                             <tr>
                                <td colSpan={currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 5 : 4} className="text-center py-12">
                                    <UsersIcon className="mx-auto w-12 h-12 text-slate-400" />
                                    <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">{searchTerm ? 'Pengguna Tidak Ditemukan' : 'Belum Ada Pengguna'}</h3>
                                    <p className="mt-1 text-base text-slate-500">{searchTerm ? 'Coba kata kunci lain atau tambahkan pengguna baru.' : 'Mulai dengan menambahkan pengguna pertama Anda.'}</p>
                                    <div className="mt-6">
                                        <button onClick={() => handleOpenFormModal()} className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto">
                                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                                            Tambah Pengguna
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <UserFormModal 
                    user={currentUserToEdit} 
                    onClose={handleCloseFormModal}
                    onSave={handleSaveUser}
                    stores={stores.filter(s => s.isActive)}
                />
            )}

            {userToDelete && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setUserToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Pengguna"
                    message={`Apakah Anda yakin ingin menghapus pengguna "${userToDelete.name}"?`}
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