/**
 * NFT Routes
 * Handles NFT minting, listing, and management
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import ipfsService from '../services/ipfsService.js';
import MusicNFT from '../models/MusicNFT.js';
import logger from '../utils/logger.js';
import securityMiddleware from '../middleware/security.js';

// 动态导入flowService以避免在.env加载前初始化
const getFlowService = async () => {
  const { default: flowService } = await import('../services/flowService.js');
  return flowService;
};

const router = express.Router();

/**
 * @route   POST /api/nft/mint
 * @desc    Mint a music NFT on Flow blockchain
 * @access  Private
 */
router.post('/mint', [
  securityMiddleware.rateLimiters.blockchain,
  authenticateToken,
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional(),
  body('audioHash').notEmpty().withMessage('Audio IPFS hash is required'),
  body('metadataHash').notEmpty().withMessage('Metadata IPFS hash is required'),
  body('royalties').optional().isArray().withMessage('Royalties must be an array'),
  body('royalties.*.recipient').optional().isString(),
  body('royalties.*.percentage').optional().isNumeric().custom(value => {
    if (value < 0 || value > 50) {
      throw new Error('Royalty percentage must be between 0 and 50');
    }
    return true;
  })
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      audioHash,
      coverImageHash,
      metadataHash,
      royalties = []
    } = req.body;

    const user = req.user;
    const recipientAddress = user.flowWallet?.address || user.address || process.env.FLOW_ADDRESS;

    if (!recipientAddress) {
      return res.status(400).json({
        success: false,
        message: 'No Flow address found. Please connect your Flow wallet.'
      });
    }

    logger.info(`🎨 Minting NFT: ${title} for user ${user.username}`);

    // Prepare minting parameters
    const mintParams = {
      recipient: recipientAddress,
      title,
      description: description || 'AI Generated Music NFT',
      audioHash,
      coverImageHash: coverImageHash || '',
      metadataHash,
      royalties: royalties.map(r => ({
        recipient: r.recipient || recipientAddress,
        percentage: r.percentage || 0
      }))
    };

    // Mint NFT on Flow blockchain
    const flowService = await getFlowService();
    const mintResult = await flowService.mintMusicNFT(mintParams);

    if (!mintResult.success) {
      return res.status(500).json({
        success: false,
        message: 'NFT minting failed on Flow blockchain',
        error: mintResult.error
      });
    }

    // Create NFT record in database
    const nftRecord = new MusicNFT({
      title,
      description,
      creator: recipientAddress,
      owner: recipientAddress,
      files: {
        audio: {
          ipfsHash: audioHash,
          url: `https://gateway.pinata.cloud/ipfs/${audioHash}`
        },
        cover: {
          ipfsHash: coverImageHash,
          url: coverImageHash ? `https://gateway.pinata.cloud/ipfs/${coverImageHash}` : ''
        },
        metadata: {
          ipfsHash: metadataHash,
          url: `https://gateway.pinata.cloud/ipfs/${metadataHash}`
        }
      },
      blockchain: {
        tokenId: mintResult.tokenId,
        contractAddress: process.env.MUSIC_NFT_CONTRACT_ADDRESS || 'MusicNFT',
        transactionHash: mintResult.transactionId,
        blockNumber: mintResult.blockHeight,
        mintedAt: new Date(),
        network: 'flow'
      },
      royalties: royalties,
      status: 'minted'
    });

    // Save the NFT record
    await nftRecord.save();

    logger.info(`✅ NFT minted successfully: Token ID ${mintResult.tokenId}`);

    res.json({
      success: true,
      message: 'NFT minted successfully',
      data: {
        nftId: nftRecord.id,
        tokenId: mintResult.tokenId,
        transactionId: mintResult.transactionId,
        blockHeight: mintResult.blockHeight,
        gasUsed: mintResult.gasUsed,
        isMock: mintResult.isMock || false,
        nft: nftRecord.toObject()
      }
    });

  } catch (error) {
    logger.error('NFT minting error:', error);
    res.status(500).json({
      success: false,
      message: 'NFT minting failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/nft/marketplace
 * @desc    Get NFTs listed for sale
 * @access  Public
 */
router.get('/marketplace', async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, priceMin, priceMax, sortBy = 'createdAt' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Debug: Check Redis connection first
    const Database = (await import('../config/database.js')).default;
    console.log('Redis connection status:', Database.isConnected);
    console.log('Redis config:', {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      db: process.env.REDIS_DB || 0
    });
    
    const allNFTIds = await Database.smembers('nfts');
    console.log(`Redis has ${allNFTIds.length} NFT IDs`);
    const publicNFTIds = await Database.smembers('nfts:visibility:public');
    console.log(`Redis has ${publicNFTIds.length} public NFT IDs`);
    
    // Test if we can set and get a value
    await Database.set('test:api', 'working');
    const testValue = await Database.get('test:api');
    console.log('Redis test value:', testValue);
    
    // Get all public NFTs first
    const allNFTs = await MusicNFT.findPublic(1000, 0); // Get a large number to filter from
    console.log(`Found ${allNFTs.length} public NFTs`);
    
    // Debug: Check market.isForSale values
    allNFTs.slice(0, 5).forEach((nft, index) => {
      console.log(`NFT ${index + 1}: ${nft.title}, isForSale: ${nft.market?.isForSale}, price: ${nft.market?.price}`);
    });
    
    // Filter for marketplace (for sale)
    let marketplaceNFTs = allNFTs.filter(nft => nft.market.isForSale);
    console.log(`Found ${marketplaceNFTs.length} NFTs for sale`);

    // Apply genre filter
    if (genre) {
      marketplaceNFTs = marketplaceNFTs.filter(nft => 
        nft.music.genre.toLowerCase() === genre.toLowerCase()
      );
    }

    // Apply price filters
    if (priceMin || priceMax) {
      marketplaceNFTs = marketplaceNFTs.filter(nft => {
        const price = parseFloat(nft.market.price);
        if (priceMin && price < parseFloat(priceMin)) return false;
        if (priceMax && price > parseFloat(priceMax)) return false;
        return true;
      });
    }

    // Sort NFTs
    if (sortBy === 'price') {
      marketplaceNFTs.sort((a, b) => parseFloat(a.market.price) - parseFloat(b.market.price));
    } else if (sortBy === 'priceDesc') {
      marketplaceNFTs.sort((a, b) => parseFloat(b.market.price) - parseFloat(a.market.price));
    } else if (sortBy === 'createdAt') {
      marketplaceNFTs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'plays') {
      marketplaceNFTs.sort((a, b) => b.analytics.plays - a.analytics.plays);
    }

    // Apply pagination
    const total = marketplaceNFTs.length;
    const paginatedNFTs = marketplaceNFTs.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        nfts: paginatedNFTs.map(nft => nft.toObject()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          genre,
          priceMin,
          priceMax,
          sortBy
        }
      }
    });

  } catch (error) {
    logger.error('Get marketplace NFTs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get marketplace NFTs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/nft/user/:address
 * @desc    Get NFTs owned by a user
 * @access  Public
 */
router.get('/user/:address', [
  param('address').matches(/^0x[a-fA-F0-9]{16}$/).withMessage('Invalid Flow address format')
], async (req, res) => {
  try {
    const flowService = await getFlowService();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const nfts = await MusicNFT.findByOwner(address, parseInt(limit), offset);

    res.json({
      success: true,
      data: {
        nfts: nfts.map(nft => nft.toObject()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: nfts.length
        }
      }
    });

  } catch (error) {
    logger.error('Get user NFTs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user NFTs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/nft/profile/:userId
 * @desc    Get NFTs by user ID (for profile page)
 * @access  Public
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 模拟用户NFT数据
    const mockUserNFTs = {
      'demo_user': [
        {
          id: 'nft_1',
          title: 'Ethereal Dreams',
          genre: 'Ambient',
          coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
          createdAt: '2024-01-15T10:30:00Z',
          plays: 245,
          likes: 18,
          shares: 7,
          duration: 180,
          isPublic: true
        },
        {
          id: 'nft_2',
          title: 'Urban Pulse',
          genre: 'Electronic',
          coverImage: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=300&h=300&fit=crop',
          createdAt: '2024-01-20T14:15:00Z',
          plays: 189,
          likes: 23,
          shares: 12,
          duration: 210,
          isPublic: true
        },
        {
          id: 'nft_3',
          title: 'Classical Serenity',
          genre: 'Classical',
          coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
          createdAt: '2024-01-25T09:45:00Z',
          plays: 156,
          likes: 31,
          shares: 5,
          duration: 240,
          isPublic: false
        }
      ]
    };

    const userNFTs = mockUserNFTs[userId] || [];

    res.json({
      success: true,
      data: userNFTs
    });

  } catch (error) {
    logger.error('Get user NFTs by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user NFTs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/nft/user-library
 * @desc    Get current user's NFT library
 * @access  Private
 */
router.get('/user-library', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const userAddress = user.flowWallet?.address || user.address;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        message: 'No Flow address found for user'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const nfts = await MusicNFT.findByOwner(userAddress, parseInt(limit), offset);

    res.json({
      success: true,
      data: {
        nfts: nfts.map(nft => nft.toObject()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: nfts.length
        }
      }
    });

  } catch (error) {
    logger.error('Get user library error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user library',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/nft/:tokenId
 * @desc    Get NFT details by token ID
 * @access  Public
 */
router.get('/:tokenId', [
  param('tokenId').isNumeric().withMessage('Token ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { tokenId } = req.params;

    // Get NFT from database by tokenId
    // Since we don't have a direct findByTokenId method, we'll need to search through all NFTs
    // For now, let's use findById with tokenId as the ID (this is a simplified approach)
    const nft = await MusicNFT.findById(tokenId);
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        message: 'NFT not found'
      });
    }

    // Get blockchain details
    const flowService = await getFlowService();
    const blockchainDetails = await flowService.getNFTDetails(tokenId);

    res.json({
      success: true,
      data: {
        nft: nft.toObject(),
        blockchain: blockchainDetails
      }
    });

  } catch (error) {
    logger.error('Get NFT error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get NFT details',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/nft/:tokenId/list
 * @desc    List NFT for sale
 * @access  Private
 */
router.post('/:tokenId/list', [
  authenticateToken,
  param('tokenId').isNumeric().withMessage('Token ID must be a number'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('currency').optional().isIn(['FLOW', 'USDC']).withMessage('Currency must be FLOW or USDC')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { tokenId } = req.params;
    const { price, currency = 'FLOW' } = req.body;
    const user = req.user;

    // Find NFT
    const nft = await MusicNFT.findOne({ 'blockchain.tokenId': tokenId });
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        message: 'NFT not found'
      });
    }

    // Check ownership
    const userAddress = user.flowWallet?.address || user.address;
    if (nft.owner !== userAddress) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this NFT'
      });
    }

    // List NFT for sale
    const flowService = await getFlowService();
    const listResult = await flowService.listNFTForSale({
      tokenId,
      price,
      currency,
      seller: userAddress
    });

    // Update NFT record
    nft.market.isForSale = true;
    nft.market.price = price.toString();
    nft.market.currency = currency;
    nft.market.listedAt = new Date();
    await nft.save();

    logger.info(`📝 NFT ${tokenId} listed for sale at ${price} ${currency}`);

    res.json({
      success: true,
      message: 'NFT listed for sale successfully',
      data: {
        listingId: listResult.listingId,
        tokenId,
        price,
        currency,
        isMock: listResult.isMock || false
      }
    });

  } catch (error) {
    logger.error('List NFT error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list NFT for sale',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/nft/:tokenId/purchase
 * @desc    Purchase NFT from marketplace
 * @access  Private
 */
router.post('/:tokenId/purchase', [
  securityMiddleware.rateLimiters.blockchain,
  authenticateToken,
  param('tokenId').isNumeric().withMessage('Token ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { tokenId } = req.params;
    const user = req.user;
    const buyerAddress = user.flowWallet?.address || user.address;

    if (!buyerAddress) {
      return res.status(400).json({
        success: false,
        message: 'No Flow address found. Please connect your Flow wallet.'
      });
    }

    // Find NFT
    const nft = await MusicNFT.findOne({ 'blockchain.tokenId': tokenId });
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        message: 'NFT not found'
      });
    }

    // Check if NFT is for sale
    if (!nft.market.isForSale) {
      return res.status(400).json({
        success: false,
        message: 'NFT is not for sale'
      });
    }

    // Check if buyer is not the owner
    if (nft.owner === buyerAddress) {
      return res.status(400).json({
        success: false,
        message: 'You cannot purchase your own NFT'
      });
    }

    // Check buyer's balance
    const accountInfo = await flowService.getAccountBalance(buyerAddress);
    const nftPrice = parseFloat(nft.market.price);
    const buyerBalance = parseFloat(accountInfo.balance);

    if (buyerBalance < nftPrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to purchase this NFT'
      });
    }

    // Execute purchase transaction
    const purchaseResult = await flowService.purchaseNFT({
      tokenId,
      price: nft.market.price,
      seller: nft.owner,
      buyer: buyerAddress,
      currency: nft.market.currency || 'FLOW'
    });

    if (!purchaseResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Purchase transaction failed',
        error: purchaseResult.error
      });
    }

    // Update NFT ownership and market status
    const previousOwner = nft.owner;
    nft.owner = buyerAddress;
    nft.market.isForSale = false;
    nft.market.lastSalePrice = nft.market.price;
    nft.market.lastSaleDate = new Date();
    nft.market.price = '0';
    nft.market.listedAt = null;

    // Add to sales history
    if (!nft.market.salesHistory) {
      nft.market.salesHistory = [];
    }
    nft.market.salesHistory.push({
      price: nft.market.lastSalePrice,
      currency: nft.market.currency || 'FLOW',
      seller: previousOwner,
      buyer: buyerAddress,
      date: new Date(),
      transactionHash: purchaseResult.transactionHash
    });

    // Update analytics
    nft.analytics.totalEarnings = (parseFloat(nft.analytics.totalEarnings || '0') + nftPrice).toString();

    await nft.save();

    logger.info(`💰 NFT ${tokenId} purchased by ${buyerAddress} for ${nft.market.lastSalePrice} ${nft.market.currency}`);

    res.json({
      success: true,
      message: 'NFT purchased successfully',
      data: {
        tokenId,
        transactionHash: purchaseResult.transactionHash,
        price: nft.market.lastSalePrice,
        currency: nft.market.currency || 'FLOW',
        previousOwner,
        newOwner: buyerAddress,
        isMock: purchaseResult.isMock || false
      }
    });

  } catch (error) {
    logger.error('Purchase NFT error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase NFT',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/nft/:tokenId/remove-from-sale
 * @desc    Remove NFT from marketplace
 * @access  Private
 */
router.post('/:tokenId/remove-from-sale', [
  authenticateToken,
  param('tokenId').isNumeric().withMessage('Token ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { tokenId } = req.params;
    const user = req.user;
    const userAddress = user.flowWallet?.address || user.address;

    // Find NFT
    const nft = await MusicNFT.findOne({ 'blockchain.tokenId': tokenId });
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        message: 'NFT not found'
      });
    }

    // Check ownership
    if (nft.owner !== userAddress) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this NFT'
      });
    }

    // Check if NFT is for sale
    if (!nft.market.isForSale) {
      return res.status(400).json({
        success: false,
        message: 'NFT is not currently for sale'
      });
    }

    // Remove from marketplace
    const flowService = await getFlowService();
    const removeResult = await flowService.removeNFTFromSale({
      tokenId,
      owner: userAddress
    });

    // Update NFT record
    nft.market.isForSale = false;
    nft.market.price = '0';
    nft.market.listedAt = null;
    await nft.save();

    logger.info(`📤 NFT ${tokenId} removed from sale by ${userAddress}`);

    res.json({
      success: true,
      message: 'NFT removed from sale successfully',
      data: {
        tokenId,
        isMock: removeResult.isMock || false
      }
    });

  } catch (error) {
    logger.error('Remove NFT from sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove NFT from sale',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/nft/user-library
 * @desc    Get current user's NFT library
 * @access  Private
 */
export default router;