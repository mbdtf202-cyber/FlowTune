/**
 * API Service for FlowTune Backend
 * Handles all HTTP requests to the backend API
 */

import ipfsService from './ipfs'
import blockchainService from './blockchain'
import flowService from './flowService'
import flowServiceAPI from './flowServiceAPI'
import musicServiceLocal from './musicLocal'
import forteActionsServiceLocal from './forteActionsLocal'
import logger from './logger.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.flowService = null
    
    // Check if in local mode
    this.isLocalMode = import.meta.env.VITE_LOCAL_DEMO_MODE === 'true' || 
                       import.meta.env.VITE_DISABLE_NETWORK_CALLS === 'true'
    
    if (this.isLocalMode) {
      console.log('🏠 API Service: Running in local demo mode')
    }
    
    this.initializeFlowService()
  }

  async initializeFlowService() {
    try {
      this.flowService = flowService
      logger.info('FlowService initialized in ApiService')
    } catch (error) {
      logger.error('Failed to initialize FlowService in ApiService', error)
    }
  }

  async request(endpoint, options = {}) {
    // If in local mode, return mock data
    if (this.isLocalMode) {
      return this.getMockResponse(endpoint, options)
    }
    
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await window.fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  /**
   * Get mock response data
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Mock response
   */
  async getMockResponse(endpoint, options = {}) {
    console.log('🏠 API Service: Returning mock response for', endpoint)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500))
    
    // Return different mock data based on endpoint
    if (endpoint.includes('/health')) {
      return { status: 'ok', timestamp: new Date().toISOString() }
    }
    
    if (endpoint.includes('/ai/models')) {
      return {
        models: [
          { id: 'local-demo-v1', name: 'Local Demo Model v1.0', description: 'Demo music generation model' }
        ]
      }
    }
    
    if (endpoint.includes('/music/metadata')) {
      return {
        title: 'Demo Track',
        artist: 'Demo Artist',
        genre: 'Demo',
        duration: 180,
        hash: 'demo-hash-123'
      }
    }
    
    if (endpoint.includes('/music/validate')) {
      return { valid: true, message: 'Validation successful' }
    }
    
    if (endpoint.includes('/user/profile/')) {
      // Extract user ID from endpoint
      const userId = endpoint.split('/user/profile/')[1]
      return {
        success: true,
        data: {
          id: userId,
          username: userId === 'demo_user' ? 'demo_user' : `user_${userId}`,
          displayName: userId === 'demo_user' ? 'Demo User' : `User ${userId}`,
          bio: 'Welcome to FlowTune! This is a demo profile showcasing the music NFT platform.',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
          joinDate: '2024-01-01T00:00:00.000Z',
          location: 'Digital World',
          website: 'https://flowtune.app',
          stats: {
            totalTracks: 5,
            totalPlays: 1250,
            totalLikes: 89,
            followers: 42,
            totalNFTs: 3,
            totalEarnings: '12.5',
            totalTransactions: 8
          },
          badges: [
            { name: 'Early Adopter', icon: '🚀', description: 'One of the first users on FlowTune' },
            { name: 'Creator', icon: '🎵', description: 'Created multiple music NFTs' }
          ]
        }
      }
    }

    if (endpoint.includes('/nft/profile/')) {
      // Extract user ID from endpoint
      const userId = endpoint.split('/nft/profile/')[1]
      return {
        success: true,
        data: [
          {
            id: 'demo-nft-1',
            title: 'Sunset Melody',
            genre: 'Ambient',
            createdAt: '2024-01-15T10:30:00.000Z',
            plays: 450,
            likes: 32,
            shares: 8,
            isPublic: true,
            coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
            audioUrl: '/demo-audio/sunset-melody.mp3',
            price: '2.5',
            creator: userId
          },
          {
            id: 'demo-nft-2',
            title: 'Digital Dreams',
            genre: 'Electronic',
            createdAt: '2024-01-20T14:15:00.000Z',
            plays: 320,
            likes: 28,
            shares: 5,
            isPublic: true,
            coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
            audioUrl: '/demo-audio/digital-dreams.mp3',
            price: '1.8',
            creator: userId
          },
          {
            id: 'demo-nft-3',
            title: 'Private Session',
            genre: 'Jazz',
            createdAt: '2024-01-25T16:45:00.000Z',
            plays: 180,
            likes: 15,
            shares: 2,
            isPublic: false,
            coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
            audioUrl: '/demo-audio/private-session.mp3',
            price: '3.0',
            creator: userId
          }
        ]
      }
    }

    if (endpoint.includes('/nft')) {
      return {
        nfts: [],
        total: 0,
        page: 1,
        limit: 20
      }
    }
    
    // Default success response
    return {
      success: true,
      message: 'Mock response',
      data: {}
    }
  }

  // Music Generation API
  async generateMusic(prompt, options = {}) {
    // If in local mode, use local music generation service
    if (this.isLocalMode) {
      const params = {
        prompt,
        title: options.title || '',
        artist: options.artist || '',
        genre: options.genre || '',
        duration: options.duration || 30,
        ...options
      }
      
      const result = await musicServiceLocal.generateMusic(params)
      
      if (result.success) {
        return {
          success: true,
          data: {
            id: result.track.id,
            title: result.track.title,
            artist: result.track.artist,
            genre: result.track.genre,
            duration: result.track.duration,
            audioFile: result.audioFile,
            audioUrl: result.audioUrl,
            metadata: result.metadata,
            track: result.track
          }
        }
      } else {
        throw new Error(result.error)
      }
    }

    const payload = {
      prompt,
      title: options.title || '',
      artist: options.artist || '',
      genre: options.genre || '',
      duration: options.duration || 30,
      ...options
    }

    return this.request('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  // Music Upload API
  async uploadMusic(formData) {
    return this.request('/music/upload', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData
    })
  }

  // Get Music Metadata
  async getMusicMetadata(hash) {
    return this.request(`/music/metadata/${hash}`)
  }

  // Validate Music Data
  async validateMusicData(data) {
    return this.request('/music/validate', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // IPFS Upload (Enhanced with direct IPFS service)
  async uploadToIPFS(file, metadata = {}) {
    try {
      // Try direct IPFS upload first
      const ipfsResult = await ipfsService.uploadFile(file, metadata)
      
      if (ipfsResult.success) {
        // Also save to backend for indexing
        try {
          await this.request('/ipfs/index', {
            method: 'POST',
            body: JSON.stringify({
              hash: ipfsResult.ipfsHash,
              metadata: ipfsResult.metadata,
              url: ipfsResult.url
            })
          })
        } catch (backendError) {
          console.warn('Backend indexing failed:', backendError)
        }
        
        return ipfsResult
      }
      
      // Fallback to backend upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('metadata', JSON.stringify(metadata))

      return this.request('/ipfs/upload', {
        method: 'POST',
        headers: {}, // Remove Content-Type for FormData
        body: formData
      })
    } catch (error) {
      console.error('IPFS upload failed:', error)
      throw error
    }
  }

  // Get IPFS Content
  async getFromIPFS(hash) {
    try {
      // Try direct IPFS fetch first
      const response = await ipfsService.getFile(hash)
      return response
    } catch (error) {
      // Fallback to backend
      return this.request(`/ipfs/${hash}`)
    }
  }

  // NFT Minting with integrated blockchain service
  async mintMusicNFT(audioFile, metadata) {
    try {
      logger.info('Starting NFT minting process via FlowServiceAPI', { metadata })

      // Use new FlowServiceAPI to mint NFT directly through backend
      const nftData = {
        title: metadata.title,
        description: metadata.description,
        audioFile: audioFile,
        coverImageFile: metadata.coverImage,
        genre: metadata.genre || 'AI Generated',
        duration: metadata.duration || 0,
        royalties: metadata.royalties || [
          {
            recipient: flowServiceAPI.getCurrentUser()?.addr || '0xf8d6e0586b0a20c7',
            percentage: 5
          }
        ]
      };

      const mintResult = await flowServiceAPI.mintNFT(nftData);

      if (!mintResult.success) {
        throw new Error('Failed to mint NFT: ' + mintResult.error);
      }

      logger.info('NFT minted successfully via FlowServiceAPI', { 
        tokenId: mintResult.tokenId, 
        transactionHash: mintResult.transactionHash 
      });

      return {
        success: true,
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
        transactionId: mintResult.transactionId,
        nft: mintResult.nft,
        gasUsed: mintResult.gasUsed,
        blockHeight: mintResult.blockHeight
      };

    } catch (error) {
      logger.error('NFT minting failed', error, { metadata });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // AI Service APIs
  async getAIModels() {
    return this.request('/ai/models')
  }

  async getGenerationStatus(jobId) {
    return this.request(`/ai/status/${jobId}`)
  }

  // NFT APIs
  async getUserNFTs(userAddress, page = 1, limit = 20) {
    try {
      if (userAddress) {
        logger.info('Fetching user NFTs via FlowServiceAPI', { userAddress, page, limit })
        const result = await flowServiceAPI.getUserNFTs(userAddress)
        
        if (result.success) {
          // Pagination handling
          const startIndex = (page - 1) * limit
          const endIndex = startIndex + limit
          const paginatedNFTs = result.nfts.slice(startIndex, endIndex)
          
          return {
            success: true,
            data: paginatedNFTs,
            pagination: {
              page,
              limit,
              total: result.nfts.length,
              totalPages: Math.ceil(result.nfts.length / limit)
            }
          }
        }
      }
      
      // Fallback to backend API
      return this.request(`/nft/user-library?page=${page}&limit=${limit}`)
    } catch (error) {
      logger.error('Failed to fetch user NFTs', error, { userAddress, page, limit })
      // Fallback to backend API
      return this.request(`/nft/user-library?page=${page}&limit=${limit}`)
    }
  }

  async getUserCreatedNFTs(userAddress, page = 1, limit = 20) {
    try {
      if (this.flowService && userAddress) {
        const nfts = await this.flowService.getUserNFTs(userAddress)
        // Filter user-created NFTs (assuming there's a creator field)
        const createdNFTs = nfts.filter(nft => nft.creator === userAddress)
        
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedNFTs = createdNFTs.slice(startIndex, endIndex)
        
        return {
          success: true,
          data: paginatedNFTs,
          pagination: {
            page,
            limit,
            total: createdNFTs.length,
            totalPages: Math.ceil(createdNFTs.length / limit)
          }
        }
      } else {
        return this.request(`/nft/user-created?page=${page}&limit=${limit}`)
      }
    } catch (error) {
      logger.error('Failed to fetch user created NFTs', error)
      return this.request(`/nft/user-created?page=${page}&limit=${limit}`)
    }
  }

  async getUserOwnedNFTs(userAddress, page = 1, limit = 20) {
    // Same as getUserNFTs, since user-owned NFTs are the user's NFTs
    return this.getUserNFTs(userAddress, page, limit)
  }

  async getNFTById(tokenId) {
    return this.request(`/nft/${tokenId}`)
  }

  async likeNFT(tokenId) {
    return this.request(`/nft/${tokenId}/like`, {
      method: 'POST'
    })
  }

  async playNFT(tokenId) {
    return this.request(`/nft/${tokenId}/play`, {
      method: 'POST'
    })
  }

  async updateNFT(tokenId, metadata) {
    return this.request(`/nft/${tokenId}`, {
      method: 'PUT',
      body: JSON.stringify(metadata)
    })
  }

  async deleteNFT(tokenId) {
    return this.request(`/nft/${tokenId}`, {
      method: 'DELETE'
    })
  }

  // Market APIs
  async getMarketNFTs(page = 1, limit = 20, filters = {}) {
    try {
      if (this.flowService) {
        logger.info('Fetching market NFTs from Flow blockchain', { page, limit, filters })
        const nfts = await this.flowService.getMarketNFTs()
        
        // Apply filters
        let filteredNFTs = nfts
        if (filters.genre) {
          filteredNFTs = filteredNFTs.filter(nft => 
            nft.metadata?.attributes?.some(attr => 
              attr.trait_type === 'Genre' && attr.value === filters.genre
            )
          )
        }
        if (filters.priceMin) {
          filteredNFTs = filteredNFTs.filter(nft => 
            parseFloat(nft.price || '0') >= parseFloat(filters.priceMin)
          )
        }
        if (filters.priceMax) {
          filteredNFTs = filteredNFTs.filter(nft => 
            parseFloat(nft.price || '0') <= parseFloat(filters.priceMax)
          )
        }
        
        // Pagination handling
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedNFTs = filteredNFTs.slice(startIndex, endIndex)
        
        return {
          success: true,
          data: paginatedNFTs,
          pagination: {
            page,
            limit,
            total: filteredNFTs.length,
            totalPages: Math.ceil(filteredNFTs.length / limit)
          }
        }
      } else {
        // Fallback to backend API
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...filters
        })
        return this.request(`/market/nfts?${queryParams}`)
      }
    } catch (error) {
      logger.error('Failed to fetch market NFTs', error, { page, limit, filters })
      // Fallback to backend API
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      return this.request(`/market/nfts?${queryParams}`)
    }
  }

  async buyNFT(tokenId, price) {
    try {
      if (this.flowService) {
        logger.info('Buying NFT on Flow blockchain', { tokenId, price })
        const result = await this.flowService.buyNFT(tokenId, price)
        
        if (result.success) {
          logger.info('NFT purchased successfully', { tokenId, transactionHash: result.transactionHash })
        }
        
        return result
      } else {
        // Fallback to backend API
        return this.request(`/market/buy/${tokenId}`, {
          method: 'POST',
          body: JSON.stringify({ price })
        })
      }
    } catch (error) {
      logger.error('Failed to buy NFT', error, { tokenId, price })
      throw error
    }
  }

  async listNFT(tokenId, price) {
    try {
      if (this.flowService) {
        logger.info('Listing NFT on Flow marketplace', { tokenId, price })
        const result = await this.flowService.listNFT(tokenId, price)
        
        if (result.success) {
          logger.info('NFT listed successfully', { tokenId, price, transactionHash: result.transactionHash })
        }
        
        return result
      } else {
        // Fallback to backend API
        return this.request(`/market/list/${tokenId}`, {
          method: 'POST',
          body: JSON.stringify({ price })
        })
      }
    } catch (error) {
      logger.error('Failed to list NFT', error, { tokenId, price })
      throw error
    }
  }

  async healthCheck() {
    return this.request('/health')
  }

  // Forte Actions API
  async getForteActionsTemplates() {
    if (this.isLocalMode) {
      return forteActionsServiceLocal.getTemplates()
    }
    return this.request('/forte-actions/templates')
  }

  async startForteActionsWorkflow(params) {
    if (this.isLocalMode) {
      return forteActionsServiceLocal.quickGenerate(params)
    }
    return this.request('/forte-actions/quick-generate', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  async getForteActionsWorkflowStatus(workflowId) {
    if (this.isLocalMode) {
      return forteActionsServiceLocal.getWorkflowStatus(workflowId)
    }
    return this.request(`/forte-actions/status/${workflowId}`)
  }
}

// Create singleton instance
const apiService = new ApiService()

// Export individual methods for convenience
export const generateMusic = (prompt, options) => apiService.generateMusic(prompt, options)
export const uploadMusic = (formData) => apiService.uploadMusic(formData)
export const getMusicMetadata = (hash) => apiService.getMusicMetadata(hash)
export const validateMusicData = (data) => apiService.validateMusicData(data)
export const uploadToIPFS = (file, metadata) => apiService.uploadToIPFS(file, metadata)
export const getFromIPFS = (hash) => apiService.getFromIPFS(hash)
export const getAIModels = () => apiService.getAIModels()
export const getGenerationStatus = (jobId) => apiService.getGenerationStatus(jobId)
export const mintMusicNFT = (audioFile, metadata) => apiService.mintMusicNFT(audioFile, metadata)

// Export service instances
export { ipfsService, blockchainService }
export const healthCheck = () => apiService.healthCheck()

export default apiService