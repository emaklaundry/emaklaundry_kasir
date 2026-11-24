import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';
const THEME_KEY = 'laundry_theme';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  try {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
  } catch (error) {
    console.warn('Theme preference could not be read from localStorage:', error);
  }

  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.warn('Theme preference could not be saved to localStorage:', error);
    }
  }, [theme]);

  return { theme, setTheme };
};

export default useTheme;
