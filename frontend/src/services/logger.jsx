import React from 'react';
import config, { logConfig, isProduction } from '../config/environment';

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Log level mapping
const LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG'
};

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = logConfig.maxLogs || 1000;
    this.currentLevel = this.getLevelFromString(logConfig.level);
    this.enabled = logConfig.enabled;
    this.errorReportingEnabled = config.ERROR_REPORTING_ENABLED;
    
    // Initialize error monitoring
    this.initErrorMonitoring();
  }

  getLevelFromString(levelString) {
    const level = levelString?.toUpperCase();
    return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.INFO;
  }

  initErrorMonitoring() {
    // Global error handling
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // React error boundary support
    if (typeof window !== 'undefined') {
      window.__FLOWTUNE_ERROR_HANDLER__ = (error, errorInfo) => {
        this.error('React Error Boundary', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      };
    }
  }

  log(level, message, data = {}, category = 'general') {
    if (!this.enabled || level > this.currentLevel) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LEVEL_NAMES[level],
      message,
      data,
      category,
      url: window.location?.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };

    // Add to memory logs
    this.logs.push(logEntry);
    
    // Maintain log count limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    this.consoleLog(level, message, data);

    // Persistent storage (browser environment only)
    if (typeof window !== 'undefined') {
      this.persistLog(logEntry);
    }

    // Error reporting
    if (level === LOG_LEVELS.ERROR && this.errorReportingEnabled) {
      this.reportError(logEntry);
    }
  }

  consoleLog(level, message, data) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${LEVEL_NAMES[level]}]`;

    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(prefix, message, data);
        break;
      case LOG_LEVELS.WARN:
        console.warn(prefix, message, data);
        break;
      case LOG_LEVELS.INFO:
        console.info(prefix, message, data);
        break;
      case LOG_LEVELS.DEBUG:
        console.debug(prefix, message, data);
        break;
    }
  }

  persistLog(logEntry) {
    try {
      const storageKey = 'flowtune_logs';
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingLogs.push(logEntry);
      
      // Maintain storage size limit
      const maxStoredLogs = 500;
      if (existingLogs.length > maxStoredLogs) {
        existingLogs.splice(0, existingLogs.length - maxStoredLogs);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('Unable to persist logs:', error);
    }
  }

  async reportError(logEntry) {
    try {
      // Send error report to server
      await window.fetch.bind(window)(`${config.API_BASE_URL}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...logEntry,
          environment: config.ENVIRONMENT,
          version: process.env.REACT_APP_VERSION || 'unknown'
        })
      });
    } catch (error) {
      console.warn('Failed to send error report:', error);
    }
  }

  getSessionId() {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('flowtune_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('flowtune_session_id', sessionId);
    }
    return sessionId;
  }

  // Public log methods
  error(message, data, category) {
    this.log(LOG_LEVELS.ERROR, message, data, category);
  }

  warn(message, data, category) {
    this.log(LOG_LEVELS.WARN, message, data, category);
  }

  info(message, data, category) {
    this.log(LOG_LEVELS.INFO, message, data, category);
  }

  debug(message, data, category) {
    this.log(LOG_LEVELS.DEBUG, message, data, category);
  }

  // Category-specific log methods
  api(message, data) {
    this.info(message, data, 'api');
  }

  user(message, data) {
    this.info(message, data, 'user');
  }

  performance(message, data) {
    this.info(message, data, 'performance');
  }

  blockchain(message, data) {
    this.info(message, data, 'blockchain');
  }

  // Performance monitoring
  startTimer(name) {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.performance(`Timer: ${name}`, { duration: `${duration.toFixed(2)}ms` });
        return duration;
      }
    };
  }

  // Get logs
  getLogs(filter = {}) {
    let filteredLogs = [...this.logs];

    if (filter.level) {
      const levelValue = this.getLevelFromString(filter.level);
      filteredLogs = filteredLogs.filter(log => 
        this.getLevelFromString(log.level) <= levelValue
      );
    }

    if (filter.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category);
    }

    if (filter.since) {
      const sinceTime = new Date(filter.since);
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= sinceTime
      );
    }

    return filteredLogs;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flowtune_logs');
    }
  }

  // Export logs
  exportLogs(format = 'json') {
    const logs = this.getLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'category', 'data'];
      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          log.timestamp,
          log.level,
          `"${log.message.replace(/"/g, '""')}"`,
          log.category,
          `"${JSON.stringify(log.data).replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');
      return csvContent;
    }
    
    return logs;
  }

  // Get stored logs
  getStoredLogs() {
    try {
      const storageKey = 'flowtune_logs';
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      this.warn('Unable to get stored logs', { error: error.message });
      return [];
    }
  }

  // Set log level
  setLevel(level) {
    this.currentLevel = this.getLevelFromString(level);
    this.info('Log level changed', { newLevel: LEVEL_NAMES[this.currentLevel] });
  }

  // Enable/disable logging
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`Logging system ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create singleton instance
const logger = new Logger();

// React error boundary component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Call global error handler
    if (window.__FLOWTUNE_ERROR_HANDLER__) {
      window.__FLOWTUNE_ERROR_HANDLER__(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>The application encountered an unexpected error. Please refresh the page and try again.</p>
          {!isProduction && (
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default logger;

// Export convenience functions
export const log = {
  error: (message, data, category) => logger.error(message, data, category),
  warn: (message, data, category) => logger.warn(message, data, category),
  info: (message, data, category) => logger.info(message, data, category),
  debug: (message, data, category) => logger.debug(message, data, category),
  api: (message, data) => logger.api(message, data),
  user: (message, data) => logger.user(message, data),
  performance: (message, data) => logger.performance(message, data),
  blockchain: (message, data) => logger.blockchain(message, data),
  timer: (name) => logger.startTimer(name)
};