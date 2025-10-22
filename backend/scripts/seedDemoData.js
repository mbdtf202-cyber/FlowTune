/**
 * 演示数据种子脚本
 * 为FlowTune平台创建演示用的音乐NFT和用户数据
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import MusicNFT from '../src/models/MusicNFT.js';
import logger from '../src/utils/logger.js';

// 加载环境变量
dotenv.config();

// 演示用户数据
const demoUsers = [
  {
    username: 'ai_composer',
    email: 'composer@flowtune.demo',
    password: 'DemoPass123',
    flowAddress: '0x1234567890123456',
    profile: {
      displayName: 'AI Composer',
      bio: '专注于AI音乐创作的艺术家，探索人工智能与音乐的完美结合',
      avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      website: 'https://aicomposer.demo',
      twitter: '@ai_composer',
      instagram: '@ai_composer_music'
    },
    stats: {
      nftsCreated: 15,
      nftsOwned: 18,
      totalEarnings: '125.5',
      followers: 1250,
      following: 89
    }
  },
  {
    username: 'melody_master',
    email: 'melody@flowtune.demo',
    password: 'DemoPass123',
    flowAddress: '0x2345678901234567',
    profile: {
      displayName: 'Melody Master',
      bio: '电子音乐制作人，热爱创新的音乐风格和实验性声音',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
      website: 'https://melodymaster.demo',
      twitter: '@melody_master',
      instagram: '@melody_master_beats'
    },
    stats: {
      nftsCreated: 23,
      nftsOwned: 31,
      totalEarnings: '89.2',
      followers: 890,
      following: 156
    }
  },
  {
    username: 'beat_creator',
    email: 'beats@flowtune.demo',
    password: 'DemoPass123',
    flowAddress: '0x3456789012345678',
    profile: {
      displayName: 'Beat Creator',
      bio: '节拍制作专家，专门创作各种风格的背景音乐和节拍',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      website: 'https://beatcreator.demo',
      twitter: '@beat_creator',
      instagram: '@beat_creator_studio'
    },
    stats: {
      nftsCreated: 31,
      nftsOwned: 28,
      totalEarnings: '156.8',
      followers: 2100,
      following: 203
    }
  },
  {
    username: 'synth_wave',
    email: 'synth@flowtune.demo',
    password: 'DemoPass123',
    flowAddress: '0x4567890123456789',
    profile: {
      displayName: 'Synth Wave',
      bio: '合成器音乐爱好者，创作复古未来主义风格的电子音乐',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      website: 'https://synthwave.demo',
      twitter: '@synth_wave',
      instagram: '@synth_wave_music'
    },
    stats: {
      nftsCreated: 19,
      nftsOwned: 25,
      totalEarnings: '78.9',
      followers: 1560,
      following: 134
    }
  }
];

// 演示NFT数据
const demoNFTs = [
  {
    title: 'Cosmic Journey',
    description: '一段穿越宇宙的音乐之旅，融合了环境音效和电子合成器',
    creator: '0x1234567890123456',
    owner: '0x1234567890123456',
    files: {
      audio: {
        ipfsHash: 'QmCosmicJourneyAudio123',
        url: 'https://gateway.pinata.cloud/ipfs/QmCosmicJourneyAudio123',
        duration: 245
      },
      cover: {
        ipfsHash: 'QmCosmicJourneyCover123',
        url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800'
      },
      metadata: {
        ipfsHash: 'QmCosmicJourneyMeta123',
        url: 'https://gateway.pinata.cloud/ipfs/QmCosmicJourneyMeta123'
      }
    },
    blockchain: {
      tokenId: '1',
      contractAddress: '0xMusicNFTContract',
      transactionHash: '0xCosmicJourneyTx123',
      blockNumber: 12345,
      network: 'flow-testnet'
    },
    metadata: {
      genre: 'Ambient Electronic',
      bpm: 85,
      key: 'C Minor',
      aiModel: 'MusicGen-Large',
      prompt: 'Create an ambient electronic track that evokes the feeling of traveling through space',
      tags: ['ambient', 'electronic', 'space', 'cosmic', 'atmospheric'],
      mood: 'Contemplative',
      energy: 'Low'
    },
    market: {
      isForSale: true,
      price: '15.5',
      currency: 'FLOW',
      listedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
      views: 1250,
      likes: 89,
      shares: 23
    },
    royalties: [
      {
        recipient: '0x1234567890123456',
        percentage: 10
      }
    ]
  },
  {
    title: 'Digital Dreams',
    description: '梦幻般的数字音景，结合了合成器和自然声音',
    creator: '0x2345678901234567',
    owner: '0x2345678901234567',
    files: {
      audio: {
        ipfsHash: 'QmDigitalDreamsAudio456',
        url: 'https://gateway.pinata.cloud/ipfs/QmDigitalDreamsAudio456',
        duration: 198
      },
      cover: {
        ipfsHash: 'QmDigitalDreamsCover456',
        url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800'
      },
      metadata: {
        ipfsHash: 'QmDigitalDreamsMeta456',
        url: 'https://gateway.pinata.cloud/ipfs/QmDigitalDreamsMeta456'
      }
    },
    blockchain: {
      tokenId: '2',
      contractAddress: '0xMusicNFTContract',
      transactionHash: '0xDigitalDreamsTx456',
      blockNumber: 12346,
      network: 'flow-testnet'
    },
    metadata: {
      genre: 'Synthwave',
      bpm: 120,
      key: 'A Major',
      aiModel: 'MusicGen-Medium',
      prompt: 'Generate a synthwave track with dreamy pads and retro-futuristic vibes',
      tags: ['synthwave', 'retro', 'dreamy', 'electronic', 'nostalgic'],
      mood: 'Dreamy',
      energy: 'Medium'
    },
    market: {
      isForSale: false,
      price: '0',
      currency: 'FLOW',
      views: 890,
      likes: 156,
      shares: 45,
      lastSalePrice: '22.0',
      lastSaleDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    royalties: [
      {
        recipient: '0x2345678901234567',
        percentage: 8
      }
    ]
  },
  {
    title: 'Urban Pulse',
    description: '城市节拍的现代诠释，融合了嘻哈和电子元素',
    creator: '0x3456789012345678',
    owner: '0x4567890123456789',
    files: {
      audio: {
        ipfsHash: 'QmUrbanPulseAudio789',
        url: 'https://gateway.pinata.cloud/ipfs/QmUrbanPulseAudio789',
        duration: 167
      },
      cover: {
        ipfsHash: 'QmUrbanPulseCover789',
        url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'
      },
      metadata: {
        ipfsHash: 'QmUrbanPulseMeta789',
        url: 'https://gateway.pinata.cloud/ipfs/QmUrbanPulseMeta789'
      }
    },
    blockchain: {
      tokenId: '3',
      contractAddress: '0xMusicNFTContract',
      transactionHash: '0xUrbanPulseTx789',
      blockNumber: 12347,
      network: 'flow-testnet'
    },
    metadata: {
      genre: 'Hip-Hop Electronic',
      bpm: 95,
      key: 'F# Minor',
      aiModel: 'MusicGen-Large',
      prompt: 'Create an urban hip-hop beat with electronic elements and city atmosphere',
      tags: ['hip-hop', 'urban', 'electronic', 'beats', 'city'],
      mood: 'Energetic',
      energy: 'High'
    },
    market: {
      isForSale: true,
      price: '28.0',
      currency: 'FLOW',
      listedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
      views: 2100,
      likes: 234,
      shares: 67,
      salesHistory: [
        {
          price: '25.0',
          currency: 'FLOW',
          seller: '0x3456789012345678',
          buyer: '0x4567890123456789',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ]
    },
    royalties: [
      {
        recipient: '0x3456789012345678',
        percentage: 12
      }
    ]
  },
  {
    title: 'Ethereal Waves',
    description: '空灵的波浪声音，带来宁静和冥想的体验',
    creator: '0x4567890123456789',
    owner: '0x4567890123456789',
    files: {
      audio: {
        ipfsHash: 'QmEtherealWavesAudio012',
        url: 'https://gateway.pinata.cloud/ipfs/QmEtherealWavesAudio012',
        duration: 312
      },
      cover: {
        ipfsHash: 'QmEtherealWavesCover012',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
      },
      metadata: {
        ipfsHash: 'QmEtherealWavesMeta012',
        url: 'https://gateway.pinata.cloud/ipfs/QmEtherealWavesMeta012'
      }
    },
    blockchain: {
      tokenId: '4',
      contractAddress: '0xMusicNFTContract',
      transactionHash: '0xEtherealWavesTx012',
      blockNumber: 12348,
      network: 'flow-testnet'
    },
    metadata: {
      genre: 'Ambient',
      bpm: 60,
      key: 'D Major',
      aiModel: 'MusicGen-Medium',
      prompt: 'Generate a peaceful ambient track with ethereal pads and gentle waves',
      tags: ['ambient', 'peaceful', 'meditation', 'ethereal', 'waves'],
      mood: 'Peaceful',
      energy: 'Very Low'
    },
    market: {
      isForSale: true,
      price: '12.8',
      currency: 'FLOW',
      listedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
      views: 567,
      likes: 78,
      shares: 19
    },
    royalties: [
      {
        recipient: '0x4567890123456789',
        percentage: 15
      }
    ]
  },
  {
    title: 'Neon Nights',
    description: '霓虹灯下的夜晚，充满未来感的电子音乐',
    creator: '0x1234567890123456',
    owner: '0x2345678901234567',
    files: {
      audio: {
        ipfsHash: 'QmNeonNightsAudio345',
        url: 'https://gateway.pinata.cloud/ipfs/QmNeonNightsAudio345',
        duration: 223
      },
      cover: {
        ipfsHash: 'QmNeonNightsCover345',
        url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800'
      },
      metadata: {
        ipfsHash: 'QmNeonNightsMeta345',
        url: 'https://gateway.pinata.cloud/ipfs/QmNeonNightsMeta345'
      }
    },
    blockchain: {
      tokenId: '5',
      contractAddress: '0xMusicNFTContract',
      transactionHash: '0xNeonNightsTx345',
      blockNumber: 12349,
      network: 'flow-testnet'
    },
    metadata: {
      genre: 'Cyberpunk',
      bpm: 128,
      key: 'E Minor',
      aiModel: 'MusicGen-Large',
      prompt: 'Create a cyberpunk track with neon aesthetics and futuristic sounds',
      tags: ['cyberpunk', 'futuristic', 'neon', 'electronic', 'dark'],
      mood: 'Mysterious',
      energy: 'High'
    },
    market: {
      isForSale: false,
      price: '0',
      currency: 'FLOW',
      views: 1890,
      likes: 267,
      shares: 89,
      lastSalePrice: '35.5',
      lastSaleDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      salesHistory: [
        {
          price: '30.0',
          currency: 'FLOW',
          seller: '0x1234567890123456',
          buyer: '0x2345678901234567',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ]
    },
    royalties: [
      {
        recipient: '0x1234567890123456',
        percentage: 10
      }
    ]
  }
];

/**
 * 连接数据库
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flowtune');
    logger.info('Connected to MongoDB for demo data seeding');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * 清理现有数据
 */
async function clearExistingData() {
  try {
    await User.deleteMany({ email: { $regex: '@flowtune.demo$' } });
    await MusicNFT.deleteMany({ creator: { $in: demoUsers.map(u => u.flowAddress) } });
    logger.info('Cleared existing demo data');
  } catch (error) {
    logger.error('Error clearing existing data:', error);
  }
}

/**
 * 创建演示用户
 */
async function createDemoUsers() {
  try {
    const users = [];
    
    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = new User({
        ...userData,
        password: hashedPassword,
        isVerified: true,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 随机过去30天内
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // 随机过去7天内
      });
      
      await user.save();
      users.push(user);
      logger.info(`Created demo user: ${user.username}`);
    }
    
    return users;
  } catch (error) {
    logger.error('Error creating demo users:', error);
    throw error;
  }
}

/**
 * 创建演示NFT
 */
async function createDemoNFTs() {
  try {
    const nfts = [];
    
    for (const nftData of demoNFTs) {
      const nft = new MusicNFT({
        ...nftData,
        createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000), // 随机过去20天内
        updatedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000) // 随机过去5天内
      });
      
      await nft.save();
      nfts.push(nft);
      logger.info(`Created demo NFT: ${nft.title}`);
    }
    
    return nfts;
  } catch (error) {
    logger.error('Error creating demo NFTs:', error);
    throw error;
  }
}

/**
 * 生成随机统计数据
 */
function generateRandomStats() {
  return {
    totalUsers: 1250 + Math.floor(Math.random() * 500),
    totalNFTs: 890 + Math.floor(Math.random() * 200),
    totalVolume: (450.5 + Math.random() * 100).toFixed(2),
    activeUsers: 156 + Math.floor(Math.random() * 50)
  };
}

/**
 * 主函数
 */
async function seedDemoData() {
  try {
    logger.info('Starting demo data seeding...');
    
    // 连接数据库
    await connectDB();
    
    // 清理现有演示数据
    await clearExistingData();
    
    // 创建演示用户
    const users = await createDemoUsers();
    logger.info(`Created ${users.length} demo users`);
    
    // 创建演示NFT
    const nfts = await createDemoNFTs();
    logger.info(`Created ${nfts.length} demo NFTs`);
    
    // 生成统计数据
    const stats = generateRandomStats();
    logger.info('Generated platform statistics:', stats);
    
    logger.info('Demo data seeding completed successfully!');
    logger.info('Demo users credentials:');
    demoUsers.forEach(user => {
      logger.info(`  ${user.username}: ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    logger.error('Error seeding demo data:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData();
}

export default seedDemoData;