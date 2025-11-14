/* global setTimeout, clearTimeout */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    let handler: ReturnType<typeof setTimeout> | undefined;
    if (typeof setTimeout !== 'undefined' && typeof clearTimeout !== 'undefined') {
      handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
    } else {
      Promise.resolve().then(() => setDebouncedValue(value));
    }

    return () => {
      if (typeof clearTimeout !== 'undefined' && handler) {
        clearTimeout(handler);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
