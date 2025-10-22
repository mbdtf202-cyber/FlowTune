/**
 * MusicNFT Model for Redis-based storage
 * Simplified music NFT management without Mongoose
 */

import { v4 as uuidv4 } from 'uuid';
import Database from '../config/database.js';
import logger from '../utils/logger.js';

class MusicNFT {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.title = data.title || '';
    this.description = data.description || '';
    this.creator = data.creator || '';
    this.owner = data.owner || '';
    this.collaborators = data.collaborators || [];
    
    // Music metadata
    this.music = data.music || {
      duration: 0,
      genre: '',
      bpm: 0,
      key: '',
      mood: '',
      instruments: [],
      tags: []
    };
    
    // AI generation data
    this.aiGeneration = data.aiGeneration || {
      prompt: '',
      model: '',
      parameters: {},
      generatedAt: null,
      processingTime: 0,
      version: '1.0'
    };
    
    // File and IPFS data
    this.files = data.files || {
      audio: {
        ipfsHash: '',
        url: '',
        format: 'mp3',
        size: 0,
        quality: 'high'
      },
      cover: {
        ipfsHash: '',
        url: '',
        format: 'jpg',
        size: 0
      },
      metadata: {
        ipfsHash: '',
        url: ''
      }
    };
    
    // Blockchain data
    this.blockchain = data.blockchain || {
      tokenId: '',
      contractAddress: '',
      transactionHash: '',
      blockNumber: 0,
      mintedAt: null,
      network: 'flow'
    };
    
    // Market data
    this.market = data.market || {
      price: '0',
      currency: 'FLOW',
      isForSale: false,
      saleType: 'fixed', // 'fixed', 'auction'
      auctionEndTime: null,
      highestBid: '0',
      bidders: [],
      salesHistory: []
    };
    
    // Royalties
    this.royalties = data.royalties || {
      percentage: 10,
      recipients: []
    };
    
    // Analytics
    this.analytics = data.analytics || {
      views: 0,
      plays: 0,
      likes: 0,
      shares: 0,
      downloads: 0,
      comments: 0,
      uniqueListeners: 0,
      totalPlayTime: 0
    };
    
    // Status and visibility
    this.status = data.status || 'draft'; // 'draft', 'processing', 'minted', 'failed'
    this.visibility = data.visibility || 'public'; // 'public', 'private', 'unlisted'
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isFeatured = data.isFeatured || false;
    
    // Categories and tags
    this.category = data.category || 'music';
    this.tags = data.tags || [];
    this.language = data.language || 'en';
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.publishedAt = data.publishedAt || null;
  }

  /**
   * Add collaborator
   */
  addCollaborator(userId, role = 'contributor', percentage = 0) {
    const existing = this.collaborators.find(c => c.userId === userId);
    if (!existing) {
      this.collaborators.push({
        userId,
        role,
        percentage,
        addedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Remove collaborator
   */
  removeCollaborator(userId) {
    this.collaborators = this.collaborators.filter(c => c.userId !== userId);
  }

  /**
   * Add to sales history
   */
  addSaleRecord(sale) {
    this.market.salesHistory.push({
      ...sale,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Update analytics
   */
  async updateAnalytics(updates) {
    this.analytics = { ...this.analytics, ...updates };
    this.updatedAt = new Date().toISOString();
    await this.save();
  }

  /**
   * Increment play count
   */
  async incrementPlays(userId = null) {
    this.analytics.plays += 1;
    if (userId) {
      // Track unique listeners
      const listenerKey = `nft:${this.id}:listeners`;
      const isNewListener = await Database.sadd(listenerKey, userId);
      if (isNewListener) {
        this.analytics.uniqueListeners += 1;
      }
    }
    await this.save();
  }

  /**
   * Toggle like
   */
  async toggleLike(userId) {
    const likeKey = `nft:${this.id}:likes`;
    const isLiked = await Database.sismember(likeKey, userId);
    
    if (isLiked) {
      await Database.srem(likeKey, userId);
      this.analytics.likes = Math.max(0, this.analytics.likes - 1);
    } else {
      await Database.sadd(likeKey, userId);
      this.analytics.likes += 1;
    }
    
    await this.save();
    return !isLiked;
  }

  /**
   * Check if user has access
   */
  hasAccess(userId) {
    if (this.visibility === 'public') return true;
    if (this.visibility === 'private') {
      return this.creator === userId || this.owner === userId || 
             this.collaborators.some(c => c.userId === userId);
    }
    return false;
  }

  /**
   * Get public data (without sensitive information)
   */
  getPublicData() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      creator: this.creator,
      owner: this.owner,
      music: this.music,
      files: {
        audio: {
          url: this.files.audio.url,
          format: this.files.audio.format,
          duration: this.music.duration
        },
        cover: {
          url: this.files.cover.url,
          format: this.files.cover.format
        }
      },
      market: {
        price: this.market.price,
        currency: this.market.currency,
        isForSale: this.market.isForSale,
        saleType: this.market.saleType
      },
      analytics: this.analytics,
      status: this.status,
      visibility: this.visibility,
      category: this.category,
      tags: this.tags,
      createdAt: this.createdAt,
      publishedAt: this.publishedAt
    };
  }

  /**
   * Save NFT to database
   */
  async save() {
    try {
      this.updatedAt = new Date().toISOString();
      
      const nftData = this.toObject();
      await Database.set(`nft:${this.id}`, nftData);
      
      // Index by creator and owner
      await Database.sadd(`user:${this.creator}:nfts:created`, this.id);
      await Database.sadd(`user:${this.owner}:nfts:owned`, this.id);
      
      // Index by category and tags
      await Database.sadd(`nfts:category:${this.category}`, this.id);
      for (const tag of this.tags) {
        await Database.sadd(`nfts:tag:${tag}`, this.id);
      }
      
      // Index by status and visibility
      await Database.sadd(`nfts:status:${this.status}`, this.id);
      await Database.sadd(`nfts:visibility:${this.visibility}`, this.id);
      
      // Add to main NFTs set
      await Database.sadd('nfts', this.id);
      
      // Featured NFTs
      if (this.isFeatured) {
        await Database.sadd('nfts:featured', this.id);
      }

      logger.info(`NFT saved: ${this.title} (${this.id})`);
      return this;
    } catch (error) {
      logger.error('Error saving NFT:', error);
      throw error;
    }
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      creator: this.creator,
      owner: this.owner,
      collaborators: this.collaborators,
      music: this.music,
      aiGeneration: this.aiGeneration,
      files: this.files,
      blockchain: this.blockchain,
      market: this.market,
      royalties: this.royalties,
      analytics: this.analytics,
      status: this.status,
      visibility: this.visibility,
      isActive: this.isActive,
      isFeatured: this.isFeatured,
      category: this.category,
      tags: this.tags,
      language: this.language,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      publishedAt: this.publishedAt
    };
  }

  /**
   * Find NFT by ID
   */
  static async findById(id) {
    try {
      const nftData = await Database.get(`nft:${id}`);
      return nftData ? new MusicNFT(nftData) : null;
    } catch (error) {
      logger.error(`Error finding NFT by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Find NFTs by creator
   */
  static async findByCreator(creatorId, limit = 20, offset = 0) {
    try {
      const nftIds = await Database.smembers(`user:${creatorId}:nfts:created`);
      const paginatedIds = nftIds.slice(offset, offset + limit);
      
      const nfts = await Promise.all(
        paginatedIds.map(id => MusicNFT.findById(id))
      );
      
      return nfts.filter(nft => nft !== null);
    } catch (error) {
      logger.error(`Error finding NFTs by creator ${creatorId}:`, error);
      return [];
    }
  }

  /**
   * Find NFTs by owner
   */
  static async findByOwner(ownerId, limit = 20, offset = 0) {
    try {
      const nftIds = await Database.smembers(`user:${ownerId}:nfts:owned`);
      const paginatedIds = nftIds.slice(offset, offset + limit);
      
      const nfts = await Promise.all(
        paginatedIds.map(id => MusicNFT.findById(id))
      );
      
      return nfts.filter(nft => nft !== null);
    } catch (error) {
      logger.error(`Error finding NFTs by owner ${ownerId}:`, error);
      return [];
    }
  }

  /**
   * Find public NFTs
   */
  static async findPublic(limit = 20, offset = 0) {
    try {
      const nftIds = await Database.smembers('nfts:visibility:public');
      const paginatedIds = nftIds.slice(offset, offset + limit);
      
      const nfts = await Promise.all(
        paginatedIds.map(id => MusicNFT.findById(id))
      );
      
      return nfts.filter(nft => nft !== null && nft.isActive);
    } catch (error) {
      logger.error('Error finding public NFTs:', error);
      return [];
    }
  }

  /**
   * Find featured NFTs
   */
  static async findFeatured(limit = 10) {
    try {
      const nftIds = await Database.smembers('nfts:featured');
      const limitedIds = nftIds.slice(0, limit);
      
      const nfts = await Promise.all(
        limitedIds.map(id => MusicNFT.findById(id))
      );
      
      return nfts.filter(nft => nft !== null && nft.isActive);
    } catch (error) {
      logger.error('Error finding featured NFTs:', error);
      return [];
    }
  }

  /**
   * Find NFTs by category
   */
  static async findByCategory(category, limit = 20, offset = 0) {
    try {
      const nftIds = await Database.smembers(`nfts:category:${category}`);
      const paginatedIds = nftIds.slice(offset, offset + limit);
      
      const nfts = await Promise.all(
        paginatedIds.map(id => MusicNFT.findById(id))
      );
      
      return nfts.filter(nft => nft !== null && nft.isActive);
    } catch (error) {
      logger.error(`Error finding NFTs by category ${category}:`, error);
      return [];
    }
  }

  /**
   * Search NFTs
   */
  static async search(query, limit = 20) {
    try {
      const nftIds = await Database.smembers('nfts');
      const nfts = await Promise.all(
        nftIds.map(id => MusicNFT.findById(id))
      );
      
      const searchTerm = query.toLowerCase();
      const filteredNFTs = nfts.filter(nft => {
        if (!nft || !nft.isActive) return false;
        return (
          nft.title.toLowerCase().includes(searchTerm) ||
          nft.description.toLowerCase().includes(searchTerm) ||
          nft.music.genre.toLowerCase().includes(searchTerm) ||
          nft.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      });
      
      return filteredNFTs.slice(0, limit);
    } catch (error) {
      logger.error('Error searching NFTs:', error);
      return [];
    }
  }

  /**
   * Get trending NFTs (by plays)
   */
  static async getTrending(limit = 20) {
    try {
      const nftIds = await Database.smembers('nfts:visibility:public');
      const nfts = await Promise.all(
        nftIds.map(id => MusicNFT.findById(id))
      );
      
      const activeNFTs = nfts.filter(nft => nft && nft.isActive);
      
      // Sort by plays (descending)
      activeNFTs.sort((a, b) => b.analytics.plays - a.analytics.plays);
      
      return activeNFTs.slice(0, limit);
    } catch (error) {
      logger.error('Error getting trending NFTs:', error);
      return [];
    }
  }

  /**
   * Get NFT statistics
   */
  static async getStats() {
    try {
      const nftIds = await Database.smembers('nfts');
      const nfts = await Promise.all(
        nftIds.map(id => MusicNFT.findById(id))
      );
      
      const activeNFTs = nfts.filter(nft => nft && nft.isActive);
      const totalPlays = activeNFTs.reduce((sum, nft) => sum + nft.analytics.plays, 0);
      const totalLikes = activeNFTs.reduce((sum, nft) => sum + nft.analytics.likes, 0);
      const forSale = activeNFTs.filter(nft => nft.market.isForSale).length;
      
      return {
        totalNFTs: activeNFTs.length,
        totalPlays,
        totalLikes,
        forSale,
        categories: await this.getCategoryStats()
      };
    } catch (error) {
      logger.error('Error getting NFT stats:', error);
      return {
        totalNFTs: 0,
        totalPlays: 0,
        totalLikes: 0,
        forSale: 0,
        categories: {}
      };
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats() {
    try {
      const categories = ['music', 'podcast', 'audiobook', 'sound-effect'];
      const stats = {};
      
      for (const category of categories) {
        const nftIds = await Database.smembers(`nfts:category:${category}`);
        stats[category] = nftIds.length;
      }
      
      return stats;
    } catch (error) {
      logger.error('Error getting category stats:', error);
      return {};
    }
  }

  /**
   * Delete NFT
   */
  static async deleteById(id) {
    try {
      const nft = await MusicNFT.findById(id);
      if (!nft) return false;

      // Remove from indexes
      await Database.srem(`user:${nft.creator}:nfts:created`, id);
      await Database.srem(`user:${nft.owner}:nfts:owned`, id);
      await Database.srem(`nfts:category:${nft.category}`, id);
      await Database.srem(`nfts:status:${nft.status}`, id);
      await Database.srem(`nfts:visibility:${nft.visibility}`, id);
      await Database.srem('nfts:featured', id);
      
      for (const tag of nft.tags) {
        await Database.srem(`nfts:tag:${tag}`, id);
      }
      
      // Remove from main set
      await Database.srem('nfts', id);
      
      // Delete NFT data
      await Database.del(`nft:${id}`);
      
      // Clean up related data
      await Database.del(`nft:${id}:likes`);
      await Database.del(`nft:${id}:listeners`);

      logger.info(`NFT deleted: ${nft.title} (${id})`);
      return true;
    } catch (error) {
      logger.error(`Error deleting NFT ${id}:`, error);
      return false;
    }
  }
}

export default MusicNFT;