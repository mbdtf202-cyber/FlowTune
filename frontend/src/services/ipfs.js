// IPFS Integration Service
import ipfsServiceLocal from './ipfsLocal.js'

class IPFSService {
  constructor() {
    this.gateway = 'https://gateway.pinata.cloud/ipfs/'
    this.apiKey = import.meta.env.VITE_PINATA_API_KEY
    this.apiSecret = import.meta.env.VITE_PINATA_SECRET_KEY
    this.baseURL = 'https://api.pinata.cloud'
    
    // Check if in local mode
    this.isLocalMode = import.meta.env.VITE_LOCAL_DEMO_MODE === 'true' || 
                       import.meta.env.VITE_DISABLE_NETWORK_CALLS === 'true'
    
    if (this.isLocalMode) {
      console.log('🏠 IPFS Service: Running in local demo mode')
    }
  }

  /**
   * Upload file to IPFS via Pinata
   * @param {File} file - File to upload
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result with IPFS hash
   */
  async uploadFile(file, metadata = {}) {
    // If in local mode, use local service
    if (this.isLocalMode) {
      return await ipfsServiceLocal.uploadFile(file, metadata)
    }
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Add metadata
      const pinataMetadata = {
        name: metadata.name || file.name,
        keyvalues: {
          type: metadata.type || 'audio',
          artist: metadata.artist || 'Unknown',
          title: metadata.title || file.name,
          genre: metadata.genre || 'Unknown',
          duration: metadata.duration || 0,
          uploadedAt: new Date().toISOString(),
          ...metadata.custom
        }
      }
      
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata))
      
      const pinataOptions = {
        cidVersion: 1,
        customPinPolicy: {
          regions: [
            { id: 'FRA1', desiredReplicationCount: 2 },
            { id: 'NYC1', desiredReplicationCount: 2 }
          ]
        }
      }
      
      formData.append('pinataOptions', JSON.stringify(pinataOptions))

      const response = await window.fetch(`${this.baseURL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        url: `${this.gateway}${result.IpfsHash}`,
        metadata: pinataMetadata
      }
    } catch (error) {
      console.error('IPFS upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Upload JSON metadata to IPFS
   * @param {Object} metadata - Metadata object
   * @returns {Promise<Object>} Upload result
   */
  async uploadMetadata(metadata) {
    // If in local mode, use local service
    if (this.isLocalMode) {
      return await ipfsServiceLocal.uploadMetadata(metadata)
    }
    
    try {
      const response = await window.fetch(`${this.baseURL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `metadata-${Date.now()}`,
            keyvalues: {
              type: 'metadata',
              createdAt: new Date().toISOString()
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Metadata upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        url: `${this.gateway}${result.IpfsHash}`
      }
    } catch (error) {
      console.error('Metadata upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get file from IPFS
   * @param {string} hash - IPFS hash
   * @returns {Promise<Response>} File response
   */
  async getFile(hash) {
    // If in local mode, use local service
    if (this.isLocalMode) {
      return await ipfsServiceLocal.getFile(hash)
    }
    
    try {
      const response = await window.fetch(`${this.gateway}${hash}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }
      return response
    } catch (error) {
      console.error('IPFS fetch error:', error)
      throw error
    }
  }

  /**
   * Get file metadata from Pinata
   * @param {string} hash - IPFS hash
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(hash) {
    // If in local mode, use local service
    if (this.isLocalMode) {
      return await ipfsServiceLocal.getFileMetadata(hash)
    }
    try {
      const response = await window.fetch(`${this.baseURL}/data/pinList?hashContains=${hash}`, {
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`)
      }

      const result = await response.json()
      return result.rows[0] || null
    } catch (error) {
      console.error('Metadata fetch error:', error)
      return null
    }
  }

  /**
   * Pin existing IPFS content
   * @param {string} hash - IPFS hash to pin
   * @param {Object} metadata - Pin metadata
   * @returns {Promise<Object>} Pin result
   */
  async pinByHash(hash, metadata = {}) {
    // If in local mode, use local service
    if (this.isLocalMode) {
      return await ipfsServiceLocal.pinByHash(hash, metadata)
    }
    
    try {
      const response = await window.fetch(`${this.baseURL}/pinning/pinByHash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        },
        body: JSON.stringify({
          hashToPin: hash,
          pinataMetadata: {
            name: metadata.name || `pinned-${hash}`,
            keyvalues: metadata.keyvalues || {}
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Pin by hash failed: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        ipfsHash: result.ipfsHash
      }
    } catch (error) {
      console.error('Pin by hash error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Unpin content from IPFS
   * @param {string} hash - IPFS hash to unpin
   * @returns {Promise<Object>} Unpin result
   */
  async unpin(hash) {
    // If in local mode, use local service
    if (this.isLocalMode) {
      return await ipfsServiceLocal.unpin(hash)
    }
    
    try {
      const response = await window.fetch(`${this.baseURL}/pinning/unpin/${hash}`, {
        method: 'DELETE',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        }
      })

      if (!response.ok) {
        throw new Error(`Unpin failed: ${response.statusText}`)
      }

      return {
        success: true,
        message: 'Content unpinned successfully'
      }
    } catch (error) {
      console.error('Unpin error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get account usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats() {
    // If in local mode, use local service
    if (this.isLocalMode) {
      return await ipfsServiceLocal.getUsageStats()
    }
    
    try {
      const response = await window.fetch(`${this.baseURL}/data/userPinnedDataTotal`, {
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch usage stats: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Usage stats error:', error)
      return null
    }
  }

  /**
   * Test IPFS connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    // If in local mode, use local service
    if (this.isLocalMode) {
      return await ipfsServiceLocal.testConnection()
    }
    
    try {
      const response = await window.fetch(`${this.baseURL}/data/testAuthentication`, {
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        }
      })

      return response.ok
    } catch (error) {
      console.error('IPFS connection test failed:', error)
      return false
    }
  }

  /**
   * Generate IPFS URL from hash
   * @param {string} hash - IPFS hash
   * @returns {string} Full IPFS URL
   */
  getIPFSUrl(hash) {
    return `${this.gateway}${hash}`
  }

  /**
   * Extract hash from IPFS URL
   * @param {string} url - IPFS URL
   * @returns {string|null} IPFS hash
   */
  extractHashFromUrl(url) {
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }
}

// Create singleton instance
const ipfsService = new IPFSService()

export default ipfsService
export { IPFSService }