/**
 * End-to-End API Tests
 * Tests complete workflows and API integrations
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index.js';

describe('E2E API Tests', () => {
  let server;
  let testUserId;
  let testNFTId;

  beforeAll(async () => {
    // Start test server
    server = app.listen(0);
  });

  afterAll(async () => {
    // Clean up
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('User Registration and Authentication Flow', () => {
    test('should complete full user registration flow', async () => {
      const userData = {
        username: 'testuser_e2e',
        email: 'test@example.com',
        password: 'TestPassword123!',
        walletAddress: '0x1234567890abcdef'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('success', true);
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user).toHaveProperty('id');
      
      testUserId = registerResponse.body.user.id;

      // Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
    });
  });

  describe('Music Generation and NFT Creation Flow', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      
      authToken = loginResponse.body.token;
    });

    test('should complete music generation to NFT minting flow', async () => {
      // Step 1: Generate music
      const musicPrompt = {
        prompt: 'Create a peaceful ambient track with nature sounds',
        genre: 'ambient',
        duration: 30,
        mood: 'peaceful'
      };

      const generateResponse = await request(app)
        .post('/api/music/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(musicPrompt)
        .expect(200);

      expect(generateResponse.body).toHaveProperty('success', true);
      expect(generateResponse.body).toHaveProperty('audioUrl');
      expect(generateResponse.body).toHaveProperty('metadata');

      // Step 2: Upload to IPFS
      const ipfsResponse = await request(app)
        .post('/api/ipfs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          audioUrl: generateResponse.body.audioUrl,
          metadata: generateResponse.body.metadata
        })
        .expect(200);

      expect(ipfsResponse.body).toHaveProperty('success', true);
      expect(ipfsResponse.body).toHaveProperty('ipfsHash');

      // Step 3: Mint NFT
      const mintResponse = await request(app)
        .post('/api/nft/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Ambient Track',
          description: 'AI-generated ambient music',
          ipfsHash: ipfsResponse.body.ipfsHash,
          royalties: [
            { recipient: '0x1234567890abcdef', percentage: 10, description: 'Artist royalty' }
          ]
        })
        .expect(201);

      expect(mintResponse.body).toHaveProperty('success', true);
      expect(mintResponse.body).toHaveProperty('nftId');
      expect(mintResponse.body).toHaveProperty('transactionId');
      
      testNFTId = mintResponse.body.nftId;
    });
  });

  describe('Marketplace Operations Flow', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      
      authToken = loginResponse.body.token;
    });

    test('should complete NFT listing and marketplace interaction flow', async () => {
      // Step 1: List NFT on marketplace
      const listingResponse = await request(app)
        .post('/api/marketplace/list')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nftId: testNFTId,
          price: '10.0',
          currency: 'FLOW'
        })
        .expect(201);

      expect(listingResponse.body).toHaveProperty('success', true);
      expect(listingResponse.body).toHaveProperty('listingId');

      // Step 2: Get marketplace listings
      const marketplaceResponse = await request(app)
        .get('/api/marketplace/listings')
        .expect(200);

      expect(marketplaceResponse.body).toHaveProperty('success', true);
      expect(marketplaceResponse.body).toHaveProperty('listings');
      expect(Array.isArray(marketplaceResponse.body.listings)).toBe(true);

      // Step 3: Get specific NFT details
      const nftResponse = await request(app)
        .get(`/api/nft/${testNFTId}`)
        .expect(200);

      expect(nftResponse.body).toHaveProperty('success', true);
      expect(nftResponse.body).toHaveProperty('nft');
      expect(nftResponse.body.nft).toHaveProperty('id', testNFTId);
    });
  });

  describe('Analytics and Reporting Flow', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      
      authToken = loginResponse.body.token;
    });

    test('should retrieve user analytics and platform statistics', async () => {
      // Step 1: Get user analytics
      const userAnalyticsResponse = await request(app)
        .get('/api/analytics/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(userAnalyticsResponse.body).toHaveProperty('success', true);
      expect(userAnalyticsResponse.body).toHaveProperty('analytics');
      expect(userAnalyticsResponse.body.analytics).toHaveProperty('totalNFTs');
      expect(userAnalyticsResponse.body.analytics).toHaveProperty('totalEarnings');

      // Step 2: Get platform statistics
      const platformStatsResponse = await request(app)
        .get('/api/analytics/platform')
        .expect(200);

      expect(platformStatsResponse.body).toHaveProperty('success', true);
      expect(platformStatsResponse.body).toHaveProperty('stats');
      expect(platformStatsResponse.body.stats).toHaveProperty('totalUsers');
      expect(platformStatsResponse.body.stats).toHaveProperty('totalNFTs');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid authentication gracefully', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          prompt: 'Test prompt'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
    });

    test('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          // Missing required fields
          username: 'test'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
    });

    test('should handle rate limiting correctly', async () => {
      const requests = [];
      
      // Send multiple requests rapidly
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .get('/api/marketplace/listings')
        );
      }

      const responses = await Promise.all(requests);
      
      // All requests should succeed (within rate limit)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});