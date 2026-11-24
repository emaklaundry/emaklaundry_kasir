import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuditLogs } from '../contexts/AuditLogContext';
import pkg from '../../package.json';

const APP_VERSION = `v${pkg.version}`;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { addAuditLog } = useAuditLogs();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      addAuditLog(`Percobaan login gagal untuk email: ${email}.`);
    } else if (data.user) {
      addAuditLog(`Login berhasil: ${data.user.email || email}.`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
            Masuk ke Akun Anda
          </h2>

          {/* Email Input */}
          <div className="mb-5">
            <label
              htmlFor="login-email"
              className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
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
              className="w-full px-4 py-3 text-base rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20 dark:focus:ring-blue-500/20 transition-all outline-none"
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label
              htmlFor="login-password"
              className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
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
              className="w-full px-4 py-3 text-base rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20 dark:focus:ring-blue-500/20 transition-all outline-none"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white font-semibold py-3.5 rounded-lg shadow-md hover:shadow-lg disabled:from-blue-400 disabled:to-blue-500 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>

          {/* Additional Info */}
          <p className="mt-6 text-xs text-center text-slate-500 dark:text-slate-400">
            Sistem login aman dengan enkripsi end-to-end
          </p>
        </form>

        {/* Footer Info */}
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

      {/* Version Info - Consistent with website style */}
      <div className="fixed right-3 bottom-2 z-50 text-xs text-slate-500 opacity-70 pointer-events-none select-none">
        {APP_VERSION}
      </div>
    </div>
  );
};

export default LoginPage;
