import { ethers, BrowserProvider, Contract, formatEther, parseEther } from 'ethers'

// Smart contract ABI (simplified for demo)
const MUSIC_NFT_ABI = [
  "function mint(address to, string memory tokenURI) public returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "function approve(address to, uint256 tokenId) public",
  "function setApprovalForAll(address operator, bool approved) public",
  "function transferFrom(address from, address to, uint256 tokenId) public",
  "function safeTransferFrom(address from, address to, uint256 tokenId) public",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
]

const MARKETPLACE_ABI = [
  "function listItem(address nftContract, uint256 tokenId, uint256 price) public",
  "function buyItem(address nftContract, uint256 tokenId) public payable",
  "function cancelListing(address nftContract, uint256 tokenId) public",
  "function updatePrice(address nftContract, uint256 tokenId, uint256 newPrice) public",
  "function getListing(address nftContract, uint256 tokenId) public view returns (tuple(uint256 price, address seller, bool active))",
  "function getListingsByOwner(address owner) public view returns (tuple(address nftContract, uint256 tokenId, uint256 price, bool active)[])",
  "event ItemListed(address indexed nftContract, uint256 indexed tokenId, uint256 price, address indexed seller)",
  "event ItemSold(address indexed nftContract, uint256 indexed tokenId, uint256 price, address indexed seller, address indexed buyer)"
]

class BlockchainService {
  constructor() {
    this.provider = null
    this.signer = null
    this.musicNFTContract = null
    this.marketplaceContract = null
    this.isInitialized = false
    
    // Contract addresses (these would be deployed contract addresses)
    this.contracts = {
      musicNFT: import.meta.env.VITE_MUSIC_NFT_CONTRACT || '0x...',
      marketplace: import.meta.env.VITE_MARKETPLACE_CONTRACT || '0x...'
    }
    
    // Supported networks
    this.networks = {
      1: { name: 'Ethereum Mainnet', rpc: 'https://mainnet.infura.io/v3/' },
      5: { name: 'Goerli Testnet', rpc: 'https://goerli.infura.io/v3/' },
      137: { name: 'Polygon Mainnet', rpc: 'https://polygon-rpc.com/' },
      80001: { name: 'Mumbai Testnet', rpc: 'https://rpc-mumbai.maticvigil.com/' }
    }
  }

  /**
   * Initialize blockchain connection
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed')
      }

      this.provider = new BrowserProvider(window.ethereum)
      await this.provider.send('eth_requestAccounts', [])
      this.signer = this.provider.getSigner()

      // Initialize contracts
      this.musicNFTContract = new Contract(
        this.contracts.musicNFT,
        MUSIC_NFT_ABI,
        this.signer
      )

      this.marketplaceContract = new Contract(
        this.contracts.marketplace,
        MARKETPLACE_ABI,
        this.signer
      )

      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Blockchain initialization failed:', error)
      return false
    }
  }

  /**
   * Connect wallet
   * @returns {Promise<Object>} Connection result
   */
  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed')
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]
      const network = await this.provider.getNetwork()
      const balance = await this.provider.getBalance(address)

      return {
        success: true,
        address,
        network: network.name,
        chainId: network.chainId,
        balance: formatEther(balance)
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Mint music NFT
   * @param {string} tokenURI - IPFS URI for metadata
   * @param {string} recipient - Recipient address
   * @returns {Promise<Object>} Mint result
   */
  async mintMusicNFT(tokenURI, recipient = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const to = recipient || await this.signer.getAddress()
      
      // Estimate gas
      const gasEstimate = await this.musicNFTContract.estimateGas.mint(to, tokenURI)
      const gasLimit = gasEstimate.mul(120).div(100) // Add 20% buffer

      const tx = await this.musicNFTContract.mint(to, tokenURI, {
        gasLimit
      })

      const receipt = await tx.wait()
      
      // Extract token ID from events
      const transferEvent = receipt.events?.find(e => e.event === 'Transfer')
      const tokenId = transferEvent?.args?.tokenId?.toString()

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        tokenId,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      }
    } catch (error) {
      console.error('NFT minting failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get NFT metadata
   * @param {string} tokenId - Token ID
   * @returns {Promise<Object>} NFT metadata
   */
  async getNFTMetadata(tokenId) {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const tokenURI = await this.musicNFTContract.tokenURI(tokenId)
      const owner = await this.musicNFTContract.ownerOf(tokenId)

      // Fetch metadata from IPFS
      const response = await window.fetch(tokenURI)
      const metadata = await response.json()

      return {
        success: true,
        tokenId,
        tokenURI,
        owner,
        metadata
      }
    } catch (error) {
      console.error('Failed to get NFT metadata:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get user's NFTs
   * @param {string} address - User address
   * @returns {Promise<Array>} Array of NFTs
   */
  async getUserNFTs(address = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const userAddress = address || await this.signer.getAddress()
      const balance = await this.musicNFTContract.balanceOf(userAddress)
      const nfts = []

      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await this.musicNFTContract.tokenOfOwnerByIndex(userAddress, i)
        const metadata = await this.getNFTMetadata(tokenId.toString())
        
        if (metadata.success) {
          nfts.push(metadata)
        }
      }

      return {
        success: true,
        nfts,
        count: balance.toNumber()
      }
    } catch (error) {
      console.error('Failed to get user NFTs:', error)
      return {
        success: false,
        error: error.message,
        nfts: []
      }
    }
  }

  /**
   * List NFT on marketplace
   * @param {string} tokenId - Token ID
   * @param {string} price - Price in ETH
   * @returns {Promise<Object>} Listing result
   */
  async listNFT(tokenId, price) {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const priceWei = parseEther(price)
      
      // First approve marketplace to transfer NFT
      const approveTx = await this.musicNFTContract.approve(
        this.contracts.marketplace,
        tokenId
      )
      await approveTx.wait()

      // List the item
      const listTx = await this.marketplaceContract.listItem(
        this.contracts.musicNFT,
        tokenId,
        priceWei
      )
      const receipt = await listTx.wait()

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        tokenId,
        price,
        gasUsed: receipt.gasUsed.toString()
      }
    } catch (error) {
      console.error('NFT listing failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Buy NFT from marketplace
   * @param {string} tokenId - Token ID
   * @returns {Promise<Object>} Purchase result
   */
  async buyNFT(tokenId) {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const listing = await this.marketplaceContract.getListing(
        this.contracts.musicNFT,
        tokenId
      )

      if (!listing.active) {
        throw new Error('NFT is not listed for sale')
      }

      const tx = await this.marketplaceContract.buyItem(
        this.contracts.musicNFT,
        tokenId,
        { value: listing.price }
      )
      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        tokenId,
        price: formatEther(listing.price),
        gasUsed: receipt.gasUsed.toString()
      }
    } catch (error) {
      console.error('NFT purchase failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Cancel NFT listing
   * @param {string} tokenId - Token ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelListing(tokenId) {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const tx = await this.marketplaceContract.cancelListing(
        this.contracts.musicNFT,
        tokenId
      )
      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        tokenId,
        gasUsed: receipt.gasUsed.toString()
      }
    } catch (error) {
      console.error('Listing cancellation failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get marketplace listings
   * @param {string} owner - Owner address (optional)
   * @returns {Promise<Array>} Array of listings
   */
  async getMarketplaceListings(owner = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      if (owner) {
        const listings = await this.marketplaceContract.getListingsByOwner(owner)
        return {
          success: true,
          listings: listings.filter(listing => listing.active)
        }
      }

      // For all listings, we'd need to implement pagination or events
      // This is a simplified version
      return {
        success: true,
        listings: []
      }
    } catch (error) {
      console.error('Failed to get marketplace listings:', error)
      return {
        success: false,
        error: error.message,
        listings: []
      }
    }
  }

  /**
   * Switch network
   * @param {number} chainId - Target chain ID
   * @returns {Promise<boolean>} Switch success
   */
  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      })
      return true
    } catch (error) {
      console.error('Network switch failed:', error)
      return false
    }
  }

  /**
   * Get current network info
   * @returns {Promise<Object>} Network information
   */
  async getNetworkInfo() {
    try {
      if (!this.provider) {
        await this.initialize()
      }

      const network = await this.provider.getNetwork()
      return {
        chainId: network.chainId,
        name: network.name,
        supported: !!this.networks[network.chainId]
      }
    } catch (error) {
      console.error('Failed to get network info:', error)
      return null
    }
  }

  /**
   * Format address for display
   * @param {string} address - Ethereum address
   * @returns {string} Formatted address
   */
  formatAddress(address) {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Validate Ethereum address
   * @param {string} address - Address to validate
   * @returns {boolean} Is valid address
   */
  isValidAddress(address) {
    return ethers.isAddress(address)
  }
}

// Create singleton instance
const blockchainService = new BlockchainService()

export default blockchainService
export { BlockchainService }