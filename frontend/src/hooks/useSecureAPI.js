import { useState, useCallback, useRef } from 'react'
import { securityConfig } from '../config/security'
import logger from '../services/logger.jsx'

// 安全API调用Hook
const useSecureAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)
  const retryCountRef = useRef(0)

  // 安全的API请求
  const secureRequest = useCallback(async (url, options = {}) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 创建新的AbortController
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)

    try {
      // 设置默认选项
      const secureOptions = {
        ...options,
        signal: abortControllerRef.current.signal,
        timeout: securityConfig.api.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers
        }
      }

      // 添加CSRF保护
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      if (csrfToken) {
        secureOptions.headers['X-CSRF-Token'] = csrfToken
      }

      // 验证URL
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided')
      }

      // 防止SSRF攻击 - 只允许相对URL或同域URL
      const urlObj = new URL(url, window.location.origin)
      if (urlObj.origin !== window.location.origin && !url.startsWith('/')) {
        throw new Error('Cross-origin requests are not allowed')
      }

      logger.info('Making secure API request', { 
        url: urlObj.pathname, 
        method: secureOptions.method || 'GET' 
      })

      // 创建带超时的Promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), securityConfig.api.timeout)
      })

      const fetchPromise = window.fetch(urlObj.href, secureOptions)

      const response = await Promise.race([fetchPromise, timeoutPromise])

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // 验证响应头
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('application/json')) {
        logger.warn('Unexpected content type', { contentType })
      }

      const data = await response.json()
      
      // 重置重试计数
      retryCountRef.current = 0
      
      logger.info('API request successful', { url: urlObj.pathname })
      return data

    } catch (err) {
      // 如果是取消的请求，不处理错误
      if (err.name === 'AbortError') {
        logger.info('Request aborted', { url })
        return null
      }

      logger.error('API request failed', err, { 
        url, 
        retryCount: retryCountRef.current 
      })

      // 自动重试逻辑
      if (retryCountRef.current < securityConfig.api.maxRetries) {
        retryCountRef.current++
        
        // 指数退避
        const delay = securityConfig.api.retryDelay * Math.pow(2, retryCountRef.current - 1)
        
        logger.info('Retrying request', { 
          url, 
          retryCount: retryCountRef.current, 
          delay 
        })

        await new Promise(resolve => setTimeout(resolve, delay))
        return secureRequest(url, options)
      }

      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // GET请求
  const get = useCallback((url, options = {}) => {
    return secureRequest(url, { ...options, method: 'GET' })
  }, [secureRequest])

  // POST请求
  const post = useCallback((url, data, options = {}) => {
    return secureRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
  }, [secureRequest])

  // PUT请求
  const put = useCallback((url, data, options = {}) => {
    return secureRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }, [secureRequest])

  // DELETE请求
  const del = useCallback((url, options = {}) => {
    return secureRequest(url, { ...options, method: 'DELETE' })
  }, [secureRequest])

  // 取消请求
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      logger.info('Request cancelled by user')
    }
  }, [])

  // 清理错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    secureRequest,
    get,
    post,
    put,
    delete: del,
    cancel,
    clearError
  }
}

// 防抖Hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useCallback(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// 节流Hook
const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastRan = useRef(Date.now())

  useCallback(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

export { useSecureAPI, useDebounce, useThrottle }