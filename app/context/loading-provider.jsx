import { createContext, useContext, useEffect, useState } from 'react';
import { Loading } from '~/components/loading/loading';
import { useHydrated } from '~/hooks/useHydrated';
import {
  initializeLoadingDetection,
  onProgressUpdate,
  onLoadingComplete,
  markComponentsMounted,
  forceCompleteLoading,
} from '~/utils/loading-detector';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(0);
  const isHydrated = useHydrated();

  // Check if this is the initial page load (not a navigation)
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const value = {
    isLoading,
    setIsLoading,
    setLoading,
  };

  // Check if this is initial load or navigation
  useEffect(() => {
    // Check if we're on the home page
    const isHomePage =
      window.location.pathname === '/' || window.location.pathname === '/home';

    // Check if we're navigating back (performance.navigation.type === 'back_forward')
    // or if this is a fresh page load
    const isNavigation =
      performance.navigation &&
      (performance.navigation.type === 2 || // TYPE_BACK_FORWARD
        performance.navigation.type === 1); // TYPE_RELOAD

    // Check if we've already loaded before (sessionStorage)
    const hasLoadedBefore = sessionStorage.getItem('portfolio-loaded');

    // Only show loading screen on home page refresh, not on navigation or other pages
    if (!isHomePage || (hasLoadedBefore && isNavigation)) {
      // This is not home page or a navigation, skip loading screen
      setIsInitialLoad(false);
      setIsLoading(false);
      return;
    }

    // Mark that we've loaded at least once in this session
    sessionStorage.setItem('portfolio-loaded', 'true');
  }, []);

  // Initialize loading detection only on initial load
  useEffect(() => {
    if (!isInitialLoad) return;

    // Start with 0 progress
    setLoading(0);

    // The main-body class approach will handle visibility

    // Add gradual progress increase at the beginning to show loading is working
    let initialProgress = 0;
    const initialInterval = setInterval(() => {
      initialProgress += Math.random() * 3 + 1; // Random increment between 1-4
      if (initialProgress < 15) {
        setLoading(Math.min(15, Math.round(initialProgress)));
      } else {
        clearInterval(initialInterval);
      }
    }, 100); // Slower interval for smoother progression

    // Initialize the loading detection system when hydrated
    if (isHydrated) {
      initializeLoadingDetection();

      // Subscribe to progress updates
      const unsubscribeProgress = onProgressUpdate(progress => {
        setLoading(progress);
      });

      // Subscribe to loading completion
      const unsubscribeComplete = onLoadingComplete(() => {
        // The loading component will handle its own transition timing
        // and call the onComplete callback when ready
      });

      // Mark components as mounted after a short delay
      // This ensures React components have had time to render
      setTimeout(() => {
        markComponentsMounted();
      }, 200);

      const fallbackTimeout = setTimeout(() => {
        forceCompleteLoading();
        setIsLoading(false);
      }, 8000);

      return () => {
        unsubscribeProgress();
        unsubscribeComplete();
        clearTimeout(fallbackTimeout);
        clearInterval(initialInterval);
      };
    }

    return () => {
      clearInterval(initialInterval);
    };
  }, [isHydrated, isInitialLoad]);

  // Show loading immediately on first load, then after hydration
  const showLoading = isLoading;

  // Handle loading completion from the Loading component
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={value}>
      {showLoading && <Loading percent={loading} onComplete={handleLoadingComplete} />}
      <main className={`main-body ${!showLoading ? 'loaded' : ''}`}>{children}</main>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
