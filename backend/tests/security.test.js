/**
 * API安全测试套件
 * 测试各种安全措施的有效性
 */

import request from 'supertest';
import { expect } from 'chai';
import app from '../src/index.js';

describe('API Security Tests', () => {
  
  describe('Rate Limiting', () => {
    it('should enforce general rate limits', async function() {
      this.timeout(10000);
      
      const requests = [];
      // 发送超过限制的请求
      for (let i = 0; i < 105; i++) {
        requests.push(request(app).get('/api/health'));
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).to.be.greaterThan(0);
    });

    it('should enforce auth rate limits', async function() {
      this.timeout(10000);
      
      const requests = [];
      // 发送超过认证限制的请求
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({ identifier: 'test', password: 'test' })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).to.be.greaterThan(0);
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize malicious script tags', async () => {
      const maliciousPayload = {
        title: '<script>alert("xss")</script>Music Title',
        description: '<img src=x onerror=alert("xss")>Description'
      };

      const response = await request(app)
        .post('/api/nft/mint')
        .send(maliciousPayload);

      // 应该返回验证错误或清理后的数据
      expect(response.status).to.not.equal(200);
    });

    it('should sanitize query parameters', async () => {
      const response = await request(app)
        .get('/api/nft/marketplace?search=<script>alert("xss")</script>');

      expect(response.status).to.not.equal(500);
    });
  });

  describe('Input Validation', () => {
    it('should validate Flow addresses', async () => {
      const invalidAddress = 'invalid_address';
      
      const response = await request(app)
        .get(`/api/nft/user/${invalidAddress}`);

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
    });

    it('should validate email formats', async () => {
      const invalidEmail = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'ValidPass123',
        flowAddress: '0x1234567890123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmail);

      expect(response.status).to.equal(400);
    });

    it('should validate password strength', async () => {
      const weakPassword = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
        flowAddress: '0x1234567890123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPassword);

      expect(response.status).to.equal(400);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in search queries', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .get(`/api/nft/marketplace?search=${encodeURIComponent(sqlInjection)}`);

      // 应该正常处理，不会导致服务器错误
      expect(response.status).to.not.equal(500);
    });
  });

  describe('File Upload Security', () => {
    it('should reject files that are too large', async () => {
      // 创建一个模拟的大文件
      const largeBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB
      
      const response = await request(app)
        .post('/api/upload/audio')
        .attach('audio', largeBuffer, 'large-file.mp3');

      expect(response.status).to.equal(413); // Payload Too Large
    });

    it('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/api/upload/audio')
        .attach('audio', Buffer.from('fake content'), 'malicious.exe');

      expect(response.status).to.not.equal(200);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers).to.have.property('x-content-type-options');
      expect(response.headers).to.have.property('x-frame-options');
      expect(response.headers).to.have.property('x-xss-protection');
      expect(response.headers['x-powered-by']).to.be.undefined;
    });

    it('should include CSP headers', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers).to.have.property('content-security-policy');
    });
  });

  describe('Authentication Security', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).to.equal(401);
    });

    it('should validate JWT tokens', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).to.equal(401);
    });
  });

  describe('CORS Security', () => {
    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).to.exist;
    });

    it('should reject unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com');

      // 应该不包含CORS头部或拒绝请求
      expect(response.headers['access-control-allow-origin']).to.not.equal('http://malicious-site.com');
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive error information', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint');

      expect(response.status).to.equal(404);
      expect(response.body).to.not.have.property('stack');
    });
  });

  describe('Request Size Limits', () => {
    it('should enforce request body size limits', async () => {
      const largePayload = {
        data: 'x'.repeat(60 * 1024 * 1024) // 60MB string
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(largePayload);

      expect(response.status).to.equal(413); // Payload Too Large
    });
  });

  describe('Security Monitoring', () => {
    it('should log security events', async () => {
      // 触发一个安全事件
      await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'nonexistent', password: 'wrong' });

      // 这里可以检查日志文件或监控系统
      // 实际实现中需要访问日志系统来验证
    });
  });
});

describe('Blockchain Security Tests', () => {
  describe('Flow Address Validation', () => {
    it('should validate Flow address format', async () => {
      const invalidAddresses = [
        '0x123', // 太短
        '0xGHIJKLMNOPQRSTUV', // 包含无效字符
        'not_an_address', // 不是十六进制
        '1234567890123456' // 缺少0x前缀
      ];

      for (const address of invalidAddresses) {
        const response = await request(app)
          .get(`/api/nft/user/${address}`);

        expect(response.status).to.equal(400);
      }
    });
  });

  describe('NFT Security', () => {
    it('should validate NFT minting parameters', async () => {
      const invalidMintData = {
        title: '', // 空标题
        audioHash: 'invalid_hash',
        royalties: [{ percentage: 101 }] // 超过100%的版税
      };

      const response = await request(app)
        .post('/api/nft/mint')
        .send(invalidMintData);

      expect(response.status).to.equal(400);
    });
  });
});

describe('Performance Security Tests', () => {
  describe('DoS Protection', () => {
    it('should handle concurrent requests gracefully', async function() {
      this.timeout(15000);
      
      const concurrentRequests = [];
      for (let i = 0; i < 50; i++) {
        concurrentRequests.push(request(app).get('/api/health'));
      }

      const responses = await Promise.all(concurrentRequests);
      const successfulResponses = responses.filter(res => res.status === 200);
      
      // 大部分请求应该成功，但可能有一些被限流
      expect(successfulResponses.length).to.be.greaterThan(30);
    });
  });
});