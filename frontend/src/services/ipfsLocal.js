/**
 * Local IPFS Service - Local IPFS service simulation
 * Replaces real IPFS network calls in demo mode
 */

class IPFSServiceLocal {
  constructor() {
    this.gateway = 'local://ipfs/'
    this.storage = new Map() // Simulate IPFS storage
    this.metadata = new Map() // Store file metadata
    this.hashCounter = 1000 // Used to generate mock hash
  }

  /**
   * Generate mock IPFS hash
   */
  generateMockHash() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `Qm${timestamp}${random}${this.hashCounter++}`
  }

  /**
   * Simulate uploading file to IPFS
   * @param {File} file - File to upload
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, metadata = {}) {
    try {
      console.log('🏠 Local IPFS: Simulating file upload', { fileName: file.name, size: file.size })
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      
      const hash = this.generateMockHash()
      
      // Convert file to blob URL for local access
      const blobUrl = URL.createObjectURL(file)
      
      // Store file information
      this.storage.set(hash, {
        file: file,
        blobUrl: blobUrl,
        uploadedAt: new Date().toISOString()
      })
      
      // Store metadata
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
      
      this.metadata.set(hash, pinataMetadata)
      
      console.log('✅ Local IPFS: File uploaded successfully', { hash, url: `${this.gateway}${hash}` })
      
      return {
        success: true,
        ipfsHash: hash,
        pinSize: file.size,
        timestamp: new Date().toISOString(),
        url: `${this.gateway}${hash}`,
        localUrl: blobUrl, // Local access URL
        metadata: pinataMetadata
      }
    } catch (error) {
      console.error('❌ Local IPFS upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Simulate uploading JSON metadata to IPFS
   * @param {Object} metadata - Metadata object
   * @returns {Promise<Object>} Upload result
   */
  async uploadMetadata(metadata) {
    try {
      console.log('🏠 Local IPFS: Simulating metadata upload', metadata)
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500))
      
      const hash = this.generateMockHash()
      
      // Convert metadata to JSON string and create blob
      const jsonString = JSON.stringify(metadata, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const blobUrl = URL.createObjectURL(blob)
      
      // Store metadata
      this.storage.set(hash, {
        data: metadata,
        blobUrl: blobUrl,
        uploadedAt: new Date().toISOString()
      })
      
      console.log('✅ Local IPFS: Metadata uploaded successfully', { hash })
      
      return {
        success: true,
        ipfsHash: hash,
        url: `${this.gateway}${hash}`,
        localUrl: blobUrl
      }
    } catch (error) {
      console.error('❌ Local IPFS metadata upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Simulate getting file from IPFS
   * @param {string} hash - IPFS hash
   * @returns {Promise<Response>} File response
   */
  async getFile(hash) {
    try {
      console.log('🏠 Local IPFS: Simulating file fetch', { hash })
      
      const stored = this.storage.get(hash)
      if (!stored) {
        throw new Error(`File not found: ${hash}`)
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300))
      
      // Return mock Response object
      if (stored.file) {
        // If it's a file, return file content
        return new Response(stored.file, {
          status: 200,
          headers: {
            'Content-Type': stored.file.type || 'application/octet-stream',
            'Content-Length': stored.file.size.toString()
          }
        })
      } else if (stored.data) {
        // If it's JSON data, return JSON string
        const jsonString = JSON.stringify(stored.data)
        return new Response(jsonString, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': jsonString.length.toString()
          }
        })
      }
      
      throw new Error('Invalid stored data')
    } catch (error) {
      console.error('❌ Local IPFS fetch error:', error)
      throw error
    }
  }

  /**
   * Simulate getting file metadata
   * @param {string} hash - IPFS hash
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(hash) {
    try {
      console.log('🏠 Local IPFS: Simulating metadata fetch', { hash })
      
      const metadata = this.metadata.get(hash)
      const stored = this.storage.get(hash)
      
      if (!metadata || !stored) {
        return null
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return {
        id: hash,
        ipfs_pin_hash: hash,
        size: stored.file?.size || 0,
        user_id: 'local-user',
        date_pinned: stored.uploadedAt,
        date_unpinned: null,
        metadata: metadata,
        regions: [
          { regionId: 'local', currentReplicationCount: 1, desiredReplicationCount: 1 }
        ]
      }
    } catch (error) {
      console.error('❌ Local IPFS metadata fetch error:', error)
      return null
    }
  }

  /**
   * Simulate pinning existing IPFS content
   * @param {string} hash - IPFS hash to pin
   * @param {Object} metadata - Pinning metadata
   * @returns {Promise<Object>} Pinning result
   */
  async pinByHash(hash, metadata = {}) {
    try {
      console.log('🏠 Local IPFS: Simulating pin by hash', { hash })
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Check if hash exists
      if (!this.storage.has(hash)) {
        throw new Error(`Hash not found: ${hash}`)
      }
      
      // Update metadata
      const existingMetadata = this.metadata.get(hash) || {}
      this.metadata.set(hash, {
        ...existingMetadata,
        ...metadata,
        pinnedAt: new Date().toISOString()
      })
      
      return {
        success: true,
        ipfsHash: hash
      }
    } catch (error) {
      console.error('❌ Local IPFS pin error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Simulate unpinning content
   * @param {string} hash - IPFS hash to unpin
   * @returns {Promise<Object>} Unpinning result
   */
  async unpin(hash) {
    try {
      console.log('🏠 Local IPFS: Simulating unpin', { hash })
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 200))
      
      if (this.storage.has(hash)) {
        const stored = this.storage.get(hash)
        if (stored.blobUrl) {
          URL.revokeObjectURL(stored.blobUrl)
        }
        this.storage.delete(hash)
        this.metadata.delete(hash)
      }
      
      return {
        success: true,
        message: 'Content unpinned successfully'
      }
    } catch (error) {
      console.error('❌ Local IPFS unpin error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Simulate getting account usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats() {
    try {
      console.log('🏠 Local IPFS: Simulating usage stats')
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const totalSize = Array.from(this.storage.values())
        .reduce((sum, item) => sum + (item.file?.size || 0), 0)
      
      return {
        pin_count: this.storage.size,
        pin_size_total: totalSize,
        pin_size_with_replications_total: totalSize,
        bandwidth_used: 0
      }
    } catch (error) {
      console.error('❌ Local IPFS usage stats error:', error)
      return null
    }
  }

  /**
   * Simulate testing IPFS connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    console.log('🏠 Local IPFS: Simulating connection test')
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return true // Local mode always returns connection success
  }

  /**
   * Generate IPFS URL
   * @param {string} hash - IPFS hash
   * @returns {string} Complete IPFS URL
   */
  getIPFSUrl(hash) {
    return `${this.gateway}${hash}`
  }

  /**
   * Extract hash from URL
   * @param {string} url - IPFS URL
   * @returns {string|null} Extracted hash
   */
  extractHashFromUrl(url) {
    if (url.startsWith(this.gateway)) {
      return url.replace(this.gateway, '')
    }
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  /**
   * Get locally stored file URL
   * @param {string} hash - IPFS hash
   * @returns {string|null} Local blob URL
   */
  getLocalUrl(hash) {
    const stored = this.storage.get(hash)
    return stored?.blobUrl || null
  }

  /**
   * Clean up all local storage
   */
  cleanup() {
    console.log('🏠 Local IPFS: Cleaning up storage')
    
    // Release all blob URLs
    for (const stored of this.storage.values()) {
      if (stored.blobUrl) {
        URL.revokeObjectURL(stored.blobUrl)
      }
    }
    
    this.storage.clear()
    this.metadata.clear()
  }
}

// Create singleton instance
const ipfsServiceLocal = new IPFSServiceLocal()

// Clean up resources on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    ipfsServiceLocal.cleanup()
  })
}

export default ipfsServiceLocal
export { IPFSServiceLocal }