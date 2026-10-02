/**
 * Comprehensive loading detection utilities
 * Tracks DOM readiness, asset loading, and component mounting
 */

// Track loading states
const loadingStates = {
  domContentLoaded: false,
  windowLoaded: false,
  fontsLoaded: false,
  imagesLoaded: false,
  componentsMounted: false,
  criticalAssetsLoaded: false,
};

// Cache for already loaded assets
const loadedAssetsCache = new Set();

// Callbacks for when loading completes
const loadingCallbacks = [];

// Progress tracking
let currentProgress = 0;
let targetProgress = 0;
const progressCallbacks = [];
let progressAnimationId = null;

/**
 * Initialize loading detection (optimized)
 */
export function initializeLoadingDetection() {
  // Reset all loading states
  Object.keys(loadingStates).forEach(key => {
    loadingStates[key] = false;
  });

  // Start with 0 progress
  currentProgress = 0;
  targetProgress = 0;

  // Check if this is a subsequent page load (faster loading)
  const isSubsequentLoad = document.readyState !== 'loading';

  // Track DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadingStates.domContentLoaded = true;
      updateProgress();
    });
  } else {
    loadingStates.domContentLoaded = true;
  }

  // Track window loaded
  if (document.readyState === 'complete') {
    loadingStates.windowLoaded = true;
  } else {
    window.addEventListener('load', () => {
      loadingStates.windowLoaded = true;
      updateProgress();
    });
  }

  // Track font loading
  trackFontLoading();

  // Track image loading
  trackImageLoading();

  // Track critical assets
  trackCriticalAssets();

  // Start with a smaller delay for faster loading
  setTimeout(
    () => {
      updateProgress();
    },
    isSubsequentLoad ? 50 : 100
  );
}

/**
 * Track font loading using FontFace API
 */
function trackFontLoading() {
  // Check if fonts are already loaded
  if (
    'fonts' in document &&
    document.fonts.check('16px Gotham') &&
    document.fonts.check('500 16px Gotham')
  ) {
    loadingStates.fontsLoaded = true;
    updateProgress();
    return;
  }

  if ('fonts' in document) {
    Promise.all([
      document.fonts.load('16px Gotham'),
      document.fonts.load('500 16px Gotham'),
    ])
      .then(() => {
        loadingStates.fontsLoaded = true;
        updateProgress();
      })
      .catch(() => {
        // Faster fallback: assume fonts are loaded after a shorter delay
        setTimeout(() => {
          loadingStates.fontsLoaded = true;
          updateProgress();
        }, 500);
      });
  } else {
    // Faster fallback for browsers without FontFace API
    setTimeout(() => {
      loadingStates.fontsLoaded = true;
      updateProgress();
    }, 300);
  }
}

/**
 * Track image loading (comprehensive tracking)
 */
function trackImageLoading() {
  const images = document.querySelectorAll('img');
  const icons = document.querySelectorAll('svg, [class*="icon"]');
  const allAssets = [...images, ...icons];

  if (allAssets.length === 0) {
    loadingStates.imagesLoaded = true;
    updateProgress();
    return;
  }

  let loadedAssets = 0;
  const totalAssets = allAssets.length;

  const checkAssetLoading = () => {
    loadedAssets++;
    updateProgress();

    if (loadedAssets >= totalAssets) {
      loadingStates.imagesLoaded = true;
      updateProgress();
    }
  };

  // Track all images and icons
  allAssets.forEach(asset => {
    if (asset.tagName === 'IMG') {
      if (asset.complete && asset.naturalHeight !== 0) {
        checkAssetLoading();
      } else {
        asset.addEventListener('load', checkAssetLoading);
        asset.addEventListener('error', checkAssetLoading);
      }
    } else {
      // For SVG and icon elements, consider them loaded if they're in the DOM
      checkAssetLoading();
    }
  });

  // Fallback timeout for images
  setTimeout(() => {
    if (!loadingStates.imagesLoaded) {
      loadingStates.imagesLoaded = true;
      updateProgress();
    }
  }, 5000);
}

/**
 * Track critical assets (comprehensive)
 */
function trackCriticalAssets() {
  // Track critical stylesheets, scripts, and other assets
  const criticalAssets = [
    ...document.querySelectorAll('link[rel="stylesheet"]'),
    ...document.querySelectorAll('script[src]'),
    ...document.querySelectorAll('link[rel="preload"]'),
    ...document.querySelectorAll('link[rel="prefetch"]'),
  ];

  if (criticalAssets.length === 0) {
    loadingStates.criticalAssetsLoaded = true;
    updateProgress();
    return;
  }

  let loadedAssets = 0;
  const totalAssets = criticalAssets.length;

  const checkAssetLoading = () => {
    loadedAssets++;
    updateProgress();

    if (loadedAssets >= totalAssets) {
      loadingStates.criticalAssetsLoaded = true;
      updateProgress();
    }
  };

  criticalAssets.forEach(asset => {
    if (
      asset.tagName === 'LINK' &&
      (asset.rel === 'stylesheet' || asset.rel === 'preload' || asset.rel === 'prefetch')
    ) {
      asset.addEventListener('load', checkAssetLoading);
      asset.addEventListener('error', checkAssetLoading);
    } else if (asset.tagName === 'SCRIPT' && asset.src) {
      asset.addEventListener('load', checkAssetLoading);
      asset.addEventListener('error', checkAssetLoading);
    } else {
      // For other assets, consider them loaded
      checkAssetLoading();
    }
  });

  // Fallback timeout
  setTimeout(() => {
    if (!loadingStates.criticalAssetsLoaded) {
      loadingStates.criticalAssetsLoaded = true;
      updateProgress();
    }
  }, 3000);
}

/**
 * Mark components as mounted
 */
export function markComponentsMounted() {
  loadingStates.componentsMounted = true;
  updateProgress();
}

/**
 * Smooth progress animation
 */
function animateProgress() {
  if (progressAnimationId) {
    cancelAnimationFrame(progressAnimationId);
  }

  const animate = () => {
    const diff = targetProgress - currentProgress;

    if (Math.abs(diff) < 0.1) {
      currentProgress = targetProgress;
    } else {
      currentProgress += diff * 0.1; // Smooth easing
    }

    progressCallbacks.forEach(callback => callback(Math.round(currentProgress)));

    if (Math.abs(targetProgress - currentProgress) > 0.1) {
      progressAnimationId = requestAnimationFrame(animate);
    }
  };

  progressAnimationId = requestAnimationFrame(animate);
}

/**
 * Update progress based on loading states (comprehensive)
 */
function updateProgress() {
  const states = Object.values(loadingStates);
  const completedStates = states.filter(state => state === true).length;
  const totalStates = states.length;

  // Calculate base progress from completed states (0-100%)
  const baseProgress = Math.round((completedStates / totalStates) * 100);

  // Add some random variation to make it feel more natural, but keep it within bounds
  const variation = Math.random() * 2;
  const newTargetProgress = Math.min(100, Math.max(0, baseProgress + variation));

  if (newTargetProgress !== targetProgress) {
    targetProgress = newTargetProgress;
    animateProgress();
  }

  // Check if all loading is complete
  if (completedStates === totalStates) {
    // Ensure we reach 100% before completing
    targetProgress = 100;
    animateProgress();

    // Wait a bit to show 100% before completing
    setTimeout(() => {
      loadingCallbacks.forEach(callback => callback());
    }, 500);
  }
}

/**
 * Subscribe to progress updates
 */
export function onProgressUpdate(callback) {
  progressCallbacks.push(callback);
  // Immediately call with current progress
  callback(currentProgress);

  return () => {
    const index = progressCallbacks.indexOf(callback);
    if (index > -1) {
      progressCallbacks.splice(index, 1);
    }
  };
}

/**
 * Subscribe to loading completion
 */
export function onLoadingComplete(callback) {
  loadingCallbacks.push(callback);

  // If already loaded, call immediately
  const states = Object.values(loadingStates);
  if (states.every(state => state === true)) {
    callback();
  }

  return () => {
    const index = loadingCallbacks.indexOf(callback);
    if (index > -1) {
      loadingCallbacks.splice(index, 1);
    }
  };
}

/**
 * Get current loading states
 */
export function getLoadingStates() {
  return { ...loadingStates };
}

/**
 * Get current progress
 */
export function getCurrentProgress() {
  return currentProgress;
}

/**
 * Force complete loading (for fallback scenarios)
 */
export function forceCompleteLoading() {
  Object.keys(loadingStates).forEach(key => {
    loadingStates[key] = true;
  });
  updateProgress();
}
