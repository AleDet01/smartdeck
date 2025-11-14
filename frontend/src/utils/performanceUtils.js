/**
 * Performance Utilities
 * Debounce, throttle, memoization helpers
 */

/**
 * Debounce function
 * Delays execution until after wait time has elapsed since last call
 * Perfect for: search inputs, resize events, API calls
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * Ensures function is called at most once per specified time period
 * Perfect for: scroll events, mouse move, window resize
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoize function results
 * Caches results based on arguments
 */
export function memoize(func) {
  const cache = new Map();
  
  return function memoized(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Memoize with TTL (Time To Live)
 * Cache expires after specified time
 */
export function memoizeWithTTL(func, ttl = 60000) {
  const cache = new Map();
  
  return function memoized(...args) {
    const key = JSON.stringify(args);
    const now = Date.now();
    
    if (cache.has(key)) {
      const { value, timestamp } = cache.get(key);
      if (now - timestamp < ttl) {
        return value;
      }
      cache.delete(key);
    }
    
    const result = func(...args);
    cache.set(key, { value: result, timestamp: now });
    return result;
  };
}

/**
 * Request Animation Frame throttle
 * Limits function execution to once per frame (60fps)
 * Perfect for: animations, scroll handlers with DOM updates
 */
export function rafThrottle(func) {
  let rafId = null;
  
  return function throttled(...args) {
    if (rafId !== null) return;
    
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Idle callback wrapper
 * Executes function when browser is idle
 * Perfect for: non-critical background tasks, analytics
 */
export function runWhenIdle(func, options = { timeout: 2000 }) {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(func, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  return setTimeout(func, 0);
}

/**
 * Batch multiple function calls
 * Collects calls and executes once with all arguments
 */
export function batchCalls(func, wait = 100) {
  let timeout;
  let calls = [];
  
  return function batched(...args) {
    calls.push(args);
    
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(calls);
      calls = [];
    }, wait);
  };
}

/**
 * Once function
 * Ensures function is called only once
 */
export function once(func) {
  let called = false;
  let result;
  
  return function calledOnce(...args) {
    if (!called) {
      called = true;
      result = func(...args);
    }
    return result;
  };
}

/**
 * Retry with exponential backoff
 * Retries failed function with increasing delays
 */
export async function retryWithBackoff(func, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Cache API responses
 * Simple in-memory cache for API calls
 */
export class APICache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
  }
  
  delete(key) {
    this.cache.delete(key);
  }
}

/**
 * Local Storage with expiry
 */
export const storageWithExpiry = {
  set(key, value, ttl = 3600000) { // 1 hour default
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  get(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    try {
      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch {
      return null;
    }
  },
  
  remove(key) {
    localStorage.removeItem(key);
  }
};

/**
 * Performance mark helper
 * Measures execution time
 */
export function measure(name, func) {
  return async function measured(...args) {
    const start = performance.now();
    const result = await func(...args);
    const end = performance.now();
    
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  };
}
