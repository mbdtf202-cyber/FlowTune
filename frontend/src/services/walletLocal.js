/**
 * Local Wallet Service - Local wallet service simulation
 * Replaces real wallet connection functionality in demo mode
 */

class WalletServiceLocal {
  constructor() {
    this.isConnected = false
    this.currentUser = null
    this.mockUsers = [
      {
        addr: '0x1234567890abcdef',
        name: 'Demo User',
        avatar: '👤',
        balance: 1000.0,
        currency: 'FLOW',
        nfts: [],
        createdNFTs: [],
        likedNFTs: []
      },
      {
        addr: '0xabcdef1234567890',
        name: 'Artist Demo',
        avatar: '🎨',
        balance: 2500.0,
        currency: 'FLOW',
        nfts: [],
        createdNFTs: [],
        likedNFTs: []
      },
      {
        addr: '0x9876543210fedcba',
        name: 'Collector Demo',
        avatar: '💎',
        balance: 5000.0,
        currency: 'FLOW',
        nfts: [],
        createdNFTs: [],
        likedNFTs: []
      }
    ]
    this.currentUserIndex = 0
    this.listeners = new Set()
  }

  /**
   * Simulate wallet connection
   * @returns {Promise<Object>} Connection result
   */
  async connect() {
    try {
      console.log('🏠 Wallet Service: Simulating wallet connection')
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      this.currentUser = this.mockUsers[this.currentUserIndex]
      this.isConnected = true
      
      console.log('✅ Wallet Service: Connected successfully', {
        address: this.currentUser.addr,
        name: this.currentUser.name
      })
      
      // Notify listeners
      this.notifyListeners('connect', this.currentUser)
      
      return {
        success: true,
        user: this.currentUser
      }
    } catch (error) {
      console.error('❌ Wallet connection error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Simulate wallet disconnection
   * @returns {Promise<Object>} Disconnection result
   */
  async disconnect() {
    try {
      console.log('🏠 Wallet Service: Simulating wallet disconnection')
      
      // Simulate disconnection delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const previousUser = this.currentUser
      this.currentUser = null
      this.isConnected = false
      
      console.log('✅ Wallet Service: Disconnected successfully')
      
      // Notify listeners
      this.notifyListeners('disconnect', previousUser)
      
      return {
        success: true
      }
    } catch (error) {
      console.error('❌ Wallet disconnection error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get current user information
   * @returns {Object|null} Current user
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  isWalletConnected() {
    return this.isConnected
  }

  /**
   * Get user balance
   * @param {string} address - User address
   * @returns {Promise<Object>} Balance information
   */
  async getBalance(address = null) {
    try {
      const targetAddress = address || this.currentUser?.addr
      if (!targetAddress) {
        throw new Error('No address provided and no user connected')
      }
      
      console.log('🏠 Wallet Service: Getting balance for', targetAddress)
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500))
      
      const user = this.mockUsers.find(u => u.addr === targetAddress) || this.currentUser
      if (!user) {
        throw new Error('User not found')
      }
      
      return {
        success: true,
        balance: user.balance,
        currency: user.currency,
        formatted: `${user.balance.toFixed(2)} ${user.currency}`
      }
    } catch (error) {
      console.error('❌ Get balance error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Simulate transaction signing
   * @param {Object} transaction - Transaction object
   * @returns {Promise<Object>} Signing result
   */
  async signTransaction(transaction) {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected')
      }
      
      console.log('🏠 Wallet Service: Simulating transaction signing', transaction)
      
      // Simulate user confirmation delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
      
      // Generate mock transaction hash
      const txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 18)}`
      
      console.log('✅ Wallet Service: Transaction signed', { txHash })
      
      return {
        success: true,
        txHash: txHash,
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Transaction signing error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Simulate NFT minting
   * @param {Object} nftData - NFT data
   * @returns {Promise<Object>} Minting result
   */
  async mintNFT(nftData) {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected')
      }
      
      console.log('🏠 Wallet Service: Simulating NFT minting', nftData)
      
      // Simulate minting delay
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000))
      
      // Generate mock NFT
      const nft = {
        id: `nft-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        tokenId: Math.floor(Math.random() * 1000000),
        owner: this.currentUser.addr,
        creator: this.currentUser.addr,
        title: nftData.title || 'Demo NFT',
        description: nftData.description || 'A demo NFT created in local mode',
        image: nftData.image || 'demo-image-url',
        audio: nftData.audio || 'demo-audio-url',
        metadata: nftData.metadata || {},
        price: nftData.price || 0,
        isForSale: false,
        createdAt: new Date().toISOString(),
        mintedAt: new Date().toISOString(),
        txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 18)}`
      }
      
      // Add to user's NFT list
      this.currentUser.nfts.push(nft)
      this.currentUser.createdNFTs.push(nft)
      
      console.log('✅ Wallet Service: NFT minted successfully', { 
        tokenId: nft.tokenId, 
        txHash: nft.txHash 
      })
      
      return {
        success: true,
        nft: nft,
        txHash: nft.txHash
      }
    } catch (error) {
      console.error('❌ NFT minting error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Switch user (for demo only)
   * @param {number} userIndex - User index
   * @returns {Promise<Object>} Switch result
   */
  async switchUser(userIndex = null) {
    // Cycle to next user
    try {
      if (userIndex === null) {
        // 循环切换到下一个用户
        this.currentUserIndex = (this.currentUserIndex + 1) % this.mockUsers.length
      } else {
        this.currentUserIndex = Math.max(0, Math.min(userIndex, this.mockUsers.length - 1))
      }
      
      const wasConnected = this.isConnected
      
      if (wasConnected) {
        // If connected, switch to new user
        this.currentUser = this.mockUsers[this.currentUserIndex]
        
        console.log('🔄 Wallet Service: Switched to user', {
          address: this.currentUser.addr,
          name: this.currentUser.name
        })
        
        // Notify listeners of user switch
        this.notifyListeners('userChanged', this.currentUser)
      }
      
      return {
        success: true,
        user: this.currentUser,
        userIndex: this.currentUserIndex
      }
    } catch (error) {
      console.error('❌ User switch error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get all available users (for demo only)
   * @returns {Array} User list
   */
  getAvailableUsers() {
    return this.mockUsers.map((user, index) => ({
      ...user,
      index: index,
      isCurrent: index === this.currentUserIndex
    }))
  }

  /**
   * Add event listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener)
  }

  /**
   * Remove event listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener)
  }

  /**
   * Notify all listeners
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }

  /**
   * Reset wallet state
   */
  reset() {
    console.log('🔄 Wallet Service: Resetting wallet state')
    this.isConnected = false
    this.currentUser = null
    this.currentUserIndex = 0
    
    // Reset all users' NFT lists
    this.mockUsers.forEach(user => {
      user.nfts = []
      user.createdNFTs = []
      user.likedNFTs = []
    })
    
    this.notifyListeners('reset', null)
  }

  /**
   * Get wallet status
   * @returns {Object} Wallet status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      currentUser: this.currentUser,
      availableUsers: this.getAvailableUsers(),
      isLocalMode: true
    }
  }
}

// Create singleton instance
const walletServiceLocal = new WalletServiceLocal()

export default walletServiceLocal
export { WalletServiceLocal }