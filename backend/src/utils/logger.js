/**
 * Logger Utility
 * Centralized logging for the application
 */

import fs from 'fs/promises';
import path from 'path';

class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDir();
  }

  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    return JSON.stringify(logEntry);
  }

  async writeToFile(filename, content) {
    try {
      const filePath = path.join(this.logDir, filename);
      await fs.appendFile(filePath, content + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message, meta = {}) {
    const logMessage = this.formatMessage('INFO', message, meta);
    console.log(`ℹ️ ${message}`, meta);
    this.writeToFile('app.log', logMessage);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    
    const logMessage = this.formatMessage('ERROR', message, errorMeta);
    console.error(`❌ ${message}`, error || '', meta);
    this.writeToFile('error.log', logMessage);
  }

  warn(message, meta = {}) {
    const logMessage = this.formatMessage('WARN', message, meta);
    console.warn(`⚠️ ${message}`, meta);
    this.writeToFile('app.log', logMessage);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = this.formatMessage('DEBUG', message, meta);
      console.debug(`🐛 ${message}`, meta);
      this.writeToFile('debug.log', logMessage);
    }
  }

  // Specific loggers for different components

  aiGeneration(action, data = {}) {
    this.info(`AI Generation: ${action}`, {
      component: 'ai-service',
      action,
      ...data
    });
  }

  ipfsOperation(action, data = {}) {
    this.info(`IPFS Operation: ${action}`, {
      component: 'ipfs-service',
      action,
      ...data
    });
  }

  apiRequest(method, path, data = {}) {
    this.info(`API Request: ${method} ${path}`, {
      component: 'api',
      method,
      path,
      ...data
    });
  }

  flowTransaction(action, data = {}) {
    this.info(`Flow Transaction: ${action}`, {
      component: 'flow-blockchain',
      action,
      ...data
    });
  }

  fileOperation(action, data = {}) {
    this.info(`File Operation: ${action}`, {
      component: 'file-service',
      action,
      ...data
    });
  }

  // Performance logging
  startTimer(label) {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        this.info(`Performance: ${label}`, {
          component: 'performance',
          label,
          duration: `${duration}ms`
        });
        return duration;
      }
    };
  }

  // Request logging middleware
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      const { method, url, ip } = req;

      // Log request
      this.apiRequest(method, url, {
        ip,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type')
      });

      // Log response when finished
      res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        
        this.info(`API Response: ${method} ${url}`, {
          component: 'api',
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          ip
        });
      });

      next();
    };
  }

  // Error logging middleware
  errorLogger() {
    return (error, req, res, next) => {
      this.error('API Error', error, {
        component: 'api',
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next(error);
    };
  }

  // Clean old log files
  async cleanOldLogs(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          this.info(`Cleaned old log file: ${file}`);
        }
      }
    } catch (error) {
      this.error('Failed to clean old logs', error);
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;