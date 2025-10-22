import React, { useState, useCallback } from 'react'
import { sanitizeInput, validateFileType, validateFileSize } from '../config/security'
import logger from '../services/logger.jsx'

// 安全输入组件
const SecureInput = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  maxLength,
  allowedChars,
  sanitize = true,
  className = '',
  ...props 
}) => {
  const [error, setError] = useState('')

  const handleChange = useCallback((e) => {
    let inputValue = e.target.value

    // 长度验证
    if (maxLength && inputValue.length > maxLength) {
      setError(`输入长度不能超过 ${maxLength} 个字符`)
      return
    }

    // 字符验证
    if (allowedChars && !new RegExp(`^[${allowedChars}]*$`).test(inputValue)) {
      setError('包含不允许的字符')
      return
    }

    // 清理输入
    if (sanitize) {
      const originalValue = inputValue
      inputValue = sanitizeInput(inputValue)
      if (originalValue !== inputValue) {
        logger.warn('Input sanitized', { original: originalValue, sanitized: inputValue })
      }
    }

    setError('')
    onChange && onChange({ ...e, target: { ...e.target, value: inputValue } })
  }, [maxLength, allowedChars, sanitize, onChange])

  return (
    <div className="w-full">
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} ${error ? 'border-red-500' : ''}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}

// 安全文件上传组件
const SecureFileUpload = ({ 
  onFileSelect, 
  accept, 
  multiple = false,
  maxFiles = 1,
  className = '',
  children 
}) => {
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const validateFiles = useCallback((files) => {
    const fileArray = Array.from(files)

    // 检查文件数量
    if (fileArray.length > maxFiles) {
      setError(`最多只能上传 ${maxFiles} 个文件`)
      return false
    }

    // 验证每个文件
    for (const file of fileArray) {
      if (!validateFileType(file)) {
        setError(`文件类型 ${file.type} 不被支持`)
        return false
      }

      if (!validateFileSize(file)) {
        setError(`文件 ${file.name} 大小超过限制`)
        return false
      }
    }

    return true
  }, [maxFiles])

  const handleFileChange = useCallback((e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (validateFiles(files)) {
        setError('')
        onFileSelect && onFileSelect(multiple ? Array.from(files) : files[0])
        logger.info('Files selected', { count: files.length })
      }
    }
  }, [validateFiles, multiple, onFileSelect])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      if (validateFiles(files)) {
        setError('')
        onFileSelect && onFileSelect(multiple ? Array.from(files) : files[0])
        logger.info('Files dropped', { count: files.length })
      }
    }
  }, [validateFiles, multiple, onFileSelect])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  return (
    <div className="w-full">
      <div
        className={`
          ${className}
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${error ? 'border-red-500' : ''}
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        {children || (
          <div>
            <p className="text-gray-600">
              点击或拖拽文件到此处上传
            </p>
            <p className="text-sm text-gray-400 mt-2">
              支持的格式: {accept}
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}

// 安全文本区域组件
const SecureTextarea = ({ 
  value, 
  onChange, 
  placeholder,
  maxLength = 1000,
  sanitize = true,
  className = '',
  ...props 
}) => {
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(value ? value.length : 0)

  const handleChange = useCallback((e) => {
    let inputValue = e.target.value

    // 长度验证
    if (inputValue.length > maxLength) {
      setError(`输入长度不能超过 ${maxLength} 个字符`)
      return
    }

    // 清理输入
    if (sanitize) {
      const originalValue = inputValue
      inputValue = sanitizeInput(inputValue)
      if (originalValue !== inputValue) {
        logger.warn('Textarea input sanitized', { original: originalValue, sanitized: inputValue })
      }
    }

    setError('')
    setCharCount(inputValue.length)
    onChange && onChange({ ...e, target: { ...e.target, value: inputValue } })
  }, [maxLength, sanitize, onChange])

  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} ${error ? 'border-red-500' : ''}`}
        {...props}
      />
      <div className="flex justify-between items-center mt-1">
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        <p className={`text-sm ml-auto ${charCount > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
          {charCount}/{maxLength}
        </p>
      </div>
    </div>
  )
}

export { SecureInput, SecureFileUpload, SecureTextarea }