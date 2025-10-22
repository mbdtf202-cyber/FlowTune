/**
 * Redis Database Configuration
 * Handles Redis connection and data management
 */

import Redis from 'ioredis';
import NodeCache from 'node-cache';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';

class Database {
  constructor() {
    this.redis = null;
    this.cache = new NodeCache({ stdTTL: 600 }); // 10 minutes default TTL
    this.isConnected = false;
    this.dataDir = path.join(process.cwd(), 'data');
  }

  /**
   * Connect to Redis database
   */
  async connect() {
    try {
      // Ensure data directory exists
      await this.ensureDataDirectory();

      // Redis configuration
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      };

      this.redis = new Redis(redisConfig);

      // Event listeners
      this.redis.on('connect', () => {
        logger.info('Redis connection established');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      // Try to connect
      await this.redis.connect();
      
      // Test connection
      await this.redis.ping();
      logger.info('Redis database connected successfully');

    } catch (error) {
      logger.warn('Redis connection failed, falling back to file storage:', error.message);
      // Fallback to file-based storage if Redis is not available
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.redis = null;
      }
      this.isConnected = false;
      logger.info('Redis database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }

  /**
   * Check if database is connected
   */
  isHealthy() {
    return this.isConnected || true; // Always healthy with fallback
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.ping();
        return {
          status: 'healthy',
          type: 'redis',
          connected: true
        };
      } else {
        return {
          status: 'healthy',
          type: 'file_storage',
          connected: false,
          message: 'Using file-based storage fallback'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        type: 'redis',
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
      logger.info(`Created data directory: ${this.dataDir}`);
    }
  }

  /**
   * Set data with TTL
   */
  async set(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (this.redis && this.isConnected) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        // Fallback to memory cache
        this.cache.set(key, value, ttl);
        // Also save to file for persistence
        await this.saveToFile(key, value);
      }
    } catch (error) {
      logger.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get data by key
   */
  async get(key) {
    try {
      if (this.redis && this.isConnected) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Try memory cache first
        let value = this.cache.get(key);
        if (value === undefined) {
          // Try file storage
          value = await this.loadFromFile(key);
          if (value) {
            this.cache.set(key, value);
          }
        }
        return value || null;
      }
    } catch (error) {
      logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete data by key
   */
  async del(key) {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.del(key);
      } else {
        this.cache.del(key);
        await this.deleteFile(key);
      }
    } catch (error) {
      logger.error(`Error deleting key ${key}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.exists(key) === 1;
      } else {
        return this.cache.has(key) || await this.fileExists(key);
      }
    } catch (error) {
      logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern = '*') {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.keys(pattern);
      } else {
        // For file storage, list files in data directory
        const files = await fs.readdir(this.dataDir);
        return files
          .filter(file => file.endsWith('.json'))
          .map(file => file.replace('.json', ''));
      }
    } catch (error) {
      logger.error(`Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Increment counter
   */
  async incr(key, amount = 1) {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.incrby(key, amount);
      } else {
        const current = await this.get(key) || 0;
        const newValue = current + amount;
        await this.set(key, newValue);
        return newValue;
      }
    } catch (error) {
      logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Add to set
   */
  async sadd(key, ...members) {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.sadd(key, ...members);
      } else {
        const set = new Set(await this.get(key) || []);
        members.forEach(member => set.add(member));
        await this.set(key, Array.from(set));
        return members.length;
      }
    } catch (error) {
      logger.error(`Error adding to set ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get set members
   */
  async smembers(key) {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.smembers(key);
      } else {
        return await this.get(key) || [];
      }
    } catch (error) {
      logger.error(`Error getting set members ${key}:`, error);
      return [];
    }
  }

  /**
   * Remove from set
   */
  async srem(key, ...members) {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.srem(key, ...members);
      } else {
        const set = new Set(await this.get(key) || []);
        let removedCount = 0;
        members.forEach(member => {
          if (set.has(member)) {
            set.delete(member);
            removedCount++;
          }
        });
        await this.set(key, Array.from(set));
        return removedCount;
      }
    } catch (error) {
      logger.error(`Error removing from set ${key}:`, error);
      return 0;
    }
  }

  /**
   * Save data to file (fallback storage)
   */
  async saveToFile(key, value) {
    try {
      const filePath = path.join(this.dataDir, `${key}.json`);
      await fs.writeFile(filePath, JSON.stringify(value, null, 2));
    } catch (error) {
      logger.error(`Error saving to file ${key}:`, error);
    }
  }

  /**
   * Load data from file
   */
  async loadFromFile(key) {
    try {
      const filePath = path.join(this.dataDir, `${key}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(key) {
    try {
      const filePath = path.join(this.dataDir, `${key}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist, ignore
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key) {
    try {
      const filePath = path.join(this.dataDir, `${key}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all data
   */
  async clear() {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.flushdb();
      } else {
        this.cache.flushAll();
        // Clear file storage
        const files = await fs.readdir(this.dataDir);
        await Promise.all(
          files
            .filter(file => file.endsWith('.json'))
            .map(file => fs.unlink(path.join(this.dataDir, file)))
        );
      }
    } catch (error) {
      logger.error('Error clearing database:', error);
    }
  }
}

export default new Database();