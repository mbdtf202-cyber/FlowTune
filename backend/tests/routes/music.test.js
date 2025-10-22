/**
 * Music Routes Tests
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock IPFS service first
jest.mock('../../src/services/ipfsService.js', () => ({
  default: {
    uploadToIPFS: jest.fn(),
    getFromIPFS: jest.fn(),
    pinToIPFS: jest.fn()
  }
}));

// Mock rate limiter
jest.mock('../../src/middleware/rateLimiter.js', () => ({
  aiRateLimiter: (req, res, next) => next()
}));

// Mock music controller
jest.mock('../../src/controllers/musicController.js');

// Import after mocking
import musicRoutes from '../../src/routes/music.js';
import musicController from '../../src/controllers/musicController.js';

describe('Music Routes', () => {
  let app;

  beforeEach(() => {
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/music', musicRoutes);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/music/generate', () => {
    test('should generate music successfully', async () => {
      const mockResponse = {
        success: true,
        music: {
          title: 'Test Song',
          artist: 'Test Artist',
          description: 'A test song for unit testing',
          genre: 'electronic',
          duration: 30,
          prompt: 'electronic music with synthesizers'
        },
        ipfs: {
          success: true,
          hash: 'QmTestHash123456789',
          url: 'https://ipfs.io/ipfs/QmTestHash123456789',
          size: 1024
        },
        message: 'Music generated successfully'
      };

      musicController.generateAndPrepareMusic.mockImplementation((req, res) => {
        res.json(mockResponse);
      });

      const response = await request(app)
        .post('/api/music/generate')
        .send({
          prompt: 'electronic music with synthesizers',
          title: 'Test Song',
          artist: 'Test Artist',
          genre: 'electronic',
          duration: 30
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.music).toBeDefined();
      expect(musicController.generateAndPrepareMusic).toHaveBeenCalledTimes(1);
    });

    test('should handle generation errors', async () => {
      musicController.generateAndPrepareMusic.mockImplementation((req, res) => {
        res.status(500).json({
          error: true,
          message: 'Music generation failed'
        });
      });

      const response = await request(app)
        .post('/api/music/generate')
        .send({
          prompt: 'electronic music'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(true);
    });

    test('should validate required fields', async () => {
      musicController.generateAndPrepareMusic.mockImplementation((req, res) => {
        res.status(400).json({
          error: true,
          message: 'Prompt is required'
        });
      });

      const response = await request(app)
        .post('/api/music/generate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
    });
  });

  describe('POST /api/music/upload', () => {
    test('should upload music successfully', async () => {
      const mockResponse = {
        success: true,
        music: {
          title: 'Test Song',
          artist: 'Test Artist',
          description: 'A test song for unit testing',
          genre: 'electronic',
          duration: 30,
          prompt: 'electronic music with synthesizers'
        },
        ipfs: {
          success: true,
          hash: 'QmTestHash123456789',
          url: 'https://ipfs.io/ipfs/QmTestHash123456789',
          size: 1024
        },
        message: 'Music uploaded successfully'
      };

      musicController.uploadAndPrepareMusic.mockImplementation((req, res) => {
        res.json(mockResponse);
      });

      const response = await request(app)
        .post('/api/music/upload')
        .attach('audio', Buffer.from('fake-audio-data'), 'test.mp3')
        .field('title', 'Test Song')
        .field('artist', 'Test Artist');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(musicController.uploadAndPrepareMusic).toHaveBeenCalledTimes(1);
    });

    test('should handle upload errors', async () => {
      musicController.uploadAndPrepareMusic.mockImplementation((req, res) => {
        res.status(400).json({
          error: true,
          message: 'Invalid file format'
        });
      });

      const response = await request(app)
        .post('/api/music/upload')
        .attach('audio', Buffer.from('fake-data'), 'test.txt');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
    });
  });

  describe('GET /api/music/metadata/:hash', () => {
    test('should get music metadata successfully', async () => {
      const mockMetadata = {
        title: 'Test Song',
        artist: 'Test Artist',
        genre: 'electronic',
        duration: 30
      };

      musicController.getMusicMetadata.mockImplementation((req, res) => {
        res.json({
          success: true,
          metadata: mockMetadata
        });
      });

      const response = await request(app)
        .get('/api/music/metadata/QmTestHash123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(musicController.getMusicMetadata).toHaveBeenCalledTimes(1);
    });

    test('should handle metadata errors', async () => {
      musicController.getMusicMetadata.mockImplementation((req, res) => {
        res.status(404).json({
          error: true,
          message: 'Metadata not found'
        });
      });

      const response = await request(app)
        .get('/api/music/metadata/invalid-hash');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe(true);
    });
  });

  describe('POST /api/music/validate', () => {
    test('should validate music data successfully', async () => {
      musicController.validateMusicData.mockImplementation((req, res) => {
        res.json({
          success: true,
          valid: true,
          message: 'Music data is valid'
        });
      });

      const response = await request(app)
        .post('/api/music/validate')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          genre: 'electronic'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(musicController.validateMusicData).toHaveBeenCalledTimes(1);
    });

    test('should handle validation errors', async () => {
      musicController.validateMusicData.mockImplementation((req, res) => {
        res.status(400).json({
          error: true,
          message: 'Invalid music data'
        });
      });

      const response = await request(app)
        .post('/api/music/validate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
    });
  });
});