import React, { useEffect } from 'react'
import { securityConfig, getCSPString, sanitizeInput } from '../config/security'
import securityMonitor from '../services/securityMonitor'
import logger from '../services/logger.jsx'

const SecurityProvider = ({ children }) => {
  useEffect(() => {
    // 设置CSP
    const meta = document.createElement('meta')
    meta.httpEquiv = 'Content-Security-Policy'
    meta.content = getCSPString()
    document.head.appendChild(meta)

    // 设置其他安全头
    if (securityConfig.https.enabled) {
      // 强制HTTPS重定向
      if (window.location.protocol === 'http:' && securityConfig.https.redirectHttp) {
        window.location.href = window.location.href.replace('http:', 'https:')
        return
      }
    }

    // 禁用右键菜单（生产环境）
    if (import.meta.env.MODE === 'production') {
      const handleContextMenu = (e) => {
        e.preventDefault()
        return false
      }
      document.addEventListener('contextmenu', handleContextMenu)

      // 禁用开发者工具快捷键
      const handleKeyDown = (e) => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault()
          return false
        }
      }
      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }

    // 监听安全事件
    const handleError = (event) => {
      logger.error('JavaScript error detected', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })
    }

    const handleUnhandledRejection = (event) => {
      logger.error('Unhandled promise rejection', {
        reason: event.reason
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // 启动安全监控
    securityMonitor.start()

    logger.info('Security provider initialized', {
      environment: import.meta.env.MODE,
      httpsEnabled: securityConfig.https.enabled
    })

    return () => {
      // 停止安全监控
      securityMonitor.stop()
      
      // 清理事件监听器
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      
      // 清理CSP meta标签
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      if (cspMeta) {
        document.head.removeChild(cspMeta)
      }
    }
  }, [])

  return <>{children}</>
}

export default SecurityProvider