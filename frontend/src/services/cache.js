import { cacheConfig } from '../config/environment';
import logger from './logger.jsx';

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.storageKey = cacheConfig.storageKey;
    this.maxSize = cacheConfig.maxSize;
    this.defaultDuration = cacheConfig.duration;
    this.cleanupInterval = null;
    
    this.init();
  }

  init() {
    // Restore cache from localStorage
    this.loadFromStorage();
    
    // Start periodic cleanup
    this.startCleanup();
    
    // Listen for page unload to save cache
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveToStorage();
      });
    }
  }

  // Generate cache key
  generateKey(key, params = {}) {
    if (typeof key === 'object') {
      key = JSON.stringify(key);
    }
    
    if (Object.keys(params).length > 0) {
      const paramString = JSON.stringify(params, Object.keys(params).sort());
      return `${key}:${paramString}`;
    }
    
    return key;
  }

  // Set cache
  set(key, value, duration = this.defaultDuration, tags = []) {
    const cacheKey = this.generateKey(key);
    const expiresAt = Date.now() + duration;
    
    const cacheItem = {
      key: cacheKey,
      value,
      expiresAt,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      tags: Array.isArray(tags) ? tags : [tags],
      size: this.calculateSize(value)
    };

    // Check cache size limit
    if (this.memoryCache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.memoryCache.set(cacheKey, cacheItem);
    
    logger.debug('Cache set', { 
      key: cacheKey, 
      expiresAt: new Date(expiresAt).toISOString(),
      size: cacheItem.size 
    });

    return cacheItem;
  }

  // Get cache
  get(key, defaultValue = null) {
    const cacheKey = this.generateKey(key);
    const cacheItem = this.memoryCache.get(cacheKey);

    if (!cacheItem) {
      logger.debug('Cache miss', { key: cacheKey });
      return defaultValue;
    }

    // Check if expired
    if (Date.now() > cacheItem.expiresAt) {
      this.memoryCache.delete(cacheKey);
      logger.debug('Cache expired', { key: cacheKey });
      return defaultValue;
    }

    // Update access statistics
    cacheItem.accessCount++;
    cacheItem.lastAccessed = Date.now();

    logger.debug('Cache hit', { 
      key: cacheKey, 
      accessCount: cacheItem.accessCount 
    });

    return cacheItem.value;
  }

  // Check if cache exists and is not expired
  has(key) {
    const cacheKey = this.generateKey(key);
    const cacheItem = this.memoryCache.get(cacheKey);
    
    if (!cacheItem) {
      return false;
    }

    if (Date.now() > cacheItem.expiresAt) {
      this.memoryCache.delete(cacheKey);
      return false;
    }

    return true;
  }

  // Delete cache
  delete(key) {
    const cacheKey = this.generateKey(key);
    const deleted = this.memoryCache.delete(cacheKey);
    
    if (deleted) {
      logger.debug('Cache deleted', { key: cacheKey });
    }
    
    return deleted;
  }

  // Delete cache by tag
  deleteByTag(tag) {
    let deletedCount = 0;
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.tags.includes(tag)) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }
    
    logger.debug('Cache deleted by tag', { tag, deletedCount });
    return deletedCount;
  }

  // Clear all cache
  clear() {
    const size = this.memoryCache.size;
    this.memoryCache.clear();
    
    logger.info('Cache cleared', { deletedCount: size });
    return size;
  }

  // Get cache statistics
  getStats() {
    const items = Array.from(this.memoryCache.values());
    const now = Date.now();
    
    const stats = {
      totalItems: items.length,
      totalSize: items.reduce((sum, item) => sum + item.size, 0),
      expiredItems: items.filter(item => now > item.expiresAt).length,
      averageAccessCount: items.length > 0 
        ? items.reduce((sum, item) => sum + item.accessCount, 0) / items.length 
        : 0,
      oldestItem: items.length > 0 
        ? Math.min(...items.map(item => item.createdAt)) 
        : null,
      newestItem: items.length > 0 
        ? Math.max(...items.map(item => item.createdAt)) 
        : null
    };

    return stats;
  }

  // Get all cache keys
  getKeys() {
    return Array.from(this.memoryCache.keys());
  }

  // Get cache item details
  getItem(key) {
    const cacheKey = this.generateKey(key);
    return this.memoryCache.get(cacheKey);
  }

  // Update cache expiration time
  touch(key, duration = this.defaultDuration) {
    const cacheKey = this.generateKey(key);
    const cacheItem = this.memoryCache.get(cacheKey);
    
    if (cacheItem) {
      cacheItem.expiresAt = Date.now() + duration;
      cacheItem.lastAccessed = Date.now();
      logger.debug('Cache expiration time updated', { key: cacheKey });
      return true;
    }
    
    return false;
  }

  // Calculate data size (rough estimation)
  calculateSize(value) {
    try {
      return JSON.stringify(value).length * 2; // Rough byte count estimation
    } catch (error) {
      return 0;
    }
  }

  // LRU eviction strategy
  evictLeastRecentlyUsed() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      logger.debug('LRU cache evicted', { key: oldestKey });
    }
  }

  // Clean expired cache
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiresAt) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Expired cache cleaned', { cleanedCount });
    }

    return cleanedCount;
  }

  // Start periodic cleanup
  startCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean every minute
  }

  // Stop periodic cleanup
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Save to localStorage
  saveToStorage() {
    try {
      const cacheData = {};
      const now = Date.now();

      for (const [key, item] of this.memoryCache.entries()) {
        // Only save non-expired cache
        if (now <= item.expiresAt) {
          cacheData[key] = {
            value: item.value,
            expiresAt: item.expiresAt,
            createdAt: item.createdAt,
            tags: item.tags
          };
        }
      }

      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
      logger.debug('Cache saved to localStorage', { itemCount: Object.keys(cacheData).length });
    } catch (error) {
      logger.warn('Failed to save cache to localStorage', { error: error.message });
    }
  }

  // Load from localStorage
  loadFromStorage() {
    try {
      const cacheData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      const now = Date.now();
      let loadedCount = 0;

      for (const [key, item] of Object.entries(cacheData)) {
        // Only load non-expired cache
        if (now <= item.expiresAt) {
          this.memoryCache.set(key, {
            key,
            value: item.value,
            expiresAt: item.expiresAt,
            createdAt: item.createdAt,
            accessCount: 0,
            lastAccessed: now,
            tags: item.tags || [],
            size: this.calculateSize(item.value)
          });
          loadedCount++;
        }
      }

      logger.debug('Cache loaded from localStorage', { loadedCount });
    } catch (error) {
      logger.warn('Failed to load cache from localStorage', { error: error.message });
    }
  }

  // Cache decorator function
  memoize(fn, keyGenerator, duration = this.defaultDuration, tags = []) {
    return (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : `${fn.name}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = fn(...args);
      
      // If it's a Promise, cache the resolved value
      if (result && typeof result.then === 'function') {
        return result.then(value => {
          this.set(key, value, duration, tags);
          return value;
        });
      }

      this.set(key, result, duration, tags);
      return result;
    };
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;

// Export convenience functions
export const cache = {
  set: (key, value, duration, tags) => cacheService.set(key, value, duration, tags),
  get: (key, defaultValue) => cacheService.get(key, defaultValue),
  has: (key) => cacheService.has(key),
  delete: (key) => cacheService.delete(key),
  deleteByTag: (tag) => cacheService.deleteByTag(tag),
  clear: () => cacheService.clear(),
  memoize: (fn, keyGenerator, duration, tags) => cacheService.memoize(fn, keyGenerator, duration, tags)
};