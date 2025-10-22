// Security configuration
export const securityConfig = {
  // HTTPS configuration
  https: {
    enabled: import.meta.env.MODE === 'production',
    redirectHttp: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  },

  // CORS configuration
  cors: {
    origin: import.meta.env.MODE === 'production' 
      ? ['https://flowtune.app', 'https://www.flowtune.app']
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // CSP (Content Security Policy) configuration
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for development environment, should be removed in production
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com'
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    imgSrc: [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    connectSrc: [
      "'self'",
      'https://access-mainnet-beta.onflow.org',
      'https://rest-mainnet.onflow.org',
      'wss://access-mainnet-beta.onflow.org'
    ],
    mediaSrc: [
      "'self'",
      'blob:',
      'https:'
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"]
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum 100 requests per IP
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Session configuration
  session: {
    secret: import.meta.env.VITE_SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: import.meta.env.MODE === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    }
  },

  // File upload security configuration
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    maxFiles: 10
  },

  // API security configuration
  api: {
    timeout: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 1000
  }
}

// Get CSP string
export const getCSPString = () => {
  const { csp } = securityConfig
  return Object.entries(csp)
    .map(([directive, sources]) => {
      const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${kebabDirective} ${sources.join(' ')}`
    })
    .join('; ')
}

// Validate file type
export const validateFileType = (file) => {
  return securityConfig.upload.allowedMimeTypes.includes(file.type)
}

// Validate file size
export const validateFileSize = (file) => {
  return file.size <= securityConfig.upload.maxFileSize
}

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// Generate secure random string
export const generateSecureToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default securityConfig