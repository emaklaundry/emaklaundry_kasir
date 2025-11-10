// FIX: Import 'React' to bring the React namespace into scope, resolving the 'Cannot find namespace' error for React.Dispatch and React.SetStateAction.
import React, { useState, useEffect } from 'react';

type Reviver = (key: string, value: any) => any;

export function usePersistentState<T>(storageKey: string, defaultValue: T, reviver?: Reviver): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(storageKey);
      if (storedValue) {
        return JSON.parse(storedValue, reviver);
      }
    } catch (error) {
      console.error(`Error reading from localStorage for key "${storageKey}"`, error);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error(`Error writing to localStorage for key "${storageKey}"`, error);
    }
  }, [storageKey, state]);

  return [state, setState];
}