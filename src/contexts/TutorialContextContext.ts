import { createContext } from 'react';
import { Step } from 'react-joyride';

export type TourKey = 'dashboard' | 'new_transaction' | 'transaction_list' | 'employees';

interface TutorialContextType {
  run: boolean;
  steps: Step[];
  stepIndex: number;
  tourKey: TourKey | null;
  startTour: (key: TourKey) => void;
  stopTour: () => void;
  setStepIndex: (index: number) => void;
}

export const TutorialContext = createContext<TutorialContextType | undefined>(undefined);
