/**
 * FlowService API - Interact with Flow blockchain through backend API
 * This service handles Flow blockchain operations through backend API, avoiding the complexity of direct blockchain interaction in frontend
 */

import * as fcl from '@onflow/fcl';
import { flowConfig } from '../config/environment.js';
import logger from './logger.jsx';

class FlowServiceAPI {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.apiBaseUrl = flowConfig.network === 'emulator' 
      ? 'http://localhost:3002/api' 
      : 'https://api.flowtune.com/api';
    
    this.initializeFCL();
  }

  /**
   * Initialize FCL configuration
   */
  async initializeFCL() {
    try {
      if (flowConfig.network === 'emulator') {
        await fcl.config({
          'accessNode.api': 'http://localhost:8888',
          'discovery.wallet': 'http://localhost:8701/fcl/authn',
          'flow.network': 'emulator',
          'app.detail.title': 'FlowTune',
          'app.detail.icon': 'https://flowtune.app/favicon.ico'
        });
      } else {
        await fcl.config({
          'accessNode.api': flowConfig.accessNode,
          'discovery.wallet': flowConfig.discoveryWallet,
          'flow.network': flowConfig.network,
          'app.detail.title': 'FlowTune',
          'app.detail.icon': 'https://flowtune.app/favicon.ico'
        });
      }

      this.isInitialized = true;
      logger.info('✅ FlowService API initialized', { network: flowConfig.network });
      return true;
    } catch (error) {
      logger.error('❌ FlowService API initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Connect wallet
   */
  async connectWallet() {
    try {
      logger.info('🔗 Connecting wallet...');
      
      // Check if FCL is initialized
      if (!this.isInitialized) {
        await this.initializeFCL();
      }
      
      // Use FCL for wallet authentication
      const user = await fcl.authenticate();
      
      if (user && user.addr) {
        this.currentUser = user;
        logger.info('✅ Wallet connected successfully', { address: user.addr });
        return {
          success: true,
          user: user
        };
      } else {
        throw new Error('Failed to authenticate user - no address returned');
      }
    } catch (error) {
      logger.error('❌ Wallet connection failed:', error);
      
      // Provide more detailed error information
      let errorMessage = error.message;
      if (error.message.includes('User rejected')) {
        errorMessage = 'User rejected the wallet connection request';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please try again.';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message
      };
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    try {
      await fcl.unauthenticate();
      this.currentUser = null;
      logger.info('✅ Wallet disconnected');
      return { success: true };
    } catch (error) {
      logger.error('❌ Wallet disconnection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Mint NFT through backend API
   */
  async mintNFT(nftData, audioFile) {
    try {
      logger.info('🎵 Minting NFT via backend API...', { title: nftData.title });

      // Get authentication token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please login first.');
      }

      // Validate required NFT data
      if (!nftData.title || !nftData.description) {
        throw new Error('Title and description are required');
      }

      if (!audioFile) {
        throw new Error('Audio file is required');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('title', nftData.title);
      formData.append('description', nftData.description);
      formData.append('genre', nftData.genre || 'Unknown');
      formData.append('tags', JSON.stringify(nftData.tags || []));
      formData.append('price', nftData.price || '0');
      formData.append('royalty', nftData.royalty || '10');
      formData.append('audioFile', audioFile);

      // Send request to backend
      const response = await fetch(`${this.apiBaseUrl}/nft/mint`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Invalid response from server');
      }
      
      logger.info('✅ NFT minted successfully', { 
        tokenId: result.data.tokenId,
        transactionHash: result.data.transactionHash 
      });

      return {
        success: true,
        tokenId: result.data.tokenId,
        transactionHash: result.data.transactionHash,
        nft: result.data
      };

    } catch (error) {
      logger.error('❌ NFT minting failed:', error);
      
      // Provide more detailed error information
      let errorMessage = error.message;
      if (error.message.includes('Authentication')) {
        errorMessage = 'Please login to mint NFTs';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('413') || error.message.includes('too large')) {
        errorMessage = 'File too large. Please use a smaller audio file.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid request. Please check your input data.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message
      };
    }
  }

  /**
   * 获取用户的NFT列表
   */
  async getUserNFTs(userAddress = null) {
    try {
      const address = userAddress || this.currentUser?.addr;
      if (!address) {
        throw new Error('User address required');
      }

      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiBaseUrl}/nft/user/${address}`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user NFTs');
      }

      const result = await response.json();
      return {
        success: true,
        nfts: result.data || []
      };

    } catch (error) {
      logger.error('❌ Failed to fetch user NFTs:', error);
      return {
        success: false,
        error: error.message,
        nfts: []
      };
    }
  }

  /**
   * 获取NFT详情
   */
  async getNFTDetails(tokenId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/nft/${tokenId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NFT details');
      }

      const result = await response.json();
      return {
        success: true,
        nft: result.data
      };

    } catch (error) {
      logger.error('❌ Failed to fetch NFT details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查服务状态
   */
  async checkStatus() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'GET'
      });

      return {
        success: response.ok,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取账户余额
   */
  async getAccountBalance(address = null) {
    try {
      const userAddress = address || this.currentUser?.addr;
      if (!userAddress) {
        throw new Error('User address required');
      }

      // 在模拟器环境下，返回模拟余额
      if (flowConfig.network === 'emulator') {
        return {
          success: true,
          balance: '1000.0',
          currency: 'FLOW'
        };
      }

      // 实际的余额查询逻辑
      const balance = await fcl.query({
        cadence: `
          import FlowToken from 0x1654653399040a61
          import FungibleToken from 0xf233dcee88fe0abe

          pub fun main(address: Address): UFix64 {
            let account = getAccount(address)
            let vaultRef = account.getCapability(/public/flowTokenBalance)
              .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
              ?? panic("Could not borrow Balance reference to the Vault")
            
            return vaultRef.balance
          }
        `,
        args: (arg, t) => [arg(userAddress, t.Address)]
      });

      return {
        success: true,
        balance: balance.toString(),
        currency: 'FLOW'
      };

    } catch (error) {
      logger.error('❌ Failed to get account balance:', error);
      return {
        success: false,
        error: error.message,
        balance: '0',
        currency: 'FLOW'
      };
    }
  }
}

export default new FlowServiceAPI();