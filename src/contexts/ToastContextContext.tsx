import { createContext } from 'react';
import type { ToastContextType } from './ToastContext';

const ToastContext = createContext<ToastContextType | undefined>(undefined);
export default ToastContext;
