/**
 * Global Test Setup
 * Configures the test environment before all tests run
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

let mongod;

export default async function globalSetup() {
  // Load test environment variables
  dotenv.config({ path: '.env.test' });
  
  console.log('🚀 Setting up test environment...');
  
  try {
    // Start in-memory MongoDB instance
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'flowtune_test'
      }
    });
    
    const uri = mongod.getUri();
    process.env.MONGODB_TEST_URI = uri;
    
    console.log(`📦 MongoDB Memory Server started at: ${uri}`);
    
    // Connect to test database
    await mongoose.connect(uri);
    console.log('✅ Connected to test database');
    
    // Create test indexes
    await createTestIndexes();
    console.log('📊 Test database indexes created');
    
    // Seed test data
    await seedTestData();
    console.log('🌱 Test data seeded');
    
    // Store mongod instance globally for cleanup
    global.__MONGOD__ = mongod;
    
    console.log('✅ Test environment setup complete');
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
}

async function createTestIndexes() {
  try {
    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ username: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ walletAddress: 1 }, { unique: true });
    
    // NFT indexes
    await mongoose.connection.collection('nfts').createIndex({ tokenId: 1 }, { unique: true });
    await mongoose.connection.collection('nfts').createIndex({ creator: 1 });
    await mongoose.connection.collection('nfts').createIndex({ owner: 1 });
    await mongoose.connection.collection('nfts').createIndex({ 'metadata.genre': 1 });
    await mongoose.connection.collection('nfts').createIndex({ createdAt: -1 });
    
    // Playlist indexes
    await mongoose.connection.collection('playlists').createIndex({ creator: 1 });
    await mongoose.connection.collection('playlists').createIndex({ isPublic: 1 });
    await mongoose.connection.collection('playlists').createIndex({ tags: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

async function seedTestData() {
  try {
    // Create test user
    const testUser = {
      _id: new mongoose.Types.ObjectId(),
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: '$2a$10$test.hash.for.testing.purposes.only',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      profile: {
        bio: 'Test user for automated testing',
        avatar: 'https://example.com/avatar.jpg'
      },
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        language: 'en'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await mongoose.connection.collection('users').insertOne(testUser);
    
    // Create test NFTs
    const testNFTs = [
      {
        _id: new mongoose.Types.ObjectId(),
        tokenId: 'test_nft_001',
        title: 'Test Electronic Track',
        description: 'AI-generated electronic music for testing',
        creator: testUser._id,
        owner: testUser._id,
        audioUrl: 'https://ipfs.io/ipfs/QmTestHash001',
        imageUrl: 'https://ipfs.io/ipfs/QmTestImageHash001',
        metadata: {
          genre: 'electronic',
          duration: 180,
          bpm: 128,
          key: 'C major',
          aiModel: 'MusicGen-v1',
          prompt: 'Create an upbeat electronic track'
        },
        playCount: 0,
        totalEarnings: 0,
        isListed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        tokenId: 'test_nft_002',
        title: 'Test Ambient Track',
        description: 'AI-generated ambient music for testing',
        creator: testUser._id,
        owner: testUser._id,
        audioUrl: 'https://ipfs.io/ipfs/QmTestHash002',
        imageUrl: 'https://ipfs.io/ipfs/QmTestImageHash002',
        metadata: {
          genre: 'ambient',
          duration: 240,
          bpm: 80,
          key: 'A minor',
          aiModel: 'MusicGen-v1',
          prompt: 'Create a peaceful ambient soundscape'
        },
        playCount: 5,
        totalEarnings: 0.5,
        isListed: true,
        price: 10.0,
        currency: 'FLOW',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await mongoose.connection.collection('nfts').insertMany(testNFTs);
    
    // Create test playlist
    const testPlaylist = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Playlist',
      description: 'A test playlist for automated testing',
      creator: testUser._id,
      nfts: testNFTs.map(nft => nft._id),
      isPublic: true,
      tags: ['test', 'electronic', 'ambient'],
      playCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await mongoose.connection.collection('playlists').insertOne(testPlaylist);
    
    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}