/**
 * Global Error Handler Middleware
 * Handles all errors in the application and returns appropriate responses
 */

export const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error('Error occurred:', {
    message: err?.message || 'Unknown error',
    stack: err?.stack,
    request: {
      method: req?.method,
      url: req?.url,
      ip: req?.ip
    }
  });

  let statusCode = 500;
  let errorResponse = {
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  };

  // Handle different error types
  if (err && typeof err === 'object') {
    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      errorResponse = {
        error: err.message || 'File too large',
        message: 'The uploaded file exceeds the maximum allowed size',
        code: 'FILE_TOO_LARGE'
      };
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      statusCode = 413;
      errorResponse = {
        error: err.message || 'Too many files',
        message: 'Too many files uploaded at once',
        code: 'TOO_MANY_FILES'
      };
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      statusCode = 400;
      errorResponse = {
        error: err.message || 'Unexpected field',
        message: 'Unexpected file field in upload',
        code: 'UNEXPECTED_FIELD'
      };
    }
    // Custom error types
    else if (err.type === 'IPFS_ERROR') {
      statusCode = 502;
      errorResponse = {
        error: err.message || 'IPFS upload failed',
        message: 'Failed to upload to IPFS network',
        code: 'IPFS_UPLOAD_FAILED'
      };
    } else if (err.type === 'AI_ERROR') {
      statusCode = 502;
      errorResponse = {
        error: err.message || 'AI generation failed',
        message: 'AI service is currently unavailable',
        code: 'AI_SERVICE_ERROR'
      };
    } else if (err.type === 'RATE_LIMIT') {
      statusCode = 429;
      errorResponse = {
        error: err.message || 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      };
    } else if (err.type === 'VALIDATION_ERROR') {
      statusCode = 400;
      errorResponse = {
        error: err.message || 'Validation failed',
        message: 'Request validation failed',
        code: 'VALIDATION_ERROR'
      };
      if (err.details) {
        errorResponse.details = err.details;
      }
    } else if (err.type === 'FLOW_ERROR') {
      statusCode = 502;
      errorResponse = {
        error: err.message || 'Transaction failed',
        message: 'Flow blockchain operation failed',
        code: 'FLOW_ERROR'
      };
    } else if (err.type === 'AUTH_ERROR') {
      statusCode = 401;
      errorResponse = {
        error: err.message || 'Unauthorized',
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      };
    } else if (err.type === 'PERMISSION_ERROR') {
      statusCode = 403;
      errorResponse = {
        error: err.message || 'Forbidden',
        message: 'Insufficient permissions',
        code: 'FORBIDDEN'
      };
    } else if (err.type === 'NOT_FOUND') {
      statusCode = 404;
      errorResponse = {
        error: err.message || 'Resource not found',
        message: 'The requested resource was not found',
        code: 'NOT_FOUND'
      };
    }
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development' && err?.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;