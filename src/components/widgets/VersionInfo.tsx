import React from 'react';
// Versi di-inject saat build oleh Vite (lihat patch di bawah)
const version = import.meta.env.VITE_APP_VERSION || 'dev';

const VersionInfo: React.FC = () => (
  <div className="text-xs text-slate-400 text-center py-2 select-none">v{version}</div>
);

export default VersionInfo;
