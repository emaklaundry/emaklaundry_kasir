import React, { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <form onSubmit={handleLogin} className="bg-white dark:bg-slate-800 p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">Login</h2>
        <div className="mb-4">
          <label htmlFor="login-email" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 rounded border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="login-password" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 rounded border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
        {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg disabled:bg-blue-400"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
