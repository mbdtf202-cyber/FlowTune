#!/usr/bin/env node

/**
 * Script to create test NFT data for marketplace demonstration
 */

import MusicNFT from '../src/models/MusicNFT.js';
import logger from '../src/utils/logger.js';

const testNFTs = [
  {
    title: "Ethereal Dreams",
    description: "A mesmerizing ambient track that takes you on a journey through ethereal soundscapes",
    creator: "0x1234567890123456789012345678901234567890",
    owner: "0x1234567890123456789012345678901234567890",
    genre: "Ambient",
    duration: 180,
    audioUrl: "https://gateway.pinata.cloud/ipfs/QmTestAudio1",
    coverImageUrl: "https://via.placeholder.com/512x512/6366f1/ffffff?text=Ethereal+Dreams",
    price: "10.0",
    isForSale: true,
    isFeatured: true,
    tags: ["ambient", "ethereal", "relaxing"],
    aiModel: "musicgen-v1.0",
    prompt: "Ethereal ambient music with floating melodies and atmospheric pads"
  },
  {
    title: "Urban Pulse",
    description: "High-energy electronic track perfect for the city nightlife",
    creator: "0x2345678901234567890123456789012345678901",
    owner: "0x2345678901234567890123456789012345678901",
    genre: "Electronic",
    duration: 240,
    audioUrl: "https://gateway.pinata.cloud/ipfs/QmTestAudio2",
    coverImageUrl: "https://via.placeholder.com/512x512/f59e0b/ffffff?text=Urban+Pulse",
    price: "15.5",
    isForSale: true,
    isFeatured: false,
    tags: ["electronic", "urban", "energetic"],
    aiModel: "musicgen-v1.0",
    prompt: "Upbeat electronic music with urban vibes and pulsing beats"
  },
  {
    title: "Classical Serenity",
    description: "A peaceful classical composition featuring piano and strings",
    creator: "0x3456789012345678901234567890123456789012",
    owner: "0x3456789012345678901234567890123456789012",
    genre: "Classical",
    duration: 300,
    audioUrl: "https://gateway.pinata.cloud/ipfs/QmTestAudio3",
    coverImageUrl: "https://via.placeholder.com/512x512/8b5cf6/ffffff?text=Classical+Serenity",
    price: "8.0",
    isForSale: true,
    isFeatured: true,
    tags: ["classical", "piano", "peaceful"],
    aiModel: "musicgen-v1.0",
    prompt: "Peaceful classical music with piano and string arrangements"
  },
  {
    title: "Jazz Fusion Nights",
    description: "Smooth jazz fusion with modern electronic elements",
    creator: "0x4567890123456789012345678901234567890123",
    owner: "0x4567890123456789012345678901234567890123",
    genre: "Jazz",
    duration: 220,
    audioUrl: "https://gateway.pinata.cloud/ipfs/QmTestAudio4",
    coverImageUrl: "https://via.placeholder.com/512x512/ef4444/ffffff?text=Jazz+Fusion",
    price: "12.0",
    isForSale: true,
    isFeatured: false,
    tags: ["jazz", "fusion", "smooth"],
    aiModel: "musicgen-v1.0",
    prompt: "Smooth jazz fusion with electronic elements and improvisation"
  },
  {
    title: "Rock Anthem",
    description: "Powerful rock anthem with driving guitars and epic vocals",
    creator: "0x5678901234567890123456789012345678901234",
    owner: "0x5678901234567890123456789012345678901234",
    genre: "Rock",
    duration: 280,
    audioUrl: "https://gateway.pinata.cloud/ipfs/QmTestAudio5",
    coverImageUrl: "https://via.placeholder.com/512x512/10b981/ffffff?text=Rock+Anthem",
    price: "20.0",
    isForSale: false, // Not for sale
    isFeatured: false,
    tags: ["rock", "anthem", "powerful"],
    aiModel: "musicgen-v1.0",
    prompt: "Powerful rock anthem with driving guitars and epic melodies"
  }
];

async function createTestNFTs() {
  try {
    logger.info('Creating test NFT data...');
    
    for (const nftData of testNFTs) {
      // Debug: Check isForSale value
      console.log(`Creating NFT: ${nftData.title}, isForSale: ${nftData.isForSale}`);
      
      // Create NFT instance
      const nft = new MusicNFT({
        ...nftData,
        status: 'minted',
        visibility: 'public',
        isActive: true,
        // Add market data
        market: {
          price: nftData.price || '0',
          currency: 'FLOW',
          isForSale: nftData.isForSale !== undefined ? nftData.isForSale : false,
          saleType: 'fixed',
          auctionEndTime: null,
          highestBid: '0',
          bidders: [],
          salesHistory: []
        },
        // Add music data
        music: {
          duration: nftData.duration || 180,
          genre: nftData.genre || 'Unknown',
          bpm: Math.floor(Math.random() * 60) + 80, // 80-140 BPM
          key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)],
          mood: ['energetic', 'calm', 'happy', 'melancholic', 'uplifting'][Math.floor(Math.random() * 5)],
          instruments: [],
          tags: nftData.tags || []
        },
        // Add some analytics data
        analytics: {
          views: Math.floor(Math.random() * 2000) + 200,
          plays: Math.floor(Math.random() * 1000) + 100,
          likes: Math.floor(Math.random() * 200) + 20,
          shares: Math.floor(Math.random() * 50) + 5,
          downloads: Math.floor(Math.random() * 20) + 2,
          comments: Math.floor(Math.random() * 30) + 2,
          uniqueListeners: Math.floor(Math.random() * 500) + 50,
          totalPlayTime: Math.floor(Math.random() * 10000) + 1000
        },
        // Add blockchain data
        blockchain: {
          tokenId: Math.floor(Math.random() * 10000) + 1,
          contractAddress: "0xMockContractAddress",
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
          gasUsed: Math.floor(Math.random() * 100000) + 50000,
          network: "flow-testnet"
        },
        // Add IPFS data
        ipfs: {
          audioHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
          metadataHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
          coverImageHash: nftData.coverImageUrl ? `Qm${Math.random().toString(36).substr(2, 44)}` : null
        }
      });
      
      // Save to database
      await nft.save();
      logger.info(`Created NFT: ${nft.title} (${nft.id})`);
    }
    
    logger.info('Test NFT data created successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error creating test NFTs:', error);
    process.exit(1);
  }
}

// Run the script
createTestNFTs();