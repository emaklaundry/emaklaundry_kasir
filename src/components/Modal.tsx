import React, { ReactNode, useEffect, useId, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog fixed inset-0 z-[60] m-0 h-full w-full max-h-none max-w-none items-end justify-center overflow-hidden border-0 bg-transparent p-0 sm:items-center"
      aria-labelledby={titleId}
      onClose={() => {
        if (isOpen) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      <div
        className="relative w-full max-w-lg mx-0 sm:mx-4 bg-white rounded-t-3xl sm:rounded-xl shadow-2xl dark:bg-slate-800 flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        <div className="flex items-start justify-between p-4 sm:p-5 border-b dark:border-slate-700 flex-shrink-0">
          <h2
            id={titleId}
            className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            className="text-slate-400 bg-transparent hover:bg-slate-200 hover:text-slate-900 rounded-lg text-sm w-10 h-10 sm:w-9 sm:h-9 ml-auto inline-flex justify-center items-center dark:hover:bg-slate-600 dark:hover:text-white touch-target"
            onClick={() => dialogRef.current?.close()}
          >
            <svg
              className="w-4 h-4 sm:w-3 sm:h-3"
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
            <span className="sr-only">Tutup dialog</span>
          </button>
        </div>
        <div
          className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto mobile-scroll flex-1"
          style={{ maxHeight: '65vh' }}
        >
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end p-3 sm:p-4 space-x-2 sm:space-x-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
};

export default Modal;
