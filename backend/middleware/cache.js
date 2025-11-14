const logger = require('../utils/logger');

/**
 * Simple In-Memory Cache
 * Fallback quando Redis non disponibile
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    const ttl = this.ttls.get(key);
    if (ttl && Date.now() > ttl) {
      this.cache.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  async set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    if (ttlSeconds > 0) {
      this.ttls.set(key, Date.now() + (ttlSeconds * 1000));
    }
    return 'OK';
  }

  async del(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
    return 1;
  }

  async clear() {
    this.cache.clear();
    this.ttls.clear();
    return 'OK';
  }

  // Cleanup expired entries periodically
  startCleanup(interval = 60000) {
    setInterval(() => {
      const now = Date.now();
      for (const [key, ttl] of this.ttls.entries()) {
        if (now > ttl) {
          this.cache.delete(key);
          this.ttls.delete(key);
        }
      }
    }, interval);
  }
}

// Singleton cache instance
let cacheInstance = null;

/**
 * Initialize cache (Redis or Memory)
 */
function initCache() {
  if (cacheInstance) return cacheInstance;

  // Try Redis first
  if (process.env.REDIS_URL) {
    try {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      redis.on('error', (err) => {
        logger.warn('Redis cache error, falling back to memory:', err.message);
      });

      cacheInstance = redis;
      logger.info('✓ Cache initialized: Redis');
      return cacheInstance;
    } catch (error) {
      logger.warn('Redis not available, using memory cache:', error.message);
    }
  }

  // Fallback to memory cache
  cacheInstance = new MemoryCache();
  cacheInstance.startCleanup();
  logger.info('✓ Cache initialized: Memory (in-process)');
  
  return cacheInstance;
}

/**
 * Get cache instance
 */
function getCache() {
  if (!cacheInstance) {
    return initCache();
  }
  return cacheInstance;
}

/**
 * Cache middleware for Express routes
 * Usage: app.get('/api/data', cacheMiddleware(300), handler)
 */
function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL + userId
    const userId = req.user?.id || 'anonymous';
    const cacheKey = `route:${req.originalUrl}:${userId}`;

    try {
      const cache = getCache();
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.info(`Cache HIT: ${cacheKey}`);
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedData));
      }

      // Cache MISS - intercept res.json to cache response
      logger.info(`Cache MISS: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = function(data) {
        // Cache the response asynchronously
        cache.set(cacheKey, JSON.stringify(data), ttl).catch(err => {
          logger.warn('Failed to cache response:', err);
        });
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without cache on error
    }
  };
}

/**
 * Invalidate cache by pattern
 * Usage: invalidateCache('route:/api/flash*')
 */
async function invalidateCache(pattern) {
  try {
    const cache = getCache();
    
    // Redis supports pattern matching
    if (cache.constructor.name === 'Redis') {
      const keys = await cache.keys(pattern);
      if (keys.length > 0) {
        await cache.del(...keys);
        logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
      }
    } else {
      // Memory cache - clear all (no pattern matching)
      await cache.clear();
      logger.info('Cleared memory cache');
    }
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
}

/**
 * Invalidate user-specific cache
 */
async function invalidateUserCache(userId) {
  await invalidateCache(`route:*:${userId}`);
}

/**
 * Cache decorator for async functions
 * Usage: const cachedFunc = cacheFunction(expensiveFunc, 'key', 300)
 */
function cacheFunction(func, keyPrefix, ttl = 300) {
  return async function(...args) {
    const cache = getCache();
    const cacheKey = `func:${keyPrefix}:${JSON.stringify(args)}`;

    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const result = await func(...args);
      await cache.set(cacheKey, JSON.stringify(result), ttl);
      return result;
    } catch (error) {
      logger.error('Cache function error:', error);
      return func(...args); // Execute without cache on error
    }
  };
}

module.exports = {
  initCache,
  getCache,
  cacheMiddleware,
  invalidateCache,
  invalidateUserCache,
  cacheFunction,
};
