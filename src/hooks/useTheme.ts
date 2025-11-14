import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';
const THEME_KEY = 'laundry_theme';

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
};
