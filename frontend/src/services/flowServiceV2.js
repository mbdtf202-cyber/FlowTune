import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import config, { flowConfig } from '../config/environment';

// Check if in local mode
const isLocalMode = flowConfig.demoMode || flowConfig.localMode || flowConfig.disableNetworkCalls;

// Network connection manager
class NetworkManager {
  constructor() {
    this.accessNodes = [
      'https://access-testnet.onflow.org', // Primary node
      'https://rest-testnet.onflow.org', // Backup node
    ];
    this.currentNodeIndex = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Get current access node
  getCurrentNode() {
    return this.accessNodes[this.currentNodeIndex];
  }

  // Switch to next access node
  switchToNextNode() {
    this.currentNodeIndex = (this.currentNodeIndex + 1) % this.accessNodes.length;
    console.log(`🔄 Switching to access node: ${this.getCurrentNode()}`);
  }

  // Reset to first node
  resetToFirstNode() {
    this.currentNodeIndex = 0;
  }

  // Network request with retry
  async fetchWithRetry(url, options = {}, retryCount = 0) {
    const fullUrl = url.startsWith('http') ? url : `${this.getCurrentNode()}${url}`;
    
    try {
      console.log(`🌐 Sending request: ${fullUrl} (attempt ${retryCount + 1}/${this.maxRetries + 1})`);
      
      const response = await window.fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Request successful: ${fullUrl}`);
      return response;
      
    } catch (error) {
      console.error(`❌ Request failed: ${fullUrl}`, error.message);
      
      if (retryCount < this.maxRetries) {
        // If network error, try switching nodes
        if (error.name === 'TypeError' || error.message.includes('fetch')) {
          this.switchToNextNode();
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      
      throw error;
    }
  }
}

// FCL configuration manager
class FCLManager {
  constructor(networkManager) {
    this.networkManager = networkManager;
    this.isConfigured = false;
  }

  // Configure FCL
  configure() {
    try {
      const currentNode = this.networkManager.getCurrentNode();
      
      fcl.config({
        'flow.network': 'testnet',
        'accessNode.api': currentNode,
        'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
        'app.detail.title': 'FlowTune',
        'app.detail.icon': 'https://flowtune.com/icon.png'
      });

      this.isConfigured = true;
      console.log(`✅ FCL configured with node: ${currentNode}`);
    } catch (error) {
      console.error('❌ FCL configuration failed:', error);
      throw error;
    }
  }

  // Reconfigure FCL (when switching nodes)
  reconfigure() {
    this.isConfigured = false;
    this.configure();
  }

  // Execute FCL query
  async query(cadence, args = []) {
    if (!this.isConfigured) {
      throw new Error('FCL not configured');
    }

    try {
      console.log('🔍 Executing FCL query...');
      const result = await fcl.query({
        cadence,
        args
      });
      console.log('✅ FCL query successful');
      return result;
    } catch (error) {
      console.error('❌ FCL query failed:', error);
      
      // If access node error, try switching nodes and reconfigure
      if (error.message.includes('access') || error.message.includes('network')) {
        console.log('🔄 Trying to switch access node...');
        this.networkManager.switchToNextNode();
        this.reconfigure();
        
        // Retry once
        try {
          console.log('🔄 Retrying FCL query...');
          const result = await fcl.query({
            cadence,
            args
          });
          console.log('✅ FCL query retry successful');
          return result;
        } catch (retryError) {
          console.error('❌ FCL query retry failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }
}

// New version of FlowService
class FlowServiceV2 {
  constructor() {
    this.networkManager = new NetworkManager();
    this.fclManager = new FCLManager(this.networkManager);
    this.currentUser = null;
    this.isInitialized = false;
  }

  // Initialize service
  async init() {
    if (isLocalMode) {
      console.log('🏠 Local mode enabled, skipping Flow network initialization');
      this.isInitialized = true;
      return;
    }

    try {
      console.log('🚀 Initializing FlowServiceV2...');
      
      // Configure FCL
      this.fclManager.configure();
      
      // Test network connection
      await this.testConnection();
      
      // Listen for user state
      fcl.currentUser.subscribe(user => {
        console.log('👤 User state changed:', user);
        this.currentUser = user;
      });

      this.isInitialized = true;
      console.log('✅ FlowServiceV2 initialized successfully');
    } catch (error) {
      console.error('❌ FlowServiceV2 initialization failed:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      console.log('🔍 Testing Flow network connection...');
      
      const cadence = `
        pub fun main(): UInt64 {
          return getCurrentBlock().height
        }
      `;
      
      const blockHeight = await this.fclManager.query(cadence);
      console.log(`✅ Connection successful, current block height: ${blockHeight}`);
      return blockHeight;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // User authentication
  async authenticate() {
    if (isLocalMode) {
      console.log('🏠 Local mode: Simulating authentication');
      return { addr: '0x1234567890abcdef', loggedIn: true };
    }

    try {
      console.log('🔐 Starting user authentication...');
      const user = await fcl.authenticate();
      console.log('✅ Authentication successful:', user);
      return user;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  // User logout
  async unauthenticate() {
    if (isLocalMode) {
      console.log('🏠 Local mode: Simulating logout');
      return;
    }

    try {
      console.log('🚪 Logging out user...');
      await fcl.unauthenticate();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  // Get account information
  async getAccount(address) {
    if (isLocalMode) {
      console.log('🏠 Local mode: Returning mock account');
      return { address, balance: 100.0 };
    }

    try {
      console.log(`🔍 Getting account information: ${address}`);
      const account = await fcl.account(address);
      console.log('✅ Account information retrieved:', account);
      return account;
    } catch (error) {
      console.error('❌ Failed to get account information:', error);
      throw error;
    }
  }

  // Get current block height
  async getCurrentBlockHeight() {
    if (isLocalMode) {
      console.log('🏠 Local mode: Returning mock block height');
      return Math.floor(Date.now() / 1000);
    }

    try {
      const cadence = `
        pub fun main(): UInt64 {
          return getCurrentBlock().height
        }
      `;
      const height = await this.fclManager.query(cadence);
      return height;
    } catch (error) {
      console.error('❌ Failed to get block height:', error);
      throw error;
    }
  }

  // Get network status
  getNetworkStatus() {
    return {
      isInitialized: this.isInitialized,
      currentNode: this.networkManager.getCurrentNode(),
      isLocalMode,
      user: this.currentUser
    };
  }
}

// Create singleton instance
let flowServiceV2Instance = null;

export const getFlowServiceV2 = () => {
  if (!flowServiceV2Instance) {
    flowServiceV2Instance = new FlowServiceV2();
  }
  return flowServiceV2Instance;
};

export default getFlowServiceV2();

// Export FCL and types
export { fcl, t };