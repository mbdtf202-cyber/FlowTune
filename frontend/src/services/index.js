/**
 * Services Index - Service entry file
 * Choose between local mock services or network services based on configuration
 */

import { flowConfig } from '../config/environment.js';

// Choose Flow service based on configuration
let flowService;
if (flowConfig.demoMode || flowConfig.localMode) {
  const { getFlowServiceLocal } = await import('./flowServiceLocal.js');
  flowService = getFlowServiceLocal();
  console.log('🏠 Using local Flow service for demo mode');
} else {
  const { getFlowServiceV2 } = await import('./flowServiceV2.js');
  flowService = getFlowServiceV2();
  console.log('🌐 Using network Flow service');
}

// Choose music service based on configuration
let musicService;
if (flowConfig.demoMode || flowConfig.disableNetworkCalls) {
  const { getMusicServiceLocal } = await import('./musicServiceLocal.js');
  musicService = getMusicServiceLocal();
  console.log('🏠 Using local music service for demo mode');
} else {
  // Network version of music service can be imported here
  const { getMusicServiceLocal } = await import('./musicServiceLocal.js');
  musicService = getMusicServiceLocal();
  console.log('🌐 Using network music service (fallback to local)');
}

// Export service instances
export { flowService, musicService };

// Export service getter functions
export const getFlowService = () => flowService;
export const getMusicService = () => musicService;

// Initialize all services
export const initializeServices = async () => {
  try {
    console.log('🚀 Initializing services...');
    
    // Initialize Flow service
    if (flowService && typeof flowService.init === 'function') {
      await flowService.init();
    }
    
    console.log('✅ All services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    return false;
  }
};

// Get service status
export const getServicesStatus = () => {
  return {
    flow: {
      mode: flowConfig.demoMode ? 'demo' : 'network',
      status: flowService ? 'loaded' : 'not-loaded',
      initialized: flowService?.isReady?.() || false
    },
    music: {
      mode: flowConfig.demoMode ? 'demo' : 'network',
      status: musicService ? 'loaded' : 'not-loaded'
    },
    config: {
      demoMode: flowConfig.demoMode,
      localMode: flowConfig.localMode,
      disableNetworkCalls: flowConfig.disableNetworkCalls
    }
  };
};

// Default export
export default {
  flowService,
  musicService,
  getFlowService,
  getMusicService,
  initializeServices,
  getServicesStatus
};