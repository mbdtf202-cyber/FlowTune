// Environment configuration management
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:3002/api',
    WS_URL: 'ws://localhost:3002/ws',
    FLOW_NETWORK: 'emulator',
    FLOW_ACCESS_NODE: 'http://localhost:8888',
    FLOW_DISCOVERY_WALLET: 'http://localhost:8701/fcl/authn',
    IPFS_GATEWAY: 'https://ipfs.io/ipfs/',
    ENABLE_LOGGING: true,
    ENABLE_DEBUG: true,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'flac', 'aac'],
    SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    ANALYTICS_ENABLED: false,
    ERROR_REPORTING_ENABLED: false,
    LOCAL_DEMO_MODE: false, // Disable local demo mode, use real Flow
    DISABLE_NETWORK_CALLS: false // Enable network calls
  },

  demo: {
    API_BASE_URL: 'http://localhost:3002/api',
    WS_URL: 'ws://localhost:3002/ws',
    FLOW_NETWORK: 'local',
    FLOW_ACCESS_NODE: 'local',
    FLOW_DISCOVERY_WALLET: 'local',
    IPFS_GATEWAY: 'local',
    ENABLE_LOGGING: true,
    ENABLE_DEBUG: true,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'flac', 'aac'],
    SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    ANALYTICS_ENABLED: false,
    ERROR_REPORTING_ENABLED: false,
    LOCAL_DEMO_MODE: true,
    DISABLE_NETWORK_CALLS: true
  },
  
  testing: {
    API_BASE_URL: 'https://api-test.flowtune.com/api',
    WS_URL: 'wss://ws-test.flowtune.com',
    FLOW_NETWORK: 'testnet',
    FLOW_ACCESS_NODE: 'https://rest-testnet.onflow.org',
    FLOW_DISCOVERY_WALLET: 'https://fcl-discovery.onflow.org/testnet/authn',
    IPFS_GATEWAY: 'https://ipfs.io/ipfs/',
    ENABLE_LOGGING: true,
    ENABLE_DEBUG: false,
    CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'flac', 'aac'],
    SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    ANALYTICS_ENABLED: true,
    ERROR_REPORTING_ENABLED: true
  },
  
  production: {
    API_BASE_URL: 'https://api.flowtune.com/api',
    WS_URL: 'wss://ws.flowtune.com',
    FLOW_NETWORK: 'mainnet',
    FLOW_ACCESS_NODE: 'https://rest-mainnet.onflow.org',
    FLOW_DISCOVERY_WALLET: 'https://fcl-discovery.onflow.org/authn',
    IPFS_GATEWAY: 'https://gateway.pinata.cloud/ipfs/',
    ENABLE_LOGGING: false,
    ENABLE_DEBUG: false,
    CACHE_DURATION: 60 * 60 * 1000, // 1 hour
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'flac', 'aac'],
    SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    ANALYTICS_ENABLED: true,
    ERROR_REPORTING_ENABLED: true
  }
};

// Get current environment
const getCurrentEnvironment = () => {
  // Use environment variable first
  if (import.meta.env.VITE_ENVIRONMENT) {
    return import.meta.env.VITE_ENVIRONMENT;
  }
  
  // Determine environment based on domain
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('test') || hostname.includes('staging')) {
      return 'testing';
    } else if (hostname.includes('vercel.app')) {
      // Use demo mode for Vercel deployment to avoid calling non-existent backend
      return 'demo';
    } else {
      return 'production';
    }
  }
  
  // Default to development environment
  return 'development';
};

// Get configuration
const getConfig = () => {
  const env = getCurrentEnvironment();
  const config = environments[env] || environments.development;
  
  // Check if local development mode is enabled
  const localDevMode = import.meta.env.VITE_LOCAL_DEV_MODE === 'true';
  const disableFlowNetwork = import.meta.env.VITE_DISABLE_FLOW_NETWORK === 'true';
  const localDemoMode = import.meta.env.VITE_LOCAL_DEMO_MODE === 'true';
  const disableNetworkCalls = import.meta.env.VITE_DISABLE_NETWORK_CALLS === 'true';
  
  // Allow environment variables to override configuration
  const finalConfig = {
    ...config,
    API_BASE_URL: import.meta.env.VITE_API_URL || config.API_BASE_URL,
    WS_URL: import.meta.env.VITE_WS_URL || config.WS_URL,
    FLOW_NETWORK: import.meta.env.VITE_FLOW_NETWORK || config.FLOW_NETWORK,
    FLOW_ACCESS_NODE: import.meta.env.VITE_FLOW_ACCESS_NODE || config.FLOW_ACCESS_NODE,
    FLOW_DISCOVERY_WALLET: import.meta.env.VITE_FLOW_DISCOVERY_WALLET || config.FLOW_DISCOVERY_WALLET,
    IPFS_GATEWAY: import.meta.env.VITE_IPFS_GATEWAY || config.IPFS_GATEWAY,
    ENVIRONMENT: env,
    LOCAL_DEV_MODE: localDevMode,
    DISABLE_FLOW_NETWORK: disableFlowNetwork,
    LOCAL_DEMO_MODE: localDemoMode,
    DISABLE_NETWORK_CALLS: disableNetworkCalls
  };
  
  // If local development mode or demo mode is enabled, disable Flow network functionality
  if (localDevMode || disableFlowNetwork || localDemoMode) {
    finalConfig.FLOW_NETWORK = 'local';
    finalConfig.FLOW_ACCESS_NODE = null;
    finalConfig.FLOW_DISCOVERY_WALLET = null;
    console.log('🏠 Local mode enabled, Flow network connection disabled', { localDevMode, disableFlowNetwork, localDemoMode });
  }
  
  return finalConfig;
};

// Configuration validation
const validateConfig = (config) => {
  // Skip Flow network related validation in local development mode
  if (config.LOCAL_DEV_MODE || config.DISABLE_FLOW_NETWORK) {
    console.log('🏠 Local development mode: Skip Flow network configuration validation');
    
    const requiredFields = ['API_BASE_URL'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }
    
    return; // Skip other validations
  }
  
  const requiredFields = [
    'API_BASE_URL',
    'WS_URL',
    'FLOW_NETWORK',
    'FLOW_ACCESS_NODE'
  ];
  
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
  }
  
  // Validate URL format (exclude FLOW_ACCESS_NODE as FCL has special handling for this field)
  const urlFields = ['API_BASE_URL', 'WS_URL', 'IPFS_GATEWAY'];
  urlFields.forEach(field => {
    if (config[field]) {
      try {
        new URL(config[field]);
      } catch (error) {
        throw new Error(`Invalid URL configuration ${field}: ${config[field]}`);
      }
    }
  });
  
  // Validate Flow network
  const validNetworks = ['mainnet', 'testnet', 'emulator', 'local'];
  if (!validNetworks.includes(config.FLOW_NETWORK)) {
    throw new Error(`Invalid Flow network configuration: ${config.FLOW_NETWORK}`);
  }
};

// Export configuration
const config = getConfig();

// Validate configuration in development environment
if (config.ENABLE_DEBUG) {
  try {
    validateConfig(config);
    console.log('✅ Configuration validation passed:', config);
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
  }
}

export default config;

// Convenience function to get API URL
const getApiUrl = () => {
  return config.API_BASE_URL.replace('/api', '');
};

// Export utility functions
export {
  getCurrentEnvironment,
  getConfig,
  validateConfig,
  environments,
  getApiUrl
};

// Convenient access to specific configurations
export const isDevelopment = config.ENVIRONMENT === 'development';
export const isTesting = config.ENVIRONMENT === 'testing';
export const isProduction = config.ENVIRONMENT === 'production';

// API配置
export const apiConfig = {
  baseURL: config.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// WebSocket配置
export const wsConfig = {
  url: config.WS_URL,
  reconnectAttempts: 5,
  reconnectInterval: 3000
};

// Flow blockchain configuration
export const flowConfig = {
  network: config.FLOW_NETWORK,
  accessNode: config.FLOW_ACCESS_NODE,
  discoveryWallet: config.FLOW_DISCOVERY_WALLET,
  localMode: config.LOCAL_DEV_MODE || config.DISABLE_FLOW_NETWORK || config.LOCAL_DEMO_MODE,
  demoMode: config.LOCAL_DEMO_MODE,
  disableNetworkCalls: config.DISABLE_NETWORK_CALLS,
  contracts: {
    // Contract address configuration
    BasicMusicNFT: config.FLOW_NETWORK === 'mainnet' 
      ? '0x...' // Mainnet contract address
      : config.FLOW_NETWORK === 'emulator'
      ? '0xf8d6e0586b0a20c7' // Emulator contract address
      : '0x...' // Testnet contract address
  }
};

// File upload configuration
export const uploadConfig = {
  maxFileSize: config.MAX_FILE_SIZE,
  supportedAudioFormats: config.SUPPORTED_AUDIO_FORMATS,
  supportedImageFormats: config.SUPPORTED_IMAGE_FORMATS,
  ipfsGateway: config.IPFS_GATEWAY
};

// Cache configuration
export const cacheConfig = {
  duration: config.CACHE_DURATION,
  maxSize: 100, // Maximum cache entries
  storageKey: 'flowtune_cache'
};

// Logging configuration
export const logConfig = {
  enabled: config.ENABLE_LOGGING,
  level: config.ENABLE_DEBUG ? 'debug' : 'info',
  maxLogs: 1000
};