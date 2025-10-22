/**
 * Enhanced Security Middleware
 * Provides XSS protection, input validation, and other security measures
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import logger from '../utils/logger.js';

// XSS Protection Middleware
export const xssProtection = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Recursive object sanitization
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? DOMPurify.sanitize(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = DOMPurify.sanitize(key);
    sanitized[sanitizedKey] = sanitizeObject(value);
  }
  
  return sanitized;
}

// Input validation middleware
export const validateInput = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Input validation failed', {
        ip: req.ip,
        path: req.path,
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      });
    }
    
    next();
  };
};

// Common validation rules
export const validationRules = {
  // User input validation
  userInput: [
    body('title').optional().isLength({ min: 1, max: 200 }).trim().escape(),
    body('description').optional().isLength({ max: 1000 }).trim().escape(),
    body('artist').optional().isLength({ min: 1, max: 100 }).trim().escape(),
    body('genre').optional().isLength({ min: 1, max: 50 }).trim().escape(),
    body('prompt').optional().isLength({ min: 1, max: 500 }).trim().escape()
  ],
  
  // URL validation
  urlValidation: [
    body('audioURL').optional().isURL({ protocols: ['http', 'https'] }),
    body('coverImageURL').optional().isURL({ protocols: ['http', 'https'] }),
    body('websiteURL').optional().isURL({ protocols: ['http', 'https'] })
  ],
  
  // Numeric validation
  numericValidation: [
    body('duration').optional().isFloat({ min: 0, max: 3600 }),
    body('price').optional().isFloat({ min: 0 }),
    body('royaltyPercentage').optional().isFloat({ min: 0, max: 1 })
  ],
  
  // Address validation (Flow blockchain addresses)
  addressValidation: [
    body('address').optional().matches(/^0x[a-fA-F0-9]{16}$/).withMessage('Invalid Flow address format')
  ]
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      connectSrc: ["'self'", "ws://localhost:*", "wss://localhost:*", "https://api.openai.com", "https://gateway.pinata.cloud"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Enhanced rate limiting with different tiers
export const createRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json(options.message || defaultOptions.message);
    }
  };
  
  return rateLimit({ ...defaultOptions, ...options });
};

// Specific rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limit
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  }),
  
  // Strict rate limit for AI generation
  aiGeneration: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: {
      success: false,
      error: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI generation limit exceeded. Please try again in an hour.'
    }
  }),
  
  // Authentication rate limit
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
      success: false,
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.'
    }
  }),
  
  // Upload rate limit
  upload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: {
      success: false,
      error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many upload requests. Please wait before uploading again.'
    }
  }),
  
  // Blockchain operations rate limit
  blockchain: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: {
      success: false,
      error: 'BLOCKCHAIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many blockchain requests. Please wait before trying again.'
    }
  })
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  
  next();
};

// SQL Injection prevention (for future database queries)
export const sqlInjectionPrevention = (req, res, next) => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /('|(\\')|(;)|(\\;)|(\|)|(\*)|(%)|(<)|(>)|(\{)|(\})|(\[)|(\]))/i,
    /((\%3C)|(<)).*script.*((\%3E)|(>))/i,
    /((\%3C)|(<)).*iframe.*((\%3E)|(>))/i
  ];
  
  const checkForSQLInjection = (obj) => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSQLInjection(value));
    }
    
    return false;
  };
  
  if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
    logger.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    return res.status(400).json({
      success: false,
      error: 'INVALID_INPUT',
      message: 'Invalid characters detected in input'
    });
  }
  
  next();
};

// File upload security
export const fileUploadSecurity = (req, res, next) => {
  if (req.file || req.files) {
    const files = req.files || [req.file];
    
    for (const file of files) {
      if (!file) continue;
      
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'FILE_TOO_LARGE',
          message: 'File size exceeds 50MB limit'
        });
      }
      
      // Check file type
      const allowedMimeTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/mp3',
        'audio/mp4',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_FILE_TYPE',
          message: 'File type not allowed'
        });
      }
      
      // Sanitize filename
      file.originalname = DOMPurify.sanitize(file.originalname);
    }
  }
  
  next();
};

export default {
  xssProtection,
  validateInput,
  validationRules,
  securityHeaders,
  rateLimiters,
  requestLogger,
  sqlInjectionPrevention,
  fileUploadSecurity
};