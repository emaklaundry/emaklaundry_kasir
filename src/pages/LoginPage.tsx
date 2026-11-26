import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuditLogs } from '../contexts/AuditLogContext';
import pkg from '../../package.json';
import {
  EmployeeLoginProfile,
  isEmployeeLoginProfilesResponse,
  isEmployeeLoginResponse,
  isValidEmployeePin,
} from '../utils/employeeAuth';

const APP_VERSION = `v${pkg.version}`;

const LoginPage: React.FC = () => {
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profiles, setProfiles] = useState<EmployeeLoginProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { addAuditLog } = useAuditLogs();

  useEffect(() => {
    document.title = 'Masuk | Laundry POS';
  }, []);

  useEffect(() => {
    let active = true;

    const loadProfiles = async () => {
      try {
        const { data, error: invokeError } = await supabase.functions.invoke('employee-login', {
          body: { action: 'list' },
        });
        if (invokeError || !isEmployeeLoginProfilesResponse(data)) {
          throw invokeError ?? new Error('Invalid employee profile response');
        }
        if (active) setProfiles(data.profiles);
      } catch {
        if (active) setProfileError('Profil karyawan gagal dimuat. Silakan coba lagi.');
      } finally {
        if (active) setProfilesLoading(false);
      }
    };

    loadProfiles();
    return () => {
      active = false;
    };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) {
        setError(loginError.message);
        addAuditLog(`Percobaan login gagal untuk email: ${email}.`);
      } else if (data.user) {
        addAuditLog(`Login berhasil: ${data.user.email || email}.`);
      }
    } catch {
      setError('Login gagal. Periksa koneksi internet dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedProfileId || !isValidEmployeePin(pin)) {
      setError('Pilih profil dan masukkan PIN 6 digit.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('employee-login', {
        body: { action: 'login', employeeId: selectedProfileId, pin },
      });
      if (invokeError || !isEmployeeLoginResponse(data)) {
        throw invokeError ?? new Error('Invalid employee login response');
      }

      const { error: sessionError } = await supabase.auth.setSession(data.session);
      if (sessionError) throw sessionError;
      const employee = profiles.find((profile) => profile.id === selectedProfileId);
      addAuditLog(`Login karyawan berhasil${employee ? `: ${employee.name}` : ''}.`);
    } catch {
      setError('Profil atau PIN tidak valid. Periksa kembali dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <section className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h1
            id="login-heading"
            className="text-xl sm:text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white"
          >
            Masuk ke Akun Anda
          </h1>

          {isAdminLogin ? (
            <form
              aria-labelledby="login-heading"
              onSubmit={handleAdminLogin}
              className="space-y-5"
              method="post"
            >
              <div>
                <label htmlFor="login-email" className="form-label">
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input px-4 py-3"
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password" className="form-label">
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input px-4 py-3"
                  required
                />
              </div>
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/60 dark:bg-red-900/20"
                >
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          ) : (
            <form
              aria-label="Login karyawan"
              onSubmit={handleEmployeeLogin}
              className="space-y-5"
              method="post"
            >
              <fieldset>
                <legend className="block mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Pilih profil karyawan
                </legend>
                {profilesLoading ? (
                  <p role="status" aria-busy="true" className="text-sm text-slate-500">
                    Memuat profil...
                  </p>
                ) : profiles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {profiles.map((profile) => (
                      <label
                        key={profile.id}
                        className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                          selectedProfileId === profile.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                            : 'border-slate-200 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="employee-profile"
                          value={profile.id}
                          checked={selectedProfileId === profile.id}
                          onChange={() => {
                            setSelectedProfileId(profile.id);
                            setError(null);
                          }}
                          className="h-4 w-4 shrink-0 accent-orange-500"
                        />
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        >
                          {profile.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                            {profile.name}
                          </span>
                          {profile.storeName && (
                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                              {profile.storeName}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Belum ada profil karyawan yang dapat login.
                  </p>
                )}
              </fieldset>
              {profileError && (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {profileError}
                </p>
              )}
              <div>
                <label htmlFor="employee-pin" className="form-label">
                  PIN (6 digit)
                </label>
                <input
                  id="employee-pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError(null);
                  }}
                  className="form-input px-4 py-3"
                  required
                />
              </div>
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/60 dark:bg-red-900/20"
                >
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading || profilesLoading || profiles.length === 0}
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setIsAdminLogin((current) => !current);
              setError(null);
            }}
            className="mt-4 w-full text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            {isAdminLogin ? 'Kembali ke login karyawan' : 'Masuk sebagai Super Admin'}
          </button>
          <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400">
            Sistem login aman dengan enkripsi end-to-end
          </p>
        </section>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; 2025 Laundry Management System. Developed by{' '}
            <a
              href="https://novionics.web.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              Novionics
            </a>
          </p>
        </div>
      </div>

      <div className="fixed right-3 bottom-2 z-50 text-xs text-slate-500 opacity-70 pointer-events-none select-none">
        {APP_VERSION}
      </div>
    </main>
  );
};

export default LoginPage;
