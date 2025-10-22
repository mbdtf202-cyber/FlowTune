/**
 * Logger Utils Tests
 */

import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../src/utils/logger.js';

// Mock fs module
jest.mock('fs/promises');

describe('Logger', () => {
  const mockLogDir = '/test/logs';

  beforeEach(() => {
    logger.logDir = mockLogDir;
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should have logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.logDir).toBe(mockLogDir);
    });
  });

  describe('log levels', () => {
    test('should log info message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      fs.appendFile.mockResolvedValue();

      await logger.info('Test info message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ Test info message'),
        expect.any(Object)
      );
      expect(fs.appendFile).toHaveBeenCalled();
    });

    test('should log error message', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      fs.appendFile.mockResolvedValue();

      await logger.error('Test error message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Test error message'),
        expect.stringContaining(''),
        expect.any(Object)
      );
      expect(fs.appendFile).toHaveBeenCalled();
    });

    test('should log warning message', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      fs.appendFile.mockResolvedValue();

      await logger.warn('Test warning message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Test warning message'),
        expect.any(Object)
      );
      expect(fs.appendFile).toHaveBeenCalled();
    });

    test('should log debug message in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      fs.appendFile.mockResolvedValue();

      await logger.debug('Test debug message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐛 Test debug message'),
        expect.any(Object)
      );
      expect(fs.appendFile).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('specialized logging methods', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
      fs.appendFile.mockResolvedValue();
    });

    test('should log AI generation', async () => {
      logger.aiGeneration('generate', { predictionId: 'test-id', model: 'musicgen', prompt: 'test' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('AI Generation: generate'),
        expect.objectContaining({
          component: 'ai-service',
          action: 'generate',
          predictionId: 'test-id'
        })
      );
    });

    test('should log IPFS operation', async () => {
      logger.ipfsOperation('upload', { hash: 'QmTest123', size: 1024 });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('IPFS Operation: upload'),
        expect.objectContaining({
          component: 'ipfs-service',
          action: 'upload',
          hash: 'QmTest123'
        })
      );
    });

    test('should log API request', async () => {
      logger.apiRequest('POST', '/api/test', { ip: '127.0.0.1' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('API Request: POST /api/test'),
        expect.objectContaining({ ip: '127.0.0.1' })
      );
    });

    test('should log Flow transaction', async () => {
      logger.flowTransaction('mint', { txId: 'tx123', address: '0x1234', tokenId: 1 });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Flow Transaction: mint'),
        expect.objectContaining({ txId: 'tx123', address: '0x1234', tokenId: 1 })
      );
    });

    test('should log file operation', async () => {
      logger.fileOperation('upload', { path: '/path/to/file', size: 1024 });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('File Operation: upload'),
        expect.objectContaining({ path: '/path/to/file', size: 1024 })
      );
    });
  });

  describe('middleware', () => {
    test('should create request logger middleware', () => {
      const middleware = logger.requestLogger();
      expect(typeof middleware).toBe('function');
    });

    test('should create error logger middleware', () => {
      const middleware = logger.errorLogger();
      expect(typeof middleware).toBe('function');
    });

    test('should log request with middleware', async () => {
      const middleware = logger.requestLogger();
      const req = {
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test' },
        get: jest.fn((header) => {
          if (header === 'User-Agent') return 'test';
          if (header === 'Content-Type') return 'application/json';
          return null;
        })
      };
      const res = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 0);
          }
        })
      };
      const next = jest.fn();

      jest.spyOn(console, 'log').mockImplementation();
      fs.appendFile.mockResolvedValue();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    test('should log error with middleware', async () => {
      const middleware = logger.errorLogger();
      const error = new Error('Test error');
      const req = {
        method: 'POST',
        url: '/api/test',
        ip: '127.0.0.1',
        body: { test: 'data' },
        get: jest.fn((header) => {
          if (header === 'User-Agent') return 'test';
          return null;
        })
      };
      const res = {};
      const next = jest.fn();

      jest.spyOn(console, 'error').mockImplementation();
      fs.appendFile.mockResolvedValue();

      middleware(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ API Error'),
        expect.any(Error),
        expect.objectContaining({
          component: 'api',
          method: 'POST',
          url: '/api/test'
        })
      );
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('file operations', () => {
    test('should ensure log directory exists', async () => {
      fs.mkdir.mockResolvedValue();
      fs.access.mockRejectedValue(new Error('Directory not found'));

      await logger.ensureLogDir();

      expect(fs.mkdir).toHaveBeenCalledWith(mockLogDir, { recursive: true });
    });

    test('should handle directory creation gracefully', async () => {
      fs.mkdir.mockResolvedValue();

      await logger.ensureLogDir();

      expect(fs.mkdir).toHaveBeenCalledWith(mockLogDir, { recursive: true });
    });

    test('should clean old logs', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago (older than default 30 days)

      const mockFiles = [
        'app-2023-01-01.log',
        'app-2023-12-31.log',
        'not-a-log.txt'
      ];

      fs.readdir.mockResolvedValue(mockFiles);
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('2023-01-01')) {
          return Promise.resolve({ mtime: oldDate });
        }
        return Promise.resolve({ mtime: new Date() });
      });
      fs.unlink.mockResolvedValue();

      await logger.cleanOldLogs();

      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(mockLogDir, 'app-2023-01-01.log')
      );
      expect(fs.unlink).toHaveBeenCalledTimes(1);
    });

    test('should handle file write errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      fs.appendFile.mockRejectedValue(new Error('Write failed'));

      await logger.info('Test message');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to write to log file:',
        expect.any(Error)
      );
    });
  });

  describe('log formatting', () => {
    test('should format message correctly', () => {
      const level = 'INFO';
      const message = 'Test message';
      const metadata = { key: 'value' };

      const result = logger.formatMessage(level, message, metadata);
      const parsed = JSON.parse(result);

      expect(parsed.level).toBe(level);
      expect(parsed.message).toBe(message);
      expect(parsed.key).toBe('value');
      expect(parsed.timestamp).toBeDefined();
    });

    test('should handle metadata formatting', () => {
      const metadata = {
        nested: { object: 'value' },
        array: [1, 2, 3],
        string: 'test'
      };

      const result = logger.formatMessage('INFO', 'test', metadata);
      const parsed = JSON.parse(result);

      expect(parsed.nested).toEqual({ object: 'value' });
      expect(parsed.array).toEqual([1, 2, 3]);
      expect(parsed.string).toBe('test');
    });
  });
});