import React from 'react';
import { Wrench, Info, Clock, ShieldCheck, LogOut, RefreshCw } from 'lucide-react';

interface MaintenanceModeProps {
  message?: string;
  onLogout?: () => void;
}

const INFO_ITEMS = [
  {
    icon: Info,
    title: 'Apa yang sedang terjadi?',
    body: 'Tim kami sedang melakukan pemeliharaan dan perbaikan sistem untuk meningkatkan performa dan keamanan aplikasi.',
  },
  {
    icon: Clock,
    title: 'Kapan sistem akan kembali normal?',
    body: 'Pemeliharaan biasanya memakan waktu 15-30 menit. Silakan coba kembali beberapa saat lagi.',
  },
  {
    icon: ShieldCheck,
    title: 'Data Anda Aman',
    body: 'Semua data transaksi dan informasi Anda tersimpan dengan aman. Tidak ada data yang akan hilang.',
  },
] as const;

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ message, onLogout }) => {
  const defaultMessage = 'Sistem sedang dalam perbaikan. Mohon tunggu beberapa saat.';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-zinc-950">
      <main className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="space-y-6 p-6 sm:p-8">
          <header className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Wrench className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Mode Pemeliharaan
              </h1>
              <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300" role="status">
                {message || defaultMessage}
              </p>
            </div>
          </header>

          <ul className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-700">
            {INFO_ITEMS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="font-medium text-slate-800 dark:text-slate-200">{title}</h2>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {onLogout ? (
            <button onClick={onLogout} className="btn btn-primary w-full">
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Logout & Kembali ke Login
            </button>
          ) : (
            <button onClick={() => window.location.reload()} className="btn btn-primary w-full">
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
              Muat Ulang Halaman
            </button>
          )}
        </div>

        <p className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
          Terima kasih atas kesabaran Anda.
        </p>
      </main>
    </div>
  );
};

export default MaintenanceMode;
