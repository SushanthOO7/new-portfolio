import { useEffect, useRef } from 'react';
import { markComponentsMounted } from '~/utils/loading-detector';

/**
 * Hook for components to report when they're fully loaded
 * This helps the loading system track component-specific loading states
 */
export function useComponentLoaded(dependencies = []) {
  const hasReported = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a timeout to report loading after dependencies change
    // This ensures the component has had time to render and update
    timeoutRef.current = setTimeout(() => {
      if (!hasReported.current) {
        markComponentsMounted();
        hasReported.current = true;
      }
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);

  // Report loading on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasReported.current) {
        markComponentsMounted();
        hasReported.current = true;
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, []);

  return {
    reportLoaded: () => {
      if (!hasReported.current) {
        markComponentsMounted();
        hasReported.current = true;
      }
    }
  };
}
