/**
 * FlowService V3 - Using backend proxy
 * Access Flow blockchain through backend proxy to completely solve CORS issues
 */

import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import config from '../config/environment.js';

class FlowServiceV3 {
  constructor() {
    this.isInitialized = false;
    this.backendUrl = config.API_BASE_URL || 'http://localhost:3002/api';
    this.flowAccessNode = 'https://rest-testnet.onflow.org';
    this.initializeFCL();
  }

  /**
   * Initialize FCL configuration - directly use Flow access node
   */
  async initializeFCL() {
    try {
      // Configure FCL to directly use Flow access node
      await fcl.config({
        'accessNode.api': this.flowAccessNode,
        'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
        'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/testnet/authn',
        'flow.network': 'testnet',
        'app.detail.title': 'FlowTune',
        'app.detail.icon': 'https://flowtune.app/favicon.ico'
      });

      this.isInitialized = true;
      console.log('✅ FlowService V3 initialized with backend proxy');
      return true;
    } catch (error) {
      console.error('❌ FlowService V3 initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Directly call backend proxy API
   */
  async callProxyAPI(endpoint, options = {}) {
    try {
      const url = `${this.proxyEndpoint}${endpoint}`;
      // Ensure fetch is correctly bound to window object
      const response = await window.fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Proxy API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Test network connection
   */
  async testConnection() {
    try {
      console.log('🔍 Testing Flow network connection via proxy...');
      
      // Test proxy status
      const proxyStatus = await this.callProxyAPI('/status');
      console.log('📡 Proxy status:', proxyStatus);

      // Test network parameters
      const networkParams = await this.callProxyAPI('/v1/network/parameters');
      console.log('🌐 Network parameters:', networkParams);

      // Test latest block
      const latestBlock = await this.callProxyAPI('/v1/blocks/sealed');
      console.log('📦 Latest block:', latestBlock);

      return {
        success: true,
        proxyStatus: proxyStatus,
        networkParams: networkParams.data,
        latestBlock: latestBlock.data,
        message: 'Flow network connection successful via proxy'
      };
    } catch (error) {
      console.error('❌ Flow network connection test failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Flow network connection failed'
      };
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus() {
    try {
      const [proxyStatus, networkParams] = await Promise.all([
        this.callProxyAPI('/status'),
        this.callProxyAPI('/v1/network/parameters')
      ]);

      return {
        success: true,
        isConnected: proxyStatus.success && networkParams.success,
        chainId: networkParams.data?.chain_id || 'unknown',
        proxyNode: proxyStatus.currentNode,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        isConnected: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Get current block height
   */
  async getCurrentBlockHeight() {
    try {
      const response = await this.callProxyAPI('/v1/blocks/sealed');
      return {
        success: true,
        height: response.data?.height || 0,
        blockId: response.data?.id
      };
    } catch (error) {
      console.error('Failed to get current block height:', error);
      return {
        success: false,
        height: 0,
        error: error.message
      };
    }
  }

  /**
   * Execute Cadence script
   */
  async executeScript(script, args = []) {
    try {
      const response = await this.callProxyAPI('/v1/scripts', {
        method: 'POST',
        body: {
          script: script,
          arguments: args
        }
      });

      return {
        success: true,
        result: response.data
      };
    } catch (error) {
      console.error('Script execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get account information
   */
  async getAccount(address) {
    try {
      const response = await this.callProxyAPI(`/v1/accounts/${address}`);
      return {
        success: true,
        account: response.data
      };
    } catch (error) {
      console.error('Failed to get account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user status (if wallet is connected)
   */
  async getUserStatus() {
    try {
      const user = await fcl.currentUser.snapshot();
      
      if (!user.loggedIn) {
        return {
          success: true,
          isLoggedIn: false,
          message: 'User not logged in'
        };
      }

      // Get user account information
      const accountInfo = await this.getAccount(user.addr);
      
      return {
        success: true,
        isLoggedIn: true,
        address: user.addr,
        account: accountInfo.success ? accountInfo.account : null
      };
    } catch (error) {
      console.error('Failed to get user status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Connect wallet
   */
  async connectWallet() {
    try {
      await fcl.authenticate();
      const user = await fcl.currentUser.snapshot();
      
      return {
        success: true,
        user: user,
        address: user.addr
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    try {
      await fcl.unauthenticate();
      return {
        success: true,
        message: 'Wallet disconnected'
      };
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Flow token total supply (example query)
   */
  async getFlowTokenSupply() {
    try {
      const script = `
        import FlowToken from 0x7e60df042a9c0868

        pub fun main(): UFix64 {
          return FlowToken.totalSupply
        }
      `;

      const result = await this.executeScript(script);
      
      if (result.success) {
        return {
          success: true,
          totalSupply: result.result,
          formatted: `${parseFloat(result.result).toLocaleString()} FLOW`
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to get Flow token supply:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Comprehensive health check
   */
  async healthCheck() {
    try {
      console.log('🏥 Starting FlowService V3 health check...');
      
      const results = {
        initialization: this.isInitialized,
        connection: null,
        networkStatus: null,
        blockHeight: null,
        tokenSupply: null
      };

      // Test connection
      const connectionTest = await this.testConnection();
      results.connection = connectionTest;

      // Get network status
      const networkStatus = await this.getNetworkStatus();
      results.networkStatus = networkStatus;

      // Get block height
      const blockHeight = await this.getCurrentBlockHeight();
      results.blockHeight = blockHeight;

      // Test script execution
      const tokenSupply = await this.getFlowTokenSupply();
      results.tokenSupply = tokenSupply;

      const allSuccess = results.connection.success && 
                        results.networkStatus.success && 
                        results.blockHeight.success && 
                        results.tokenSupply.success;

      console.log('🏥 Health check completed:', allSuccess ? '✅ HEALTHY' : '❌ UNHEALTHY');

      return {
        success: allSuccess,
        results: results,
        summary: allSuccess ? 'All systems operational' : 'Some systems have issues'
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        error: error.message,
        results: null
      };
    }
  }
}

// Create singleton instance
const flowServiceV3 = new FlowServiceV3();

export default flowServiceV3;