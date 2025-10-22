import request from 'supertest';
import app from '../../src/app.js';
import Database from '../../src/config/database.js';

describe('Complete User Flow E2E Tests', () => {
  let server;
  let userToken;
  let nftId;
  let playlistId;

  beforeAll(async () => {
    // Connect to database
    await Database.connect();
    
    // Start server
    server = app.listen(0);
    
    // Clear test data
    await Database.clear();
  });

  afterAll(async () => {
    // Clean up
    await Database.clear();
    await Database.disconnect();
    await server.close();
  });

  describe('User Authentication Flow', () => {
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          address: '0x1234567890abcdef',
          signature: 'test_signature',
          profile: {
            name: 'Test User',
            bio: 'Test bio'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      
      userToken = response.body.data.token;
    });

    test('should login existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: '0x1234567890abcdef',
          signature: 'test_signature'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('should get user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.address).toBe('0x1234567890abcdef');
    });
  });

  describe('AI Music Generation Flow', () => {
    test('should generate music with AI', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          prompt: 'Create a peaceful ambient track',
          genre: 'ambient',
          duration: 30,
          style: 'peaceful'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.taskId).toBeDefined();
    });

    test('should check generation status', async () => {
      // First generate music
      const generateResponse = await request(app)
        .post('/api/ai/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          prompt: 'Create a test track',
          genre: 'electronic',
          duration: 15
        });

      const taskId = generateResponse.body.data.taskId;

      // Check status
      const statusResponse = await request(app)
        .get(`/api/ai/status/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.success).toBe(true);
      expect(['pending', 'processing', 'completed', 'failed']).toContain(
        statusResponse.body.data.status
      );
    });
  });

  describe('NFT Creation and Management Flow', () => {
    test('should create NFT from generated music', async () => {
      const response = await request(app)
        .post('/api/nft/mint')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Music NFT',
          description: 'A test NFT created from AI-generated music',
          audioUrl: 'ipfs://test-audio-hash',
          coverImage: 'ipfs://test-image-hash',
          genre: 'electronic',
          price: '5.0',
          royalty: 10
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nft).toBeDefined();
      expect(response.body.data.nft.id).toBeDefined();
      
      nftId = response.body.data.nft.id;
    });

    test('should list user NFTs', async () => {
      const response = await request(app)
        .get('/api/nft/my-nfts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.nfts)).toBe(true);
      expect(response.body.data.nfts.length).toBeGreaterThan(0);
    });

    test('should get NFT details', async () => {
      const response = await request(app)
        .get(`/api/nft/${nftId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nft.id).toBe(nftId);
    });

    test('should update NFT metadata', async () => {
      const response = await request(app)
        .put(`/api/nft/${nftId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Test Music NFT',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nft.title).toBe('Updated Test Music NFT');
    });
  });

  describe('Marketplace Flow', () => {
    test('should list NFT for sale', async () => {
      const response = await request(app)
        .post('/api/nft/list-for-sale')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nftId: nftId,
          price: '10.0'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should browse marketplace NFTs', async () => {
      const response = await request(app)
        .get('/api/marketplace/nfts')
        .query({
          page: 1,
          limit: 10,
          genre: 'electronic'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.nfts)).toBe(true);
    });

    test('should search marketplace NFTs', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({
          q: 'test',
          genre: 'electronic'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.nfts)).toBe(true);
    });

    test('should remove NFT from sale', async () => {
      const response = await request(app)
        .post('/api/nft/remove-from-sale')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nftId: nftId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Playlist Management Flow', () => {
    test('should create playlist', async () => {
      const response = await request(app)
        .post('/api/playlists')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Playlist',
          description: 'A test playlist',
          isPublic: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.playlist).toBeDefined();
      
      playlistId = response.body.data.playlist.id;
    });

    test('should add NFT to playlist', async () => {
      const response = await request(app)
        .post(`/api/playlists/${playlistId}/add-nft`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nftId: nftId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should get playlist details', async () => {
      const response = await request(app)
        .get(`/api/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.playlist.id).toBe(playlistId);
      expect(response.body.data.playlist.nfts.length).toBeGreaterThan(0);
    });

    test('should remove NFT from playlist', async () => {
      const response = await request(app)
        .post(`/api/playlists/${playlistId}/remove-nft`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nftId: nftId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should delete playlist', async () => {
      const response = await request(app)
        .delete(`/api/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('File Upload Flow', () => {
    test('should upload audio file', async () => {
      const response = await request(app)
        .post('/api/upload/audio')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBeDefined();
    });

    test('should upload image file', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', Buffer.from('fake image data'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBeDefined();
    });
  });

  describe('Analytics Flow', () => {
    test('should track user activity', async () => {
      const response = await request(app)
        .post('/api/analytics/track')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          event: 'nft_view',
          data: {
            nftId: nftId,
            timestamp: Date.now()
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should get user analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/user')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          period: '7d'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid NFT ID', async () => {
      const response = await request(app)
        .get('/api/nft/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(20).fill().map(() =>
        request(app)
          .post('/api/ai/generate')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            prompt: 'test',
            genre: 'electronic'
          })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});