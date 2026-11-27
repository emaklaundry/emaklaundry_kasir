import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuditLogs } from '../contexts/AuditLogContext';
import pkg from '../../package.json';
import {
  EmployeeLoginProfile,
  isEmployeeLoginProfilesResponse,
  isEmployeeLoginResponse,
  isValidEmployeePin,
} from '../utils/employeeAuth';
import {
  getInitials,
  readLastProfileId,
  saveLastProfileId,
  translateAuthError,
} from '../utils/loginHelpers';

const APP_VERSION = `v${pkg.version}`;
const SEARCH_THRESHOLD = 6;
const PIN_LENGTH = 6;

const LoginPage: React.FC = () => {
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profiles, setProfiles] = useState<EmployeeLoginProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [search, setSearch] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const pinInputRef = useRef<HTMLInputElement>(null);
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
        if (!active) return;
        setProfiles(data.profiles);
        const lastId = readLastProfileId();
        if (lastId && data.profiles.some((profile) => profile.id === lastId)) {
          setSelectedProfileId((current) => current || lastId);
        }
      } catch {
        if (active) setProfileError('Profil karyawan gagal dimuat. Periksa koneksi internet.');
      } finally {
        if (active) setProfilesLoading(false);
      }
    };

    loadProfiles();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const retryLoadProfiles = () => {
    setProfileError(null);
    setProfilesLoading(true);
    setReloadKey((key) => key + 1);
  };

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter(
      (profile) =>
        profile.name.toLowerCase().includes(query) ||
        (profile.storeName ?? '').toLowerCase().includes(query),
    );
  }, [profiles, search]);

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
        setError(translateAuthError(loginError));
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

  const submitEmployeeLogin = async (profileId: string, employeePin: string) => {
    if (submittingRef.current) return;
    setError(null);
    if (!profileId || !isValidEmployeePin(employeePin)) {
      setError('Pilih profil dan masukkan PIN 6 digit.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('employee-login', {
        body: { action: 'login', employeeId: profileId, pin: employeePin },
      });
      if (invokeError || !isEmployeeLoginResponse(data)) {
        throw invokeError ?? new Error('Invalid employee login response');
      }

      const { error: sessionError } = await supabase.auth.setSession(data.session);
      if (sessionError) throw sessionError;
      saveLastProfileId(profileId);
      const employee = profiles.find((profile) => profile.id === profileId);
      addAuditLog(`Login karyawan berhasil${employee ? `: ${employee.name}` : ''}.`);
    } catch {
      setError('Profil atau PIN tidak valid. Periksa kembali dan coba lagi.');
      setPin('');
      pinInputRef.current?.focus();
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void submitEmployeeLogin(selectedProfileId, pin);
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setError(null);
    pinInputRef.current?.focus();
    if (pin.length === PIN_LENGTH) void submitEmployeeLogin(profileId, pin);
  };

  const handlePinChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    setError(null);
    if (digits.length === PIN_LENGTH && selectedProfileId) {
      void submitEmployeeLogin(selectedProfileId, digits);
    }
  };

  const showSearch = profiles.length > SEARCH_THRESHOLD;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-8 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center gap-2">
          <img
            src="/apple-touch-icon.png"
            alt="Emak Laundry"
            width={80}
            height={80}
            className="h-20 w-20 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:ring-zinc-700"
          />
        </div>

        <section className="card p-6 sm:p-8">
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
                {showSearch && (
                  <div className="mb-3">
                    <label htmlFor="profile-search" className="sr-only">
                      Cari profil karyawan
                    </label>
                    <input
                      id="profile-search"
                      type="search"
                      placeholder="Cari nama karyawan…"
                      autoComplete="off"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="form-input px-4 py-2.5"
                    />
                  </div>
                )}
                {profilesLoading ? (
                  <div role="status" aria-busy="true" className="grid grid-cols-2 gap-3 p-1">
                    <span className="sr-only">Memuat profil...</span>
                    {Array.from({ length: 4 }, (_, index) => (
                      <div
                        key={index}
                        aria-hidden="true"
                        className="flex animate-pulse flex-col items-center gap-2 rounded-lg border-2 border-slate-100 p-3 sm:flex-row sm:gap-3 dark:border-zinc-800"
                      >
                        <span className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-700" />
                        <span className="h-3 w-3/4 rounded bg-slate-200 sm:w-full dark:bg-zinc-700" />
                      </div>
                    ))}
                  </div>
                ) : profileError ? (
                  <div
                    role="alert"
                    className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800/60 dark:bg-red-900/20"
                  >
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{profileError}</p>
                    <button type="button" onClick={retryLoadProfiles} className="btn btn-secondary">
                      Coba lagi
                    </button>
                  </div>
                ) : profiles.length > 0 ? (
                  filteredProfiles.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                      {filteredProfiles.map((profile) => {
                        const selected = selectedProfileId === profile.id;
                        return (
                          <label
                            key={profile.id}
                            title={profile.name}
                            className={`flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-colors focus-within:ring-2 focus-within:ring-orange-400 focus-within:ring-offset-1 sm:flex-row sm:gap-3 sm:text-left ${
                              selected
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                                : 'border-slate-200 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-400'
                            }`}
                          >
                            <input
                              type="radio"
                              name="employee-profile"
                              value={profile.id}
                              checked={selected}
                              onChange={() => handleSelectProfile(profile.id)}
                              className="sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                selected
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {getInitials(profile.name)}
                            </span>
                            <span className="w-full min-w-0">
                              <span className="block break-words text-sm font-medium leading-snug text-slate-900 line-clamp-2 dark:text-white">
                                {profile.name}
                              </span>
                              {profile.storeName && (
                                <span className="mt-0.5 block break-words text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
                                  {profile.storeName}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      Tidak ada karyawan bernama “{search.trim()}”.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Belum ada profil karyawan yang dapat login.
                  </p>
                )}
              </fieldset>
              <div>
                <label htmlFor="employee-pin" className="form-label">
                  PIN (6 digit)
                </label>
                <input
                  ref={pinInputRef}
                  id="employee-pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  enterKeyHint="go"
                  pattern="[0-9]{6}"
                  minLength={PIN_LENGTH}
                  maxLength={PIN_LENGTH}
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  readOnly={loading}
                  className="form-input px-4 py-3 text-center text-lg tracking-[0.5em]"
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
            Koneksi aman terenkripsi
          </p>
        </section>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Laundry Management System. Developed by{' '}
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
