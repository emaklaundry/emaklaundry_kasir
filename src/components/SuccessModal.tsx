import * as React from 'react';
import Modal from './Modal';

interface ActionButton {
    text: string;
    onClick: () => void;
    type: 'primary' | 'secondary';
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actions: ActionButton[];
}

function SuccessModal({ isOpen, onClose, title, message, actions }: SuccessModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end w-full space-x-4">
            {actions.map((action, index) => (
                <button 
                    key={index} 
                    onClick={action.onClick}
                    className={
                        action.type === 'primary' 
                        ? "text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3"
                        : "text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600"
                    }
                >
                    {action.text}
                </button>
            ))}
        </div>
      }
    >
        <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-green-100 rounded-full dark:bg-green-900">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-300">
                {message}
            </p>
      </div>
    </Modal>
  );
}

export default SuccessModal;
