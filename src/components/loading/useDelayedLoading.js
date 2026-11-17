import { useState, useEffect } from 'react';

/**
 * Delays loading state display by delayMs (default: 200ms)
 * to prevent flickering for fast operations (<200ms).
 */
export function useDelayedLoading(isLoading, delayMs = 200) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => setShowLoading(true), delayMs);
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);

  return showLoading;
}
