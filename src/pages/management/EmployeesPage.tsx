import React, { useState, useEffect } from 'react';
import { useEmployees } from '../../contexts/EmployeeContext';
import useAppContext from '../../contexts/useAppContext';
import useToasts from '../../contexts/useToasts';
import Modal from '../../components/Modal';
import { Employee, EmployeeFormData, EmployeeRole } from '../../types/hrm';
import { PlusCircleIcon, EditIcon, TrashIcon, UserIcon } from '../../components/icons';
import { formatRupiah } from '../../utils/formatting';

const EmployeesPage: React.FC = () => {
  const { employees, isLoading, fetchEmployees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { selectedStoreId } = useAppContext();
  const { addToast } = useToasts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    storeId: selectedStoreId || '',
    name: '',
    phone: '',
    role: 'operator',
    baseSalary: 0,
    commissionRate: 0,
    isActive: true,
  });

  useEffect(() => {
    if (selectedStoreId) {
      fetchEmployees(selectedStoreId);
    }
  }, [selectedStoreId, fetchEmployees]);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        storeId: employee.storeId,
        name: employee.name,
        phone: employee.phone || '',
        role: employee.role,
        baseSalary: employee.baseSalary,
        commissionRate: employee.commissionRate,
        isActive: employee.isActive,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        storeId: selectedStoreId || '',
        name: '',
        phone: '',
        role: 'operator',
        baseSalary: 0,
        commissionRate: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast('Nama karyawan wajib diisi', 'error');
      return;
    }

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
        addToast('Data karyawan berhasil diupdate', 'success');
      } else {
        await addEmployee(formData);
        addToast('Karyawan baru berhasil ditambahkan', 'success');
      }
      handleCloseModal();
    } catch {
      addToast('Gagal menyimpan data karyawan', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus karyawan "${name}"?`)) {
      await deleteEmployee(id);
      addToast('Karyawan berhasil dihapus', 'success');
    }
  };

  const getRoleBadge = (role: EmployeeRole) => {
    const styles = {
      operator: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      kasir: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manajemen Karyawan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kelola data karyawan dan komisi
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Tambah Karyawan</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 mt-3">Memuat data...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <UserIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Belum ada data karyawan</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            + Tambah Karyawan Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {employee.phone || '-'}
                    </p>
                  </div>
                </div>
                {getRoleBadge(employee.role)}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Gaji Pokok</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    Rp {formatRupiah(employee.baseSalary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Komisi</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {employee.commissionRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <span className={`font-medium ${employee.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {employee.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleOpenModal(employee)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  <EditIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(employee.id, employee.name)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employee Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
        footer={
          <>
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium dark:bg-slate-700 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              {editingEmployee ? 'Update' : 'Simpan'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nama Karyawan *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Masukkan nama"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nomor HP
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Posisi
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            >
              <option value="operator">Operator</option>
              <option value="kasir">Kasir</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gaji Pokok (Rp)
              </label>
              <input
                type="number"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Komisi (%)
              </label>
              <input
                type="number"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
              Karyawan Aktif
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeesPage;
