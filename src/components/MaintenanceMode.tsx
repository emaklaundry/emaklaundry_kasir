import React from 'react';
import { Wrench, AlertTriangle, LogOut } from 'lucide-react';

interface MaintenanceModeProps {
  message?: string;
  onLogout?: () => void;
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ message, onLogout }) => {
  const defaultMessage = 'Sistem sedang dalam perbaikan. Mohon tunggu beberapa saat.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header dengan gradient */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-full p-6 shadow-lg">
                <Wrench className="h-16 w-16 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Mode Pemeliharaan</h1>
            <p className="text-yellow-100 text-lg">Maintenance Mode</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Alert Message */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                    Sistem Tidak Tersedia Sementara
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm leading-relaxed">
                    {message || defaultMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mr-3">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                    Apa yang sedang terjadi?
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Tim kami sedang melakukan pemeliharaan dan perbaikan sistem untuk meningkatkan
                    performa dan keamanan aplikasi.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2 mr-3">
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                    Kapan sistem akan kembali normal?
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Pemeliharaan biasanya memakan waktu 15-30 menit. Silakan coba kembali beberapa
                    saat lagi.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2 mr-3">
                  <svg
                    className="h-5 w-5 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                    Data Anda Aman
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Semua data transaksi dan informasi Anda tersimpan dengan aman. Tidak ada data
                    yang akan hilang.
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              {onLogout ? (
                <button
                  onClick={onLogout}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout & Kembali ke Login</span>
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Muat Ulang Halaman</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Terima kasih atas kesabaran Anda 🙏
            </p>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-bounce" />
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-bounce delay-100" />
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-bounce delay-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
