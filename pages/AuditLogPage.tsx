import React, { useState } from 'react';
import { mockAuditLogs } from '../data/mockData';
import { AuditLog } from '../types';

const AuditLogPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Log Audit</h1>
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Waktu</th>
                            <th className="px-4 py-3">Pengguna</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="border-b dark:border-slate-700">
                                <td className="px-4 py-3">{log.timestamp.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3">{log.user}</td>
                                <td className="px-4 py-3">{log.action}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogPage;