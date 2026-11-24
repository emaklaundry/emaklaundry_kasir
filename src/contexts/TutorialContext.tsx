import React, { useState } from 'react';
import { Step } from 'react-joyride';
import { dashboardSteps, newTransactionSteps, transactionListSteps, employeesSteps } from '../config/tutorialSteps';
import { TutorialContext, TourKey } from './TutorialContextContext';

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState<TourKey | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);

  // Function to load steps based on key
  const loadSteps = (key: TourKey) => {
    switch (key) {
      case 'dashboard':
        setSteps(dashboardSteps);
        break;
      case 'new_transaction':
        setSteps(newTransactionSteps);
        break;
      case 'transaction_list':
        setSteps(transactionListSteps);
        break;
      case 'employees':
        setSteps(employeesSteps);
        break;
      default:
        setSteps([]);
    }
  };

  const startTour = (key: TourKey) => {
    setTourKey(key);
    loadSteps(key);
    setStepIndex(0);
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
    setStepIndex(0);
    setTourKey(null);
  };

  return (
    <TutorialContext.Provider
      value={{
        run,
        steps,
        stepIndex,
        tourKey,
        startTour,
        stopTour,
        setStepIndex,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
