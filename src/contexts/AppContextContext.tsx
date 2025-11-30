import { createContext } from 'react';
import type { AppContextType } from './AppContext';

const AppContext = createContext<AppContextType | undefined>(undefined);
export default AppContext;
