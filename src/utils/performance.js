// Performance optimization utilities

/**
 * Debounce function to limit the rate of function calls
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function to limit function calls to once per specified time period
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Memoization utility for expensive computations
 */
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

/**
 * Lazy loading utility for components
 */
export const createLazyComponent = (importFunc, fallback = null) => {
  return React.lazy(() => 
    importFunc().catch(error => {
      console.error('Error loading component:', error);
      // Return a fallback component
      return { default: () => fallback || React.createElement('div', null, 'Failed to load component') };
    })
  );
};

/**
 * Virtual scrolling utilities
 */
export const virtualScrolling = {
  // Calculate visible items for virtual scrolling
  calculateVisibleItems: (scrollTop, itemHeight, containerHeight, totalItems) => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      totalItems - 1
    );
    
    return {
      startIndex: Math.max(0, startIndex),
      endIndex,
      visibleItems: endIndex - startIndex + 1,
    };
  },
  
  // Get transform offset for virtual scrolling
  getTransformOffset: (startIndex, itemHeight) => {
    return startIndex * itemHeight;
  },
};

/**
 * Image optimization utilities
 */
export const imageOptimization = {
  // Create optimized image URL with size parameters
  getOptimizedImageUrl: (url, width, height, quality = 80) => {
    if (!url) return '';
    
    // For Figma images, add size parameters
    if (url.includes('figma.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=${width}&h=${height}&q=${quality}`;
    }
    
    return url;
  },
  
  // Preload critical images
  preloadImage: (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },
  
  // Lazy load images with intersection observer
  createImageLazyLoader: (threshold = 0.1) => {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      { threshold }
    );
    
    return {
      observe: (img) => imageObserver.observe(img),
      unobserve: (img) => imageObserver.unobserve(img),
      disconnect: () => imageObserver.disconnect(),
    };
  },
};

/**
 * Memory management utilities
 */
export const memoryManagement = {
  // Clean up large objects and arrays
  cleanup: (obj) => {
    if (Array.isArray(obj)) {
      obj.length = 0;
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        delete obj[key];
      });
    }
  },
  
  // Monitor memory usage (development only)
  monitorMemory: () => {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      console.log('Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`,
      });
    }
  },
  
  // Create a memory-efficient cache with size limits
  createCache: (maxSize = 50) => {
    const cache = new Map();
    
    return {
      get: (key) => cache.get(key),
      set: (key, value) => {
        if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, value);
      },
      has: (key) => cache.has(key),
      delete: (key) => cache.delete(key),
      clear: () => cache.clear(),
      size: () => cache.size,
    };
  },
};

/**
 * Bundle optimization utilities
 */
export const bundleOptimization = {
  // Dynamic import with error handling
  dynamicImport: async (importPath) => {
    try {
      const module = await import(importPath);
      return module;
    } catch (error) {
      console.error(`Failed to load module: ${importPath}`, error);
      throw error;
    }
  },
  
  // Preload critical modules
  preloadModule: (importPath) => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = importPath;
    document.head.appendChild(link);
  },
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitoring = {
  // Measure function execution time
  measureTime: (name, fn) => {
    return async (...args) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
      return result;
    };
  },
  
  // Create performance observer for specific metrics
  createObserver: (entryTypes, callback) => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(callback);
      observer.observe({ entryTypes });
      return observer;
    }
    return null;
  },
  
  // Get Core Web Vitals
  getCoreWebVitals: () => {
    const vitals = {};
    
    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      vitals.fcp = fcpEntry.startTime;
    }
    
    // Largest Contentful Paint
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      vitals.lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }
    
    // Cumulative Layout Shift
    const clsEntries = performance.getEntriesByType('layout-shift');
    vitals.cls = clsEntries.reduce((sum, entry) => sum + entry.value, 0);
    
    return vitals;
  },
};

/**
 * React-specific performance utilities
 */
export const reactPerformance = {
  // Create a memoized component
  createMemoComponent: (Component, areEqual) => {
    return React.memo(Component, areEqual);
  },
  
  // Create optimized event handlers
  createStableHandler: (handler, deps = []) => {
    return React.useCallback(handler, deps);
  },
  
  // Create optimized computed values
  createStableValue: (factory, deps = []) => {
    return React.useMemo(factory, deps);
  },
  
  // Prevent unnecessary re-renders
  preventRerender: (value, deps = []) => {
    return React.useMemo(() => value, deps);
  },
};

/**
 * Network optimization utilities
 */
export const networkOptimization = {
  // Create optimized fetch with timeout and retry
  createOptimizedFetch: (timeout = 10000, retries = 3) => {
    return async (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      let lastError;
      
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response;
        } catch (error) {
          lastError = error;
          
          if (i < retries && error.name !== 'AbortError') {
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          }
        }
      }
      
      clearTimeout(timeoutId);
      throw lastError;
    };
  },
  
  // Batch multiple requests
  batchRequests: (requests, batchSize = 5) => {
    const batches = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }
    
    return batches.reduce(async (promise, batch) => {
      const results = await promise;
      const batchResults = await Promise.allSettled(batch);
      return [...results, ...batchResults];
    }, Promise.resolve([]));
  },
};

// Export all utilities
export default {
  debounce,
  throttle,
  memoize,
  createLazyComponent,
  virtualScrolling,
  imageOptimization,
  memoryManagement,
  bundleOptimization,
  performanceMonitoring,
  reactPerformance,
  networkOptimization,
};