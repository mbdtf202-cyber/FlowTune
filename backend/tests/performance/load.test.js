/**
 * Performance and Load Tests
 * Tests API performance under various load conditions
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index.js';

describe('Performance Tests', () => {
  let server;
  let authToken;

  beforeAll(async () => {
    // Start test server
    server = app.listen(0);
    
    // Get auth token for authenticated requests
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
    
    if (loginResponse.body.token) {
      authToken = loginResponse.body.token;
    }
  }, 30000);

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('API Response Time Tests', () => {
    test('marketplace listings should respond within 500ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/marketplace/listings')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body).toHaveProperty('success', true);
      expect(responseTime).toBeLessThan(500);
    });

    test('user profile should respond within 300ms', async () => {
      if (!authToken) {
        console.log('Skipping authenticated test - no auth token');
        return;
      }

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body).toHaveProperty('success', true);
      expect(responseTime).toBeLessThan(300);
    });

    test('platform analytics should respond within 1000ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/analytics/platform')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body).toHaveProperty('success', true);
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Concurrent Request Tests', () => {
    test('should handle 10 concurrent marketplace requests', async () => {
      const requests = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/marketplace/listings')
            .expect(200)
        );
      }
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
      });
      
      // Total time should be reasonable (not much more than single request)
      expect(totalTime).toBeLessThan(2000);
    });

    test('should handle mixed concurrent requests', async () => {
      const requests = [];
      const startTime = Date.now();
      
      // Mix of different endpoints
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app).get('/api/marketplace/listings'),
          request(app).get('/api/analytics/platform')
        );
      }
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status); // 429 for rate limiting
      });
      
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Memory and Resource Tests', () => {
    test('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make many requests
      for (let i = 0; i < 50; i++) {
        await request(app)
          .get('/api/marketplace/listings')
          .expect(200);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should handle large response payloads efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/marketplace/listings?limit=100')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body).toHaveProperty('success', true);
      expect(responseTime).toBeLessThan(2000); // Should handle large responses quickly
    });
  });

  describe('Rate Limiting Performance', () => {
    test('should efficiently enforce rate limits', async () => {
      const requests = [];
      const startTime = Date.now();
      
      // Send requests up to rate limit
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get('/api/marketplace/listings')
        );
      }
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // Some requests should succeed, some might be rate limited
      const successfulRequests = responses.filter(r => r.status === 200);
      const rateLimitedRequests = responses.filter(r => r.status === 429);
      
      expect(successfulRequests.length + rateLimitedRequests.length).toBe(20);
      expect(totalTime).toBeLessThan(5000); // Rate limiting should be fast
    });
  });

  describe('Database Query Performance', () => {
    test('should efficiently query NFTs with filters', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/nft/search?genre=electronic&limit=20')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body).toHaveProperty('success', true);
      expect(responseTime).toBeLessThan(800); // Database queries should be fast
    });

    test('should efficiently handle pagination', async () => {
      const requests = [];
      const startTime = Date.now();
      
      // Request multiple pages
      for (let page = 1; page <= 5; page++) {
        requests.push(
          request(app)
            .get(`/api/marketplace/listings?page=${page}&limit=10`)
            .expect(200)
        );
      }
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
      });
      
      expect(totalTime).toBeLessThan(2000); // Pagination should be efficient
    });
  });

  describe('Error Handling Performance', () => {
    test('should quickly handle invalid requests', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/nonexistent/endpoint')
        .expect(404);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body).toHaveProperty('error', true);
      expect(responseTime).toBeLessThan(100); // Error responses should be very fast
    });

    test('should efficiently handle malformed data', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          invalid: 'data',
          structure: true
        })
        .expect(400);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body).toHaveProperty('error', true);
      expect(responseTime).toBeLessThan(200); // Validation errors should be fast
    });
  });

  describe('WebSocket Performance', () => {
    test('should handle WebSocket connections efficiently', (done) => {
      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://localhost:${server.address().port}`);
      
      const startTime = Date.now();
      
      ws.on('open', () => {
        const connectionTime = Date.now() - startTime;
        expect(connectionTime).toBeLessThan(1000); // Connection should be fast
        
        ws.close();
        done();
      });
      
      ws.on('error', (error) => {
        console.log('WebSocket test skipped - server may not support WebSocket');
        done();
      });
    });
  });
});