import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTutorial } from '../../hooks/useTutorial';

const Tutorial: React.FC = () => {
  const { run, steps, stepIndex, setStepIndex, stopTour } = useTutorial();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const theme = isDarkMode ? 'dark' : 'light';

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      stopTour();
    } else if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#3b82f6', // Blue-500
          textColor: theme === 'dark' ? '#fff' : '#333',
          backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
          arrowColor: theme === 'dark' ? '#1e293b' : '#fff',
        },
        tooltip: {
            borderRadius: '0.5rem',
        },
        buttonNext: {
            backgroundColor: '#3b82f6',
            borderRadius: '0.375rem',
            padding: '0.5rem 1rem',
        },
        buttonBack: {
            color: theme === 'dark' ? '#94a3b8' : '#64748b',
        }
      }}
      locale={{
        back: 'Kembali',
        close: 'Tutup',
        last: 'Selesai',
        next: 'Lanjut',
        skip: 'Lewati',
      }}
    />
  );
};

export default Tutorial;
