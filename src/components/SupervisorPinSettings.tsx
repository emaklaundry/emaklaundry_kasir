import React, { useEffect, useId, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useToasts from '../contexts/useToasts';
import { KeyIcon } from './icons';
import {
  hasMySupervisorPin,
  isValidPinFormat,
  setMySupervisorPin,
} from '../utils/supervisorApproval';

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white';

/**
 * Admin / Super Admin mengatur PIN supervisor miliknya.
 * PIN dipakai untuk menyetujui diskon manual dan aksi sensitif Kasir.
 */
const SupervisorPinSettings: React.FC = () => {
  const { addToast } = useToasts();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinId = useId();
  const confirmId = useId();
  const passwordId = useId();
  const errorId = useId();

  useEffect(() => {
    let active = true;
    hasMySupervisorPin()
      .then((value) => active && setHasPin(value))
      .catch(() => active && setHasPin(false));
    return () => {
      active = false;
    };
  }, []);

  const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidPinFormat(pin)) return setError('PIN harus 6 angka.');
    if (pin !== confirmPin) return setError('Konfirmasi PIN tidak sama.');
    if (!password) return setError('Masukkan password akun Anda untuk konfirmasi.');

    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Sesi tidak valid. Silakan login ulang.');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (signInError) throw new Error('Password akun tidak sesuai.');

      await setMySupervisorPin(pin);
      setHasPin(true);
      setPin('');
      setConfirmPin('');
      setPassword('');
      addToast('PIN supervisor berhasil disimpan.', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan PIN.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="supervisor-pin-heading"
      className="mt-8 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900/40"
    >
      <div className="mb-4 flex items-start gap-3">
        <KeyIcon className="mt-1 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h2
            id="supervisor-pin-heading"
            className="text-xl font-bold text-slate-900 dark:text-white"
          >
            PIN Supervisor
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Dipakai untuk menyetujui diskon manual dan aksi sensitif yang dilakukan Kasir. Jangan
            bagikan PIN ini ke Kasir.
          </p>
          <p className="mt-2 text-sm font-medium">
            {hasPin === null ? (
              <span className="text-slate-500">Memeriksa status PIN…</span>
            ) : hasPin ? (
              <span className="text-green-700 dark:text-green-400">PIN sudah diatur.</span>
            ) : (
              <span className="text-amber-700 dark:text-amber-300">
                Belum ada PIN. Kasir tidak bisa meminta persetujuan Anda sampai PIN diatur.
              </span>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isSaving}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={pinId}
              className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
            >
              {hasPin ? 'PIN baru' : 'PIN'} (6 angka)
            </label>
            <input
              id={pinId}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={pin}
              disabled={isSaving}
              onChange={(e) => setPin(digitsOnly(e.target.value))}
              className={`${inputClass} font-mono tracking-[0.4em]`}
            />
          </div>
          <div>
            <label
              htmlFor={confirmId}
              className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
            >
              Ulangi PIN
            </label>
            <input
              id={confirmId}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={confirmPin}
              disabled={isSaving}
              onChange={(e) => setConfirmPin(digitsOnly(e.target.value))}
              className={`${inputClass} font-mono tracking-[0.4em]`}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor={passwordId}
            className="mb-2 block text-sm font-medium text-slate-900 dark:text-white"
          >
            Password akun Anda
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={isSaving}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-lg bg-amber-600 px-5 py-3 font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto touch-target"
        >
          {isSaving ? 'Menyimpan…' : hasPin ? 'Ganti PIN' : 'Simpan PIN'}
        </button>
      </form>
    </section>
  );
};

export default SupervisorPinSettings;
