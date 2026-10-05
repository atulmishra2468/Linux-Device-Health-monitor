import { useEffect, useRef } from 'react';

/**
 * Custom hook that runs an interval callback only when the browser tab is visible.
 * Automatically clears and pauses when the document is hidden, preventing background CPU drain.
 *
 * @param callback The function to execute periodically.
 * @param delayMs The period in milliseconds (null or undefined to disable).
 */
export function useVisibilityInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null || delayMs <= 0) return;

    let timerId: number | null = null;

    const startTimer = () => {
      if (timerId === null && document.visibilityState === 'visible') {
        timerId = window.setInterval(() => {
          savedCallback.current();
        }, delayMs);
      }
    };

    const stopTimer = () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startTimer();
      } else {
        stopTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTimer();

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [delayMs]);
}
