import logger from './logger.jsx'
import { securityConfig } from '../config/security'

class SecurityMonitor {
  constructor() {
    this.violations = new Map()
    this.rateLimits = new Map()
    this.suspiciousActivities = []
    this.isMonitoring = false
  }

  // Start security monitoring
  start() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.setupEventListeners()
    this.startPeriodicChecks()
    
    logger.info('Security monitoring started')
  }

  // Stop security monitoring
  stop() {
    this.isMonitoring = false
    this.cleanup()
    
    logger.info('Security monitoring stopped')
  }

  // Setup event listeners
  setupEventListeners() {
    // Monitor DOM changes (potential XSS attacks)
    this.domObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkForSuspiciousElements(node)
            }
          })
        }
      })
    })

    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Monitor network requests
    this.interceptFetch()
    this.interceptXHR()

    // Monitor console access attempts
    this.monitorConsoleAccess()

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))

    // Monitor focus changes
    window.addEventListener('focus', this.handleFocusChange.bind(this))
    window.addEventListener('blur', this.handleFocusChange.bind(this))
  }

  // Check for suspicious elements
  checkForSuspiciousElements(element) {
    // Check inline scripts
    if (element.tagName === 'SCRIPT' && element.innerHTML) {
      this.reportViolation('inline-script', {
        content: element.innerHTML.substring(0, 100),
        location: window.location.href
      })
    }

    // Check suspicious attributes
    const suspiciousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover']
    suspiciousAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        this.reportViolation('suspicious-attribute', {
          attribute: attr,
          value: element.getAttribute(attr),
          tagName: element.tagName
        })
      }
    })

    // Check external resources
    if (element.tagName === 'SCRIPT' && element.src) {
      const url = new URL(element.src, window.location.origin)
      if (url.origin !== window.location.origin) {
        this.reportViolation('external-script', {
          src: element.src,
          origin: url.origin
        })
      }
    }
  }

  // Intercept fetch requests
  interceptFetch() {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      
      // Check request frequency
      if (this.checkRateLimit(url)) {
        this.reportViolation('rate-limit-exceeded', { url })
        throw new Error('Rate limit exceeded')
      }

      // Check suspicious URLs
      if (this.isSuspiciousURL(url)) {
        this.reportViolation('suspicious-url', { url })
      }

      return originalFetch.apply(this, args)
    }
  }

  // Intercept XMLHttpRequest
  interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      // Check request frequency
      if (this.checkRateLimit(url)) {
        this.reportViolation('rate-limit-exceeded', { url, method })
        throw new Error('Rate limit exceeded')
      }

      return originalOpen.apply(this, [method, url, ...args])
    }.bind(this)
  }

  // Monitor console access
  monitorConsoleAccess() {
    // Relax restrictions in development environment
    const isDevelopment = import.meta.env.MODE === 'development'
    const maxConsoleAccess = isDevelopment ? 1000 : 50 // Allow more console access in development
    
    let consoleAccessCount = 0
    const originalLog = console.log

    console.log = (...args) => {
      consoleAccessCount++
      if (consoleAccessCount > maxConsoleAccess) {
        this.reportViolation('excessive-console-access', {
          count: consoleAccessCount,
          environment: import.meta.env.MODE
        })
      }
      return originalLog.apply(console, args)
    }
  }

  // Check rate limit
  checkRateLimit(url) {
    const now = Date.now()
    const key = this.getRateLimitKey(url)
    const limit = this.rateLimits.get(key) || { count: 0, resetTime: now + 60000 }

    if (now > limit.resetTime) {
      limit.count = 0
      limit.resetTime = now + 60000
    }

    limit.count++
    this.rateLimits.set(key, limit)

    return limit.count > securityConfig.rateLimit.max
  }

  // Get rate limit key
  getRateLimitKey(url) {
    try {
      const urlObj = new URL(url, window.location.origin)
      return urlObj.pathname
    } catch {
      return url
    }
  }

  // Check suspicious URLs
  isSuspiciousURL(url) {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /file:/i,
      /\.\.\/.*\.\.\//,  // Path traversal
      /<script/i,
      /eval\(/i,
      /document\.write/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(url))
  }

  // Handle page visibility change
  handleVisibilityChange() {
    if (document.hidden) {
      logger.info('Page hidden - pausing sensitive operations')
    } else {
      logger.info('Page visible - resuming operations')
    }
  }

  // Handle focus changes
  handleFocusChange(event) {
    if (event.type === 'blur') {
      // Page lost focus, potential security risk
      this.reportViolation('focus-lost', {
        timestamp: Date.now()
      })
    }
  }

  // Start periodic checks
  startPeriodicChecks() {
    this.checkInterval = setInterval(() => {
      this.performSecurityChecks()
    }, 30000) // Check every 30 seconds
  }

  // Perform security checks
  performSecurityChecks() {
    // Check local storage size
    this.checkStorageUsage()
    
    // Check memory usage
    this.checkMemoryUsage()
    
    // Check network status
    this.checkNetworkStatus()
    
    // Clean up expired data
    this.cleanupExpiredData()
  }

  // Check storage usage
  checkStorageUsage() {
    try {
      const localStorageSize = JSON.stringify(localStorage).length
      const sessionStorageSize = JSON.stringify(sessionStorage).length
      
      if (localStorageSize > 5 * 1024 * 1024) { // 5MB
        this.reportViolation('excessive-storage-usage', {
          localStorage: localStorageSize,
          sessionStorage: sessionStorageSize
        })
      }
    } catch (error) {
      logger.error('Failed to check storage usage', error)
    }
  }

  // Check memory usage
  checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory
      if (memory.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
        this.reportViolation('high-memory-usage', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize
        })
      }
    }
  }

  // Check network status
  checkNetworkStatus() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      if (connection.downlink < 1) { // Less than 1Mbps
        logger.warn('Slow network detected', {
          downlink: connection.downlink,
          effectiveType: connection.effectiveType
        })
      }
    }
  }

  // Clean up expired data
  cleanupExpiredData() {
    const now = Date.now()
    
    // Clean up expired rate limit records
    for (const [key, limit] of this.rateLimits.entries()) {
      if (now > limit.resetTime) {
        this.rateLimits.delete(key)
      }
    }

    // Clean up old suspicious activity records
    this.suspiciousActivities = this.suspiciousActivities.filter(
      activity => now - activity.timestamp < 24 * 60 * 60 * 1000 // Keep for 24 hours
    )
  }

  // Report violations
  reportViolation(type, details) {
    const violation = {
      type,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.violations.set(`${type}-${Date.now()}`, violation)
    this.suspiciousActivities.push(violation)

    logger.warn('Security violation detected', violation)

    // If it's a critical violation, take immediate action
    if (this.isCriticalViolation(type)) {
      this.handleCriticalViolation(violation)
    }
  }

  // Determine if it's a critical violation
  isCriticalViolation(type) {
    const isDevelopment = import.meta.env.MODE === 'development'
    
    const criticalTypes = [
      'inline-script',
      'external-script',
      'suspicious-url'
    ]
    
    // In development environment, don't consider console access as critical violation
    if (!isDevelopment) {
      criticalTypes.push('excessive-console-access')
    }
    
    return criticalTypes.includes(type)
  }

  // Handle critical violations
  handleCriticalViolation(violation) {
    logger.error('Critical security violation', violation)
    
    // Can add stricter measures here, such as:
    // - Disable certain features
    // - Force user re-login
    // - Send alerts to server
  }

  // Get security report
  getSecurityReport() {
    return {
      violations: Array.from(this.violations.values()),
      suspiciousActivities: this.suspiciousActivities,
      rateLimits: Object.fromEntries(this.rateLimits),
      isMonitoring: this.isMonitoring
    }
  }

  // Clean up resources
  cleanup() {
    if (this.domObserver) {
      this.domObserver.disconnect()
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('focus', this.handleFocusChange)
    window.removeEventListener('blur', this.handleFocusChange)
  }
}

// Create global instance
const securityMonitor = new SecurityMonitor()

export default securityMonitor