/**
 * Music Controller Tests
 */

// Mock the services before importing the controller
jest.mock('../../src/services/aiService.js', () => {
  const mockMethods = {
    generateMusicWithMusicGen: jest.fn(),
    generateMusicDescription: jest.fn(),
    generateCoverArt: jest.fn(),
    analyzeAudio: jest.fn(),
    validateGenerationParams: jest.fn()
  };
  return {
    default: mockMethods,
    ...mockMethods
  };
});

jest.mock('../../src/services/ipfsService.js', () => {
  const mockMethods = {
    uploadAudio: jest.fn(),
    uploadImage: jest.fn(),
    uploadJSON: jest.fn(),
    uploadAudioFromUrl: jest.fn(),
    createNFTMetadata: jest.fn(),
    getFileInfo: jest.fn(),
    validateHash: jest.fn()
  };
  return {
    default: mockMethods,
    ...mockMethods
  };
});

// Import the controller after mocking
import musicController from '../../src/controllers/musicController.js';
import aiService from '../../src/services/aiService.js';
import ipfsService from '../../src/services/ipfsService.js';

// Get references to the mocked functions
const mockAIService = aiService.default;
const mockIPFSService = ipfsService.default;

describe('MusicController', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  const mockGenerationData = {
    prompt: 'Create an upbeat electronic track',
    title: 'Test Song',
    artist: 'Test Artist',
    genre: 'electronic',
    mood: 'upbeat',
    duration: 30,
    royalties: []
  };

  const mockUploadData = {
    title: 'Test Song',
    artist: 'Test Artist',
    genre: 'electronic',
    description: 'A test song',
    audioBuffer: Buffer.from('audio'),
    coverImageBuffer: Buffer.from('image'),
    royalties: []
  };

  describe('generateAndPrepareMusic', () => {
    test('should generate music and prepare metadata successfully', async () => {
      // Set environment variable to force using AI service instead of mock
      const originalSunoKey = process.env.SUNO_API_KEY;
      process.env.SUNO_API_KEY = 'test_api_key';

      console.log('Test data:', mockGenerationData);
      const mockReq = { body: mockGenerationData };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      console.log('About to call generateAndPrepareMusic...');

      // Setup mocks
      mockAIService.generateMusicWithMusicGen.mockResolvedValue({
        success: true,
        audioUrl: 'https://example.com/audio.mp3',
        duration: 30,
        metadata: {
          model: 'musicgen',
          predictionId: 'test-prediction-id'
        }
      });

      mockAIService.generateMusicDescription.mockResolvedValue(
        'An upbeat electronic track'
      );

      mockAIService.generateCoverArt.mockResolvedValue({
        imageUrl: 'https://example.com/cover.jpg'
      });

      mockIPFSService.uploadAudioFromUrl.mockResolvedValue({
        hash: 'QmAudioHash123',
        size: 1024000,
        url: 'https://ipfs.io/ipfs/QmAudioHash123'
      });

      mockIPFSService.uploadImage.mockResolvedValue({
        hash: 'QmImageHash456',
        size: 512000,
        url: 'https://ipfs.io/ipfs/QmImageHash456'
      });

      mockIPFSService.createNFTMetadata.mockResolvedValue({
        metadataHash: 'QmMetadataHash789',
        metadataUrl: 'https://ipfs.io/ipfs/QmMetadataHash789',
        metadata: {
          title: 'Test Song',
          artist: 'Test Artist',
          description: 'An upbeat electronic track'
        }
      });

      await musicController.generateAndPrepareMusic(mockReq, mockRes);

      expect(mockAIService.generateMusicWithMusicGen).toHaveBeenCalledWith(
        mockGenerationData.prompt, 
        30
      );

      // Restore original environment variable
      process.env.SUNO_API_KEY = originalSunoKey;
    });

    test('should handle AI generation failure', async () => {
      // Set environment variable to force using AI service instead of mock
      const originalSunoKey = process.env.SUNO_API_KEY;
      process.env.SUNO_API_KEY = 'test_api_key';

      const mockReq = { body: mockGenerationData };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockAIService.generateMusicWithMusicGen.mockResolvedValue({
        success: false,
        error: 'Generation failed'
      });

      await musicController.generateAndPrepareMusic(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true
        })
      );

      // Restore original environment variable
      process.env.SUNO_API_KEY = originalSunoKey;
    });

    test('should handle missing prompt', async () => {
      const mockReq = { body: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await musicController.generateAndPrepareMusic(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          message: 'Prompt must be at least 3 characters long'
        })
      );
    });
  });

  describe('uploadAndPrepareMusic', () => {
    test('should upload music successfully', async () => {
      const mockReq = { body: mockUploadData };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockIPFSService.uploadAudio.mockResolvedValue({
        hash: 'QmAudioHash123',
        url: 'https://ipfs.io/ipfs/QmAudioHash123',
        size: 1024000
      });

      mockIPFSService.uploadImage.mockResolvedValue({
        hash: 'QmImageHash456',
        url: 'https://ipfs.io/ipfs/QmImageHash456',
        size: 512000
      });

      mockIPFSService.createNFTMetadata.mockResolvedValue({
        metadataHash: 'QmMetadataHash789',
        metadataUrl: 'https://ipfs.io/ipfs/QmMetadataHash789',
        metadata: {
          title: 'Test Song',
          artist: 'Test Artist',
          description: 'A test song'
        }
      });

      await musicController.uploadAndPrepareMusic(mockReq, mockRes);

      expect(mockIPFSService.uploadAudio).toHaveBeenCalled();
      expect(mockIPFSService.uploadImage).toHaveBeenCalled();
      expect(mockIPFSService.createNFTMetadata).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Music uploaded and prepared for minting'
        })
      );
    });

    test('should handle missing required fields', async () => {
      const mockReq = { body: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await musicController.uploadAndPrepareMusic(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true
        })
      );
    });
  });

  describe('getMusicMetadata', () => {
    test('should retrieve metadata successfully', async () => {
      const mockReq = { params: { hash: 'QmTestHash' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockIPFSService.getFileInfo.mockResolvedValue({
        success: true,
        info: {
          title: 'Test Song',
          artist: 'Test Artist',
          genre: 'electronic'
        }
      });

      await musicController.getMusicMetadata(mockReq, mockRes);

      expect(mockIPFSService.getFileInfo).toHaveBeenCalledWith('QmTestHash');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: expect.any(Object),
          message: 'Metadata retrieved successfully'
        })
      );
    });

    test('should handle missing hash', async () => {
      const mockReq = { params: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await musicController.getMusicMetadata(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle IPFS service failure', async () => {
      const mockReq = { params: { hash: 'QmTestHash' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockIPFSService.getFileInfo.mockRejectedValue(new Error('IPFS error'));

      await musicController.getMusicMetadata(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateMusicData', () => {
    test('should validate music data successfully', async () => {
      const mockReq = {
        body: {
          metadataHash: 'QmMetadata123',
          audioHash: 'QmAudio456',
          coverImageHash: 'QmCover789'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockIPFSService.getFileInfo
        .mockResolvedValueOnce({ 
          success: true, 
          info: { title: 'Test Song' } 
        })
        .mockResolvedValueOnce({ 
          success: true, 
          info: { size: 1024000 } 
        })
        .mockResolvedValueOnce({ 
          success: true, 
          info: { size: 512000 } 
        });

      await musicController.validateMusicData(mockReq, mockRes);

      expect(mockIPFSService.getFileInfo).toHaveBeenCalledTimes(3);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          validation: expect.any(Object),
          message: 'Music data validation completed'
        })
      );
    });

    test('should handle missing required fields', async () => {
      const mockReq = { body: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await musicController.validateMusicData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle IPFS service failure', async () => {
      const mockReq = {
        body: {
          metadataHash: 'QmMetadata123',
          audioHash: 'QmAudio456',
          coverImageHash: 'QmCover789'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockIPFSService.getFileInfo.mockRejectedValue(new Error('IPFS error'));

      await musicController.validateMusicData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});