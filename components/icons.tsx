
import React from 'react';

// A generic icon wrapper
const Icon: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></Icon>
);

export const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></Icon>
);

export const PackageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z" /><path d="M16.5 9.4L21 12.9" /><path d="M16.5 9.4L21 6" /><path d="M16.5 9.4l-9 6.5" /><path d="M7.5 15.9l-5-3.4" /><path d="M7.5 15.9V21" /><path d="M7.5 15.9l9-6.5" /><path d="m12 12.5 4.5 3.4" /><path d="M12 12.5V17" /><path d="M12 12.5L7.5 9" /><path d="m3.5 9 4 3.5" /></Icon>
);

export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>
);

export const BarChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></Icon>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icon>
);

export const WrenchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></Icon>
);

export const TruckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></Icon>
);

export const DollarSignIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Icon>
);

export const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Icon>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>
);

export const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></Icon>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Icon>
);

export const Trash2Icon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></Icon>
);

export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><polyline points="6 9 12 15 18 9" /></Icon>
);

export const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><polyline points="18 15 12 9 6 15" /></Icon>
);

export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><polyline points="15 18 9 12 15 6" /></Icon>
);

export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><polyline points="9 18 15 12 9 6" /></Icon>
);

export const PrinterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Icon>
);

export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Icon>
);

export const MoreVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></Icon>
);

export const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </Icon>
);

export const MessageSquareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>
);

export const PowerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></Icon>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Icon>
);