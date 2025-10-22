import MusicNFT from './src/models/MusicNFT.js';
import Database from './src/config/database.js';

// Test NFT data with complete music fields
const testNFTs = [
  {
    title: 'Ethereal Dreams',
    description: 'A mystical ambient track that transports listeners to otherworldly realms',
    creator: 'test-creator-1',
    owner: 'test-creator-1',
    music: {
      duration: 240,
      genre: 'Ambient',
      bpm: 80,
      key: 'C Major',
      mood: 'Dreamy',
      instruments: ['Synthesizer', 'Pad', 'Reverb'],
      tags: ['ambient', 'ethereal', 'dreamy', 'atmospheric']
    },
    market: {
      price: '10.0',
      currency: 'FLOW',
      isForSale: true,
      saleType: 'fixed'
    },
    status: 'minted',
    visibility: 'public'
  },
  {
    title: 'Urban Pulse',
    description: 'High-energy electronic beats perfect for city nightlife',
    creator: 'test-creator-2',
    owner: 'test-creator-2',
    music: {
      duration: 180,
      genre: 'Electronic',
      bpm: 128,
      key: 'A Minor',
      mood: 'Energetic',
      instruments: ['Drum Machine', 'Bass Synth', 'Lead Synth'],
      tags: ['electronic', 'urban', 'energetic', 'dance']
    },
    market: {
      price: '15.5',
      currency: 'FLOW',
      isForSale: true,
      saleType: 'fixed'
    },
    status: 'minted',
    visibility: 'public'
  },
  {
    title: 'Classical Serenity',
    description: 'A peaceful orchestral piece inspired by nature',
    creator: 'test-creator-3',
    owner: 'test-creator-3',
    music: {
      duration: 300,
      genre: 'Classical',
      bpm: 60,
      key: 'D Major',
      mood: 'Peaceful',
      instruments: ['Piano', 'Violin', 'Cello', 'Flute'],
      tags: ['classical', 'peaceful', 'orchestral', 'nature']
    },
    market: {
      price: '8.0',
      currency: 'FLOW',
      isForSale: true,
      saleType: 'fixed'
    },
    status: 'minted',
    visibility: 'public'
  },
  {
    title: 'Jazz Fusion Nights',
    description: 'Smooth jazz with modern electronic elements',
    creator: 'test-creator-4',
    owner: 'test-creator-4',
    music: {
      duration: 220,
      genre: 'Jazz',
      bpm: 110,
      key: 'F# Minor',
      mood: 'Smooth',
      instruments: ['Saxophone', 'Electric Piano', 'Bass Guitar', 'Drums'],
      tags: ['jazz', 'fusion', 'smooth', 'modern']
    },
    market: {
      price: '12.0',
      currency: 'FLOW',
      isForSale: true,
      saleType: 'fixed'
    },
    status: 'minted',
    visibility: 'public'
  },
  {
    title: 'Rock Anthem',
    description: 'Powerful rock anthem with driving guitars and drums',
    creator: 'test-creator-5',
    owner: 'test-creator-5',
    music: {
      duration: 200,
      genre: 'Rock',
      bpm: 140,
      key: 'E Minor',
      mood: 'Powerful',
      instruments: ['Electric Guitar', 'Bass Guitar', 'Drums', 'Vocals'],
      tags: ['rock', 'anthem', 'powerful', 'guitar']
    },
    market: {
      price: '20.0',
      currency: 'FLOW',
      isForSale: false,
      saleType: 'fixed'
    },
    status: 'minted',
    visibility: 'public'
  }
];

async function createTestNFTs() {
  try {
    console.log('Creating test NFTs...');
    
    // Connect to database
    await Database.connect();
    console.log('✅ Database connected');
    
    for (const nftData of testNFTs) {
      console.log(`Creating NFT: ${nftData.title}, isForSale: ${nftData.market.isForSale}`);
      
      const nft = new MusicNFT(nftData);
      await nft.save();
      
      console.log(`✅ NFT "${nft.title}" created successfully with ID: ${nft.id}`);
    }
    
    console.log('\n🎉 All test NFTs created successfully!');
    
    // Verify NFTs were saved
    const nftIds = await Database.smembers('nfts');
    console.log(`📊 Total NFTs in database: ${nftIds.length}`);
    
    await Database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test NFTs:', error);
    await Database.disconnect();
    process.exit(1);
  }
}

createTestNFTs();