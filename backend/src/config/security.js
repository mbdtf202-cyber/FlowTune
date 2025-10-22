/**
 * 安全配置文件
 * 集中管理所有安全相关的配置
 */

export const securityConfig = {
  // 速率限制配置
  rateLimits: {
    general: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 每个IP最多100次请求
      message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后重试'
      }
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 10, // 每个IP最多10次认证请求
      message: {
        success: false,
        error: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: '认证请求过于频繁，请稍后重试'
      }
    },
    aiGeneration: {
      windowMs: 60 * 60 * 1000, // 1小时
      max: 50, // 每个IP最多50次AI生成请求
      message: {
        success: false,
        error: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'AI生成请求过于频繁，请稍后重试'
      }
    },
    upload: {
      windowMs: 10 * 60 * 1000, // 10分钟
      max: 20, // 每个IP最多20次上传请求
      message: {
        success: false,
        error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        message: '上传请求过于频繁，请稍后重试'
      }
    },
    blockchain: {
      windowMs: 5 * 60 * 1000, // 5分钟
      max: 10, // 每个IP最多10次区块链操作
      message: {
        success: false,
        error: 'BLOCKCHAIN_RATE_LIMIT_EXCEEDED',
        message: '区块链操作过于频繁，请稍后重试'
      }
    }
  },

  // 文件上传安全配置
  fileUpload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedAudioTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/mp4',
      'audio/aac',
      'audio/ogg'
    ],
    allowedImageTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    maxFilenameLength: 255,
    sanitizeFilename: true
  },

  // XSS防护配置
  xssProtection: {
    enabled: true,
    sanitizeBody: true,
    sanitizeQuery: true,
    sanitizeParams: true,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {}
  },

  // CORS配置
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3002',
      process.env.CORS_ORIGIN || 'http://localhost:5173'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  },

  // 安全头部配置
  securityHeaders: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.pinata.cloud", "https://gateway.pinata.cloud", "wss:", "ws:"],
        mediaSrc: ["'self'", "https:", "blob:", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: "no-referrer",
    xssFilter: true
  },

  // 输入验证配置
  validation: {
    maxStringLength: 1000,
    maxArrayLength: 100,
    maxObjectDepth: 5,
    allowedFlowAddressPattern: /^0x[a-fA-F0-9]{16}$/,
    allowedUsernamePattern: /^[a-zA-Z0-9_-]{3,30}$/,
    allowedEmailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  // 日志记录配置
  logging: {
    logSecurityEvents: true,
    logFailedAttempts: true,
    logRateLimitExceeded: true,
    logSuspiciousActivity: true,
    maxLogSize: 100 * 1024 * 1024, // 100MB
    logRetentionDays: 30
  },

  // 监控和告警配置
  monitoring: {
    enableRealTimeMonitoring: true,
    alertThresholds: {
      failedLoginAttempts: 5,
      rateLimitExceeded: 10,
      suspiciousFileUploads: 3,
      blockchainErrors: 5
    },
    alertCooldown: 5 * 60 * 1000 // 5分钟冷却期
  }
};

export default securityConfig;