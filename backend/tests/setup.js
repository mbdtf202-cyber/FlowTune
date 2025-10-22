/**
 * Test Setup
 * Global test configuration and utilities
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.OPENAI_API_KEY = 'test_openai_key';
process.env.REPLICATE_API_TOKEN = 'test_replicate_token';
process.env.PINATA_API_KEY = 'test_pinata_key';
process.env.PINATA_SECRET_API_KEY = 'test_pinata_secret';
process.env.PINATA_JWT = 'test_pinata_jwt';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Mock AI service responses
  mockAIResponse: {
    success: true,
    audioUrl: 'https://example.com/test-audio.mp3',
    metadata: {
      predictionId: 'test-prediction-id',
      model: 'musicgen-large'
    }
  },

  // Mock IPFS responses
  mockIPFSResponse: {
    success: true,
    hash: 'QmTestHash123456789',
    url: 'https://ipfs.io/ipfs/QmTestHash123456789',
    size: 1024
  },

  // Mock music metadata
  mockMusicMetadata: {
    title: 'Test Song',
    artist: 'Test Artist',
    description: 'A test song for unit testing',
    genre: 'electronic',
    duration: 30,
    prompt: 'electronic music with synthesizers'
  },

  // Generate test audio buffer
  generateTestAudioBuffer: () => {
    return Buffer.from('fake-audio-data');
  },

  // Generate test image buffer
  generateTestImageBuffer: () => {
    return Buffer.from('fake-image-data');
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});