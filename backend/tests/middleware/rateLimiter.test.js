/**
 * Rate Limiter Middleware Tests
 */

import { jest } from '@jest/globals';
import { rateLimiter, aiRateLimiter } from '../../src/middleware/rateLimiter.js';

describe('Rate Limiter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Use a unique IP for each test to avoid state interference
    req = {
      ip: `127.0.0.${Math.floor(Math.random() * 255)}`,
      connection: { remoteAddress: `127.0.0.${Math.floor(Math.random() * 255)}` }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('rateLimiter', () => {
    test('should allow requests within limit', () => {
      rateLimiter(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': 100,
          'X-RateLimit-Remaining': 99
        })
      );
    });

    test('should block requests when limit exceeded', () => {
      // Clear previous mocks
      jest.clearAllMocks();
      
      // Simulate many requests to exceed limit
      for (let i = 0; i < 100; i++) {
        rateLimiter(req, res, next);
      }
      
      // Clear mocks before the final request that should be blocked
      jest.clearAllMocks();
      
      // This request should be blocked
      rateLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          message: 'Too many requests. Please try again later.',
          retryAfter: expect.any(Number)
        })
      );
    });

    test('should set rate limit headers', () => {
      // Create fresh mocks for this test
      const freshRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis()
      };
      const freshNext = jest.fn();
      
      rateLimiter(req, freshRes, freshNext);

      expect(freshRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': 100,
          'X-RateLimit-Remaining': expect.any(Number),
          'X-RateLimit-Reset': expect.any(String)
        })
      );
    });

    test('should handle different IP addresses separately', () => {
      // Create fresh mocks for this test
      const freshRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis()
      };
      const freshNext = jest.fn();
      
      const req2 = { ...req, ip: '192.168.1.1' };

      rateLimiter(req, freshRes, freshNext);
      rateLimiter(req2, freshRes, freshNext);

      expect(freshNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('aiRateLimiter', () => {
    test('should allow requests within AI limit', () => {
      aiRateLimiter(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-AI-RateLimit-Limit': 100,
          'X-AI-RateLimit-Remaining': 99
        })
      );
    });

    test('should block AI requests when limit exceeded', () => {
      // Clear previous mocks
      jest.clearAllMocks();
      
      // Simulate many AI requests to exceed limit
      for (let i = 0; i < 100; i++) {
        aiRateLimiter(req, res, next);
      }
      
      // Clear mocks before the final request that should be blocked
      jest.clearAllMocks();
      
      // This request should be blocked
      aiRateLimiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          message: 'AI generation limit exceeded. Please try again in an hour.'
        })
      );
    });

    test('should have stricter limits than regular rate limiter', () => {
      // Create fresh mocks for this test
      const freshRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis()
      };
      const freshNext = jest.fn();
      
      aiRateLimiter(req, freshRes, freshNext);

      expect(freshRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-AI-RateLimit-Limit': 100
        })
      );
    });
  });

  describe('error handling', () => {
    test('should handle missing IP address', () => {
      const reqWithoutIP = { connection: {} };
      
      rateLimiter(reqWithoutIP, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('should include retry information in error response', () => {
      // Clear previous mocks
      jest.clearAllMocks();
      
      // Exceed the limit
      for (let i = 0; i < 100; i++) {
        rateLimiter(req, res, next);
      }
      
      // Clear mocks before the final request that should be blocked
      jest.clearAllMocks();
      
      // This request should be blocked and include retry info
      rateLimiter(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: expect.any(Number)
        })
      );
    });
  });
});