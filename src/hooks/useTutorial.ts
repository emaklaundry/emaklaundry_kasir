import { useContext } from 'react';
import { TutorialContext } from '../contexts/TutorialContextContext';

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
