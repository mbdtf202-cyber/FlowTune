/**
 * Database Integration Tests
 * Tests database operations and data consistency for Redis-based models
 */

import { jest } from '@jest/globals';
import database from '../../src/config/database.js';
import User from '../../src/models/User.js';
import MusicNFT from '../../src/models/MusicNFT.js';
import Playlist from '../../src/models/Playlist.js';

describe('Database Integration Tests', () => {
  let testUser, testNFT, testPlaylist;

  beforeAll(async () => {
    // Initialize Redis database connection
    await database.connect();
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) await User.deleteById(testUser.id);
    if (testNFT) await MusicNFT.deleteById(testNFT.id);
    if (testPlaylist) await Playlist.deleteById(testPlaylist.id);
    
    // Close database connection
    await database.disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    if (testUser) await User.deleteById(testUser.id);
    if (testNFT) await MusicNFT.deleteById(testNFT.id);
    if (testPlaylist) await Playlist.deleteById(testPlaylist.id);
    
    // Reset test objects
    testUser = null;
    testNFT = null;
    testPlaylist = null;
  });

  describe('User Model Operations', () => {
    test('should create and retrieve user with all fields', async () => {
      const userData = {
        username: 'testuser_integration',
        email: 'test_integration@example.com',
        password: 'test_password_123',
        flowWallet: {
          address: '0x1234567890abcdef',
          isConnected: true
        },
        profile: {
          bio: 'Test user bio',
          avatar: 'https://example.com/avatar.jpg',
          socialLinks: {
            twitter: '@testuser',
            instagram: 'testuser'
          }
        },
        preferences: {
          emailNotifications: true,
          pushNotifications: false,
          language: 'en'
        }
      };

      // Create user
      testUser = new User(userData);
      await testUser.save();
      
      expect(testUser).toBeDefined();
      expect(testUser.username).toBe(userData.username);
      expect(testUser.email).toBe(userData.email);
      expect(testUser.flowWallet.address).toBe(userData.flowWallet.address);
      expect(testUser.profile.bio).toBe(userData.profile.bio);
      expect(testUser.preferences.emailNotifications).toBe(true);

      // Retrieve user
      const retrievedUser = await User.findById(testUser.id);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.username).toBe(userData.username);
    });

    test('should handle password hashing', async () => {
      const userData = {
        username: 'hashtest',
        email: 'hashtest@example.com',
        password: 'plaintext_password'
      };

      testUser = new User(userData);
      await testUser.hashPassword();
      await testUser.save();

      expect(testUser.password).not.toBe('plaintext_password');
      expect(await testUser.comparePassword('plaintext_password')).toBe(true);
      expect(await testUser.comparePassword('wrong_password')).toBe(false);
    });

    test('should find user by email', async () => {
      const userData = {
        username: 'emailtest',
        email: 'emailtest@example.com',
        password: 'test_password'
      };

      testUser = new User(userData);
      await testUser.save();

      const foundUser = await User.findByEmail('emailtest@example.com');
      expect(foundUser).toBeDefined();
      expect(foundUser.username).toBe('emailtest');
    });
  });

  describe('NFT Model Operations', () => {
    beforeEach(async () => {
      // Create test user for NFT operations
      testUser = new User({
        username: 'nftowner',
        email: 'nftowner@example.com',
        password: 'hashed_password',
        flowWallet: {
          address: '0x1234567890abcdef',
          isConnected: true
        }
      });
      await testUser.save();
    });

    test('should create NFT with complete metadata', async () => {
      const nftData = {
        title: 'Test NFT Track',
        description: 'AI-generated test music',
        creator: testUser.id,
        owner: testUser.id,
        music: {
          audioUrl: 'https://ipfs.io/ipfs/QmTestHash',
          coverImageUrl: 'https://ipfs.io/ipfs/QmTestImageHash',
          genre: 'electronic',
          duration: 180,
          bpm: 120,
          key: 'C major'
        },
        metadata: {
          aiModel: 'MusicGen-v1',
          prompt: 'Create an upbeat electronic track',
          generationParams: {
            temperature: 0.8,
            topK: 250
          }
        },
        royalties: [
          {
            recipient: '0x1234567890abcdef',
            percentage: 10,
            description: 'Artist royalty'
          }
        ],
        blockchain: {
          network: 'flow-testnet',
          contractAddress: '0xTestContract',
          transactionHash: '0xTestTxHash'
        }
      };

      testNFT = new MusicNFT(nftData);
      await testNFT.save();

      expect(testNFT).toBeDefined();
      expect(testNFT.title).toBe(nftData.title);
      expect(testNFT.creator).toBe(testUser.id);
      expect(testNFT.music.genre).toBe(nftData.music.genre);
      expect(testNFT.royalties).toHaveLength(1);
      expect(testNFT.royalties[0].percentage).toBe(10);
    });

    test('should update NFT play count and analytics', async () => {
      testNFT = new MusicNFT({
        title: 'Test Playable NFT',
        creator: testUser.id,
        owner: testUser.id,
        music: {
          audioUrl: 'https://ipfs.io/ipfs/QmTestHash2'
        }
      });
      await testNFT.save();

      // Update play count
      await testNFT.incrementPlays(testUser.id);
      await testNFT.save();

      const updatedNFT = await MusicNFT.findById(testNFT.id);
      expect(updatedNFT.analytics.plays).toBe(1);
      expect(updatedNFT.analytics.uniqueListeners).toBe(1);
    });
  });

  describe('Playlist Model Operations', () => {
    beforeEach(async () => {
      // Create test user and NFTs for playlist operations
      testUser = new User({
        username: 'playlistowner',
        email: 'playlistowner@example.com',
        password: 'hashed_password',
        flowWallet: {
          address: '0x1234567890abcdef',
          isConnected: true
        }
      });
      await testUser.save();

      testNFT = new MusicNFT({
        title: 'Playlist Test NFT',
        creator: testUser.id,
        owner: testUser.id,
        music: {
          audioUrl: 'https://ipfs.io/ipfs/QmPlaylistTestHash'
        }
      });
      await testNFT.save();
    });

    test('should create playlist with tracks', async () => {
      const playlistData = {
        name: 'Test Playlist',
        description: 'A test playlist for integration testing',
        owner: testUser.id,
        tracks: [testNFT.id],
        isPublic: true,
        tags: ['test', 'integration', 'electronic']
      };

      testPlaylist = new Playlist(playlistData);
      await testPlaylist.save();

      expect(testPlaylist).toBeDefined();
      expect(testPlaylist.name).toBe(playlistData.name);
      expect(testPlaylist.owner).toBe(testUser.id);
      expect(testPlaylist.tracks).toHaveLength(1);
      expect(testPlaylist.tracks[0]).toBe(testNFT.id);
    });

    test('should add and remove tracks from playlist', async () => {
      testPlaylist = new Playlist({
        name: 'Test Track Management',
        owner: testUser.id,
        isPublic: true
      });
      await testPlaylist.save();

      // Add track
      testPlaylist.addTrack(testNFT.id);
      await testPlaylist.save();

      expect(testPlaylist.tracks).toHaveLength(1);
      expect(testPlaylist.trackCount).toBe(1);

      // Remove track
      testPlaylist.removeTrack(testNFT.id);
      await testPlaylist.save();

      expect(testPlaylist.tracks).toHaveLength(0);
      expect(testPlaylist.trackCount).toBe(0);
    });
  });

  describe('Cross-Model Relationships', () => {
    beforeEach(async () => {
      testUser = new User({
        username: 'relationshipuser',
        email: 'relationship@example.com',
        password: 'hashed_password',
        flowWallet: {
          address: '0x1234567890abcdef',
          isConnected: true
        }
      });
      await testUser.save();
    });

    test('should maintain referential integrity', async () => {
      // Create NFT
      testNFT = new MusicNFT({
        title: 'Relationship Test NFT',
        creator: testUser.id,
        owner: testUser.id,
        music: {
          audioUrl: 'https://ipfs.io/ipfs/QmRelationshipTestHash'
        }
      });
      await testNFT.save();

      // Create playlist with NFT
      testPlaylist = new Playlist({
        name: 'Relationship Test Playlist',
        owner: testUser.id,
        tracks: [testNFT.id],
        isPublic: true
      });
      await testPlaylist.save();

      // Verify relationships
      const userNFTs = await MusicNFT.findByCreator(testUser.id);
      const userPlaylists = await Playlist.findByOwner(testUser.id);

      expect(userNFTs).toHaveLength(1);
      expect(userPlaylists).toHaveLength(1);
      expect(testPlaylist.tracks[0]).toBe(testNFT.id);
    });

    test('should handle data retrieval correctly', async () => {
      // Create NFT and playlist
      testNFT = new MusicNFT({
        title: 'Data Test NFT',
        creator: testUser.id,
        owner: testUser.id,
        music: {
          audioUrl: 'https://ipfs.io/ipfs/QmDataTestHash'
        }
      });
      await testNFT.save();

      testPlaylist = new Playlist({
        name: 'Data Test Playlist',
        owner: testUser.id,
        tracks: [testNFT.id]
      });
      await testPlaylist.save();

      // Verify data can be retrieved
      const retrievedNFT = await MusicNFT.findById(testNFT.id);
      const retrievedPlaylist = await Playlist.findById(testPlaylist.id);
      
      expect(retrievedNFT).toBeDefined();
      expect(retrievedPlaylist).toBeDefined();
      expect(retrievedNFT.title).toBe('Data Test NFT');
      expect(retrievedPlaylist.name).toBe('Data Test Playlist');
    });
  });

  describe('Database Performance and Indexing', () => {
    test('should efficiently query users by wallet address', async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 10; i++) {
        const user = new User({
          username: `perfuser${i}`,
          email: `perfuser${i}@example.com`,
          password: 'hashed_password',
          flowWallet: {
            address: `0x${i.toString().padStart(40, '0')}`,
            isConnected: true
          }
        });
        await user.save();
        users.push(user);
      }

      const startTime = Date.now();
      const foundUser = await User.findByUsername('perfuser5');
      const queryTime = Date.now() - startTime;

      expect(foundUser).toBeDefined();
      expect(foundUser.username).toBe('perfuser5');
      expect(queryTime).toBeLessThan(100); // Should be fast with proper indexing

      // Cleanup
      for (const user of users) {
        await User.deleteById(user.id);
      }
    });

    test('should efficiently query NFTs by creator', async () => {
      // Create test user
      testUser = new User({
        username: 'nftcreator',
        email: 'nftcreator@example.com',
        password: 'hashed_password',
        flowWallet: {
          address: '0x1234567890abcdef',
          isConnected: true
        }
      });
      await testUser.save();

      // Create multiple NFTs
      const nfts = [];
      for (let i = 0; i < 20; i++) {
        const nft = new MusicNFT({
          title: `Performance Test NFT ${i}`,
          creator: testUser.id,
          owner: testUser.id,
          music: {
            audioUrl: `https://ipfs.io/ipfs/QmPerfTestHash${i}`
          }
        });
        await nft.save();
        nfts.push(nft);
      }

      const startTime = Date.now();
      const creatorNFTs = await MusicNFT.findByCreator(testUser.id);
      const queryTime = Date.now() - startTime;

      expect(creatorNFTs).toHaveLength(20);
      expect(queryTime).toBeLessThan(200); // Should be fast with proper indexing

      // Cleanup
      for (const nft of nfts) {
        await MusicNFT.deleteById(nft.id);
      }
      await User.deleteById(testUser.id);
    });
  });
});