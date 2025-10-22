/**
 * Error Handler Middleware Tests
 */

import { jest } from '@jest/globals';
import { errorHandler } from '../../src/middleware/errorHandler.js';

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      url: '/api/test',
      ip: '127.0.0.1'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should handle file upload limit error', () => {
    const error = new Error('File too large');
    error.code = 'LIMIT_FILE_SIZE';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size',
      code: 'FILE_TOO_LARGE'
    });
  });

  test('should handle file count limit error', () => {
    const error = new Error('Too many files');
    error.code = 'LIMIT_FILE_COUNT';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Too many files',
      message: 'Too many files uploaded at once',
      code: 'TOO_MANY_FILES'
    });
  });

  test('should handle unexpected field error', () => {
    const error = new Error('Unexpected field');
    error.code = 'LIMIT_UNEXPECTED_FILE';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unexpected field',
      message: 'Unexpected file field in upload',
      code: 'UNEXPECTED_FIELD'
    });
  });

  test('should handle IPFS upload error', () => {
    const error = new Error('IPFS upload failed');
    error.type = 'IPFS_ERROR';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: 'IPFS upload failed',
      message: 'Failed to upload to IPFS network',
      code: 'IPFS_UPLOAD_FAILED'
    });
  });

  test('should handle AI generation error', () => {
    const error = new Error('AI generation failed');
    error.type = 'AI_ERROR';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: 'AI generation failed',
      message: 'AI service is currently unavailable',
      code: 'AI_SERVICE_ERROR'
    });
  });

  test('should handle rate limit error', () => {
    const error = new Error('Rate limit exceeded');
    error.type = 'RATE_LIMIT';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  });

  test('should handle validation error', () => {
    const error = new Error('Validation failed');
    error.type = 'VALIDATION_ERROR';
    error.details = ['Field is required', 'Invalid format'];

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      message: 'Request validation failed',
      code: 'VALIDATION_ERROR',
      details: ['Field is required', 'Invalid format']
    });
  });

  test('should handle Flow blockchain error', () => {
    const error = new Error('Transaction failed');
    error.type = 'FLOW_ERROR';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Transaction failed',
      message: 'Flow blockchain operation failed',
      code: 'FLOW_ERROR'
    });
  });

  test('should handle authentication error', () => {
    const error = new Error('Unauthorized');
    error.type = 'AUTH_ERROR';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  });

  test('should handle permission error', () => {
    const error = new Error('Forbidden');
    error.type = 'PERMISSION_ERROR';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Insufficient permissions',
      code: 'FORBIDDEN'
    });
  });

  test('should handle not found error', () => {
    const error = new Error('Resource not found');
    error.type = 'NOT_FOUND';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Resource not found',
      message: 'The requested resource was not found',
      code: 'NOT_FOUND'
    });
  });

  test('should handle generic error', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  });

  test('should log error details', () => {
    const error = new Error('Test error');
    error.stack = 'Error stack trace';

    errorHandler(error, req, res, next);

    expect(console.error).toHaveBeenCalledWith(
      'Error occurred:',
      expect.objectContaining({
        message: 'Test error',
        stack: 'Error stack trace',
        request: {
          method: 'POST',
          url: '/api/test',
          ip: '127.0.0.1'
        }
      })
    );
  });

  test('should include error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Development error');
    error.stack = 'Error stack trace';

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: 'Error stack trace'
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  test('should not include error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Production error');
    error.stack = 'Error stack trace';

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.not.objectContaining({
        stack: expect.anything()
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  test('should handle error without message', () => {
    const error = new Error();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  });

  test('should handle non-Error objects', () => {
    const error = 'String error';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    });
  });
});