/**
 * Validation Utils Tests
 */

import { jest } from '@jest/globals';
import {
  validateMusicGeneration,
  validateMusicUpload,
  validateIPFSHash,
  validateFlowAddress,
  validateFileUpload,
  sanitizeString,
  validatePagination,
  validateSearch
} from '../../src/utils/validation.js';

describe('Validation Utils', () => {
  describe('validateMusicGeneration', () => {
    test('should validate correct music generation data', () => {
      const data = {
        prompt: 'electronic music with synthesizers',
        duration: 30,
        genre: 'electronic',
        mood: 'upbeat',
        title: 'Test Song',
        artist: 'Test Artist',
        royalties: [
          { recipient: '0x1234567890123456', percentage: 10 }
        ]
      };

      const result = validateMusicGeneration(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid prompt', () => {
      const data = { prompt: 'ab' }; // too short

      const result = validateMusicGeneration(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Prompt must be at least 3 characters long');
    });

    test('should reject invalid duration', () => {
      const data = {
        prompt: 'electronic music',
        duration: 200 // too long
      };

      const result = validateMusicGeneration(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duration must be between 5 and 120 seconds');
    });

    test('should reject invalid genre', () => {
      const data = {
        prompt: 'electronic music',
        genre: 'invalid-genre'
      };

      const result = validateMusicGeneration(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Genre must be one of:');
    });

    test('should reject invalid royalties', () => {
      const data = {
        prompt: 'electronic music',
        royalties: [
          { recipient: '0x1234567890123456', percentage: 150 } // too high
        ]
      };

      const result = validateMusicGeneration(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Royalty 1: percentage must be between 0 and 100');
    });

    test('should reject royalties exceeding 100%', () => {
      const data = {
        prompt: 'electronic music',
        royalties: [
          { recipient: '0x1234567890123456', percentage: 60 },
          { recipient: '0x6789012345678901', percentage: 50 }
        ]
      };

      const result = validateMusicGeneration(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total royalty percentage cannot exceed 100%');
    });
  });

  describe('validateMusicUpload', () => {
    test('should validate correct upload data', () => {
      const data = {
        title: 'Test Song',
        artist: 'Test Artist',
        audioBuffer: 'base64-audio-data',
        description: 'A test song',
        genre: 'electronic'
      };

      const result = validateMusicUpload(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject missing required fields', () => {
      const data = {
        audioBuffer: 'base64-audio-data'
        // missing title and artist
      };

      const result = validateMusicUpload(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a string');
      expect(result.errors).toContain('Artist is required and must be a string');
    });

    test('should reject missing audio buffer', () => {
      const data = {
        title: 'Test Song',
        artist: 'Test Artist'
        // missing audioBuffer
      };

      const result = validateMusicUpload(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Audio buffer is required');
    });
  });

  describe('validateIPFSHash', () => {
    test('should validate correct IPFS hash', () => {
      const hash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      
      const result = validateIPFSHash(hash);
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid IPFS hash format', () => {
      const hash = 'invalid-hash';
      
      const result = validateIPFSHash(hash);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid IPFS hash format');
    });

    test('should reject empty hash', () => {
      const result = validateIPFSHash('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Hash is required and must be a string');
    });
  });

  describe('validateFlowAddress', () => {
    test('should validate correct Flow address', () => {
      const address = '0x1234567890123456';
      
      const result = validateFlowAddress(address);
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid Flow address format', () => {
      const address = '0x123'; // too short
      
      const result = validateFlowAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid Flow address format');
    });

    test('should reject address without 0x prefix', () => {
      const address = '1234567890123456';
      
      const result = validateFlowAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid Flow address format');
    });
  });

  describe('validateFileUpload', () => {
    test('should validate correct file upload', () => {
      const file = {
        mimetype: 'audio/mpeg',
        size: 1024 * 1024, // 1MB
        originalname: 'test-song.mp3'
      };
      const allowedTypes = ['audio/mpeg', 'audio/wav'];
      
      const result = validateFileUpload(file, allowedTypes);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject disallowed file type', () => {
      const file = {
        mimetype: 'video/mp4',
        size: 1024 * 1024,
        originalname: 'test-video.mp4'
      };
      const allowedTypes = ['audio/mpeg', 'audio/wav'];
      
      const result = validateFileUpload(file, allowedTypes);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('File type video/mp4 not allowed');
    });

    test('should reject oversized file', () => {
      const file = {
        mimetype: 'audio/mpeg',
        size: 100 * 1024 * 1024, // 100MB
        originalname: 'large-song.mp3'
      };
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      const result = validateFileUpload(file, [], maxSize);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum');
    });
  });

  describe('sanitizeString', () => {
    test('should sanitize string correctly', () => {
      const input = '  <script>alert("xss")</script>Test String  ';
      const expected = 'scriptalert("xss")/scriptTest String';
      
      const result = sanitizeString(input);
      expect(result).toBe(expected);
    });

    test('should handle non-string input', () => {
      const result = sanitizeString(123);
      expect(result).toBe('');
    });

    test('should truncate long strings', () => {
      const longString = 'a'.repeat(2000);
      const result = sanitizeString(longString, 100);
      expect(result.length).toBe(100);
    });
  });

  describe('validatePagination', () => {
    test('should validate correct pagination', () => {
      const result = validatePagination('2', '20');
      expect(result.isValid).toBe(true);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    test('should use defaults for invalid values', () => {
      const result = validatePagination('invalid', 'invalid');
      expect(result.isValid).toBe(true);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    test('should reject invalid page number', () => {
      const result = validatePagination('0', '10');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Page must be greater than 0');
    });

    test('should reject invalid limit', () => {
      const result = validatePagination('1', '200');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Limit must be between 1 and 100');
    });
  });

  describe('validateSearch', () => {
    test('should validate correct search parameters', () => {
      const query = 'electronic music';
      const filters = {
        genre: 'electronic',
        artist: 'Test Artist',
        minDuration: '30',
        maxDuration: '180'
      };
      
      const result = validateSearch(query, filters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject short query', () => {
      const result = validateSearch('a');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Search query must be at least 2 characters long');
    });

    test('should reject invalid duration filters', () => {
      const filters = {
        minDuration: 'invalid',
        maxDuration: '-10'
      };
      
      const result = validateSearch('test', filters);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum duration must be a positive number');
      expect(result.errors).toContain('Maximum duration must be a positive number');
    });
  });
});