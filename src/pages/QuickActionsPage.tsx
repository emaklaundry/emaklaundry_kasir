import { Link } from 'react-router-dom';
import { PlusIcon, UsersIcon, ReceiptIcon } from '@/components/icons';

export default function QuickActionsPage() {
  const actions = [
    {
      label: 'Transaksi Baru',
      to: '/transactions/new',
      icon: PlusIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      label: 'Daftar Transaksi',
      to: '/transactions',
      icon: ReceiptIcon,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      label: 'Tambah Pelanggan',
      to: '/customers',
      icon: UsersIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Aksi Cepat</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`${action.color} text-white rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-lg transition-transform transform hover:scale-105`}
          >
            <action.icon className="w-10 h-10 mb-2" />
            <span className="text-lg font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
