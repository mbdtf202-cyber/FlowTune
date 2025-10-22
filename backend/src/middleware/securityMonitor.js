/**
 * 安全监控中间件
 * 实时监控和记录安全事件
 */

import logger from '../utils/logger.js';
import securityConfig from '../config/security.js';

class SecurityMonitor {
  constructor() {
    this.alertCounts = new Map();
    this.suspiciousIPs = new Set();
    this.lastAlertTime = new Map();
  }

  /**
   * 记录安全事件
   */
  logSecurityEvent(eventType, details, req) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      details: details
    };

    logger.warn(`Security Event: ${eventType}`, event);

    // 检查是否需要发送告警
    this.checkAlertThreshold(eventType, event.ip);
  }

  /**
   * 检查告警阈值
   */
  checkAlertThreshold(eventType, ip) {
    const thresholds = securityConfig.monitoring.alertThresholds;
    const cooldown = securityConfig.monitoring.alertCooldown;

    if (!thresholds[eventType]) return;

    const key = `${eventType}:${ip}`;
    const count = (this.alertCounts.get(key) || 0) + 1;
    this.alertCounts.set(key, count);

    // 检查是否超过阈值
    if (count >= thresholds[eventType]) {
      const lastAlert = this.lastAlertTime.get(key);
      const now = Date.now();

      // 检查冷却期
      if (!lastAlert || (now - lastAlert) > cooldown) {
        this.sendAlert(eventType, ip, count);
        this.lastAlertTime.set(key, now);
        
        // 标记为可疑IP
        this.suspiciousIPs.add(ip);
      }
    }

    // 清理过期计数
    setTimeout(() => {
      this.alertCounts.delete(key);
    }, cooldown);
  }

  /**
   * 发送安全告警
   */
  sendAlert(eventType, ip, count) {
    const alert = {
      type: 'SECURITY_ALERT',
      eventType,
      ip,
      count,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(eventType, count)
    };

    logger.error(`Security Alert: ${eventType} threshold exceeded`, alert);

    // 这里可以集成邮件、Slack、短信等告警系统
    // await this.sendEmailAlert(alert);
    // await this.sendSlackAlert(alert);
  }

  /**
   * 获取告警严重程度
   */
  getAlertSeverity(eventType, count) {
    const thresholds = securityConfig.monitoring.alertThresholds;
    const threshold = thresholds[eventType];

    if (count >= threshold * 3) return 'CRITICAL';
    if (count >= threshold * 2) return 'HIGH';
    if (count >= threshold) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 检查IP是否可疑
   */
  isSuspiciousIP(ip) {
    return this.suspiciousIPs.has(ip);
  }

  /**
   * 记录失败的登录尝试
   */
  logFailedLogin(req, details = {}) {
    this.logSecurityEvent('failedLoginAttempts', {
      identifier: details.identifier,
      reason: details.reason,
      ...details
    }, req);
  }

  /**
   * 记录速率限制超出
   */
  logRateLimitExceeded(req, limitType = 'general') {
    this.logSecurityEvent('rateLimitExceeded', {
      limitType,
      endpoint: req.originalUrl
    }, req);
  }

  /**
   * 记录可疑文件上传
   */
  logSuspiciousFileUpload(req, details = {}) {
    this.logSecurityEvent('suspiciousFileUploads', {
      filename: details.filename,
      mimetype: details.mimetype,
      size: details.size,
      reason: details.reason,
      ...details
    }, req);
  }

  /**
   * 记录区块链错误
   */
  logBlockchainError(req, details = {}) {
    this.logSecurityEvent('blockchainErrors', {
      operation: details.operation,
      error: details.error,
      ...details
    }, req);
  }

  /**
   * 记录XSS攻击尝试
   */
  logXSSAttempt(req, details = {}) {
    this.logSecurityEvent('xssAttempts', {
      field: details.field,
      value: details.value,
      sanitized: details.sanitized,
      ...details
    }, req);
  }

  /**
   * 记录SQL注入尝试
   */
  logSQLInjectionAttempt(req, details = {}) {
    this.logSecurityEvent('sqlInjectionAttempts', {
      field: details.field,
      value: details.value,
      pattern: details.pattern,
      ...details
    }, req);
  }

  /**
   * 获取安全统计信息
   */
  getSecurityStats() {
    return {
      suspiciousIPs: Array.from(this.suspiciousIPs),
      alertCounts: Object.fromEntries(this.alertCounts),
      lastAlerts: Object.fromEntries(this.lastAlertTime)
    };
  }

  /**
   * 清理可疑IP列表
   */
  clearSuspiciousIPs() {
    this.suspiciousIPs.clear();
    logger.info('Suspicious IPs list cleared');
  }

  /**
   * 重置告警计数
   */
  resetAlertCounts() {
    this.alertCounts.clear();
    this.lastAlertTime.clear();
    logger.info('Alert counts reset');
  }
}

// 创建全局实例
const securityMonitor = new SecurityMonitor();

/**
 * 安全监控中间件
 */
export const securityMonitorMiddleware = (req, res, next) => {
  // 检查可疑IP
  if (securityMonitor.isSuspiciousIP(req.ip)) {
    logger.warn(`Request from suspicious IP: ${req.ip}`, {
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
  }

  // 记录请求信息
  req.securityMonitor = securityMonitor;
  
  next();
};

export default securityMonitor;