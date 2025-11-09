
import React, { useState } from 'react';
import { mockUsers } from '../../data/mockData';
import { User, UserRole } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon } from '../../components/icons';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleOpenFormModal = (user: User | null = null) => {
        setCurrentUser(user);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentUser(null);
    };

    const handleSaveUser = (user: User) => {
        if (currentUser && currentUser.id) {
            setUsers(users.map(u => u.id === user.id ? user : u));
        } else {
            setUsers([...users, { ...user, id: Date.now() }]);
        }
        handleCloseFormModal();
    };

    const handleDelete = (user: User) => {
        setUserToDelete(user);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            setUsers(users.filter(u => u.id !== userToDelete.id));
            setUserToDelete(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Pengguna</h1>
                <button onClick={() => handleOpenFormModal()} className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Tambah Pengguna
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Peran</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b dark:border-slate-700">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{user.name}</td>
                                <td className="px-4 py-3">{user.role}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-sm font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                        {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 flex items-center space-x-2">
                                    <button onClick={() => handleOpenFormModal(user)} className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(user)} className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <UserFormModal 
                    user={currentUser} 
                    onClose={handleCloseFormModal}
                    onSave={handleSaveUser}
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
        </div>
    );
};

// Form modal sub-component
const UserFormModal: React.FC<{ user: User | null, onClose: () => void, onSave: (user: User) => void }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<User, 'id'>>({
        name: user?.name || '',
        role: user?.role || UserRole.Cashier,
        isActive: user?.isActive ?? true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
          const checked = (e.target as HTMLInputElement).checked;
          setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
          setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: user?.id || 0 });
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            footer={
                <>
                    <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 focus:outline-none hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600 dark:hover:text-white">Batal</button>
                    <button onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
                </>
            }
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nama Pengguna</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                 <div>
                    <label htmlFor="role" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Peran</label>
                    <select name="role" id="role" value={formData.role} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
                <div className="flex items-center">
                    <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600" />
                    <label htmlFor="isActive" className="ml-2 text-base font-medium text-slate-900 dark:text-slate-300">Aktif</label>
                </div>
            </form>
        </Modal>
    );
};

export default UsersPage;