import { useContext } from 'react';
import ToastContext from './ToastContextContext';
import type { ToastContextType } from './ToastContext';

const useToasts = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
};

export default useToasts;
