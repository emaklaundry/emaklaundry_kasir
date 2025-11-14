import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-lg p-2 sm:p-4 mx-0 sm:mx-4 bg-white rounded-t-2xl sm:rounded-lg shadow-lg dark:bg-slate-800 flex flex-col"
        style={{ maxHeight: '95vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-2 border-b rounded-t dark:border-slate-700">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button
            type="button"
            className="text-slate-400 bg-transparent hover:bg-slate-200 hover:text-slate-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-slate-600 dark:hover:text-white"
            onClick={onClose}
          >
            <svg
              className="w-3 h-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end p-2 space-x-2 border-t border-slate-200 rounded-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
