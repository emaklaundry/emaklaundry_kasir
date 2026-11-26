import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Modal from './Modal';
import { supabase } from '../utils/supabaseClient';
import useToasts from '../contexts/useToasts';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useAppContext from '../contexts/useAppContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToasts();
  const { addAuditLog } = useAuditLogs();
  const { currentUser } = useAppContext();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChanging, setIsChanging] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      addToast('Semua field harus diisi.', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      addToast('Password baru minimal 6 karakter.', 'error');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      addToast('Password baru dan konfirmasi tidak cocok.', 'error');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      addToast('Password baru harus berbeda dari password lama.', 'error');
      return;
    }

    setIsChanging(true);

    try {
      // Verifikasi password lama dengan mencoba sign in ulang
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        addToast('Sesi tidak valid. Silakan login ulang.', 'error');
        setIsChanging(false);
        return;
      }

      // Coba sign in dengan password lama untuk verifikasi
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword,
      });

      if (signInError) {
        addToast('Password lama tidak sesuai.', 'error');
        setIsChanging(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      addAuditLog(`Mengubah password akun.`, currentUser?.storeId || '');
      addToast('Password berhasil diubah!', 'success');

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onClose();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      addToast(`Gagal mengubah password: ${errMsg}`, 'error');
    } finally {
      setIsChanging(false);
    }
  };

  const handleClose = () => {
    if (!isChanging) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ubah Password"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isChanging}
            className="btn btn-secondary"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isChanging}
            className="btn btn-primary"
          >
            {isChanging ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Mengubah...
              </>
            ) : (
              'Ubah Password'
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password Lama */}
        <div>
          <label htmlFor="currentPassword" className="form-label">
            Password Lama <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              disabled={isChanging}
              className="form-input input-mobile"
              placeholder="Masukkan password lama"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={showCurrentPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-pressed={showCurrentPassword}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Password Baru */}
        <div>
          <label htmlFor="newPassword" className="form-label">
            Password Baru <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={isChanging}
              className="form-input input-mobile"
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-pressed={showNewPassword}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Minimal 6 karakter</p>
        </div>

        {/* Konfirmasi Password Baru */}
        <div>
          <label htmlFor="confirmPassword" className="form-label">
            Konfirmasi Password Baru <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isChanging}
              className="form-input input-mobile"
              placeholder="Ketik ulang password baru"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-pressed={showConfirmPassword}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Info keamanan */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            <strong>Tips keamanan:</strong> Gunakan kombinasi huruf besar, huruf kecil, angka, dan
            simbol untuk password yang lebih aman.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
