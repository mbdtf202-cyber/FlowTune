/**
 * Rate Limiting Middleware
 * Prevents abuse of AI generation and IPFS upload endpoints
 */

const requestCounts = new Map();
const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

export const rateLimiter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Clean old entries
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.windowStart > WINDOW_SIZE) {
      requestCounts.delete(ip);
    }
  }
  
  // Get or create client data
  let clientData = requestCounts.get(clientIP);
  if (!clientData || now - clientData.windowStart > WINDOW_SIZE) {
    clientData = {
      count: 0,
      windowStart: now
    };
    requestCounts.set(clientIP, clientData);
  }
  
  // Check if limit exceeded
  if (clientData.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: true,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.windowStart + WINDOW_SIZE - now) / 1000)
    });
  }
  
  // Increment counter
  clientData.count++;
  
  // Add headers
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS,
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - clientData.count),
    'X-RateLimit-Reset': new Date(clientData.windowStart + WINDOW_SIZE).toISOString()
  });
  
  next();
};

// Stricter rate limiting for AI generation endpoints
export const aiRateLimiter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const AI_WINDOW_SIZE = 60 * 60 * 1000; // 1 hour
  const MAX_AI_REQUESTS = 100; // Max AI generations per hour (increased for testing)
  
  const aiRequestKey = `ai_${clientIP}`;
  let clientData = requestCounts.get(aiRequestKey);
  
  if (!clientData || now - clientData.windowStart > AI_WINDOW_SIZE) {
    clientData = {
      count: 0,
      windowStart: now
    };
    requestCounts.set(aiRequestKey, clientData);
  }
  
  if (clientData.count >= MAX_AI_REQUESTS) {
    return res.status(429).json({
      error: true,
      message: 'AI generation limit exceeded. Please try again in an hour.',
      retryAfter: Math.ceil((clientData.windowStart + AI_WINDOW_SIZE - now) / 1000)
    });
  }
  
  clientData.count++;
  
  res.set({
    'X-AI-RateLimit-Limit': MAX_AI_REQUESTS,
    'X-AI-RateLimit-Remaining': Math.max(0, MAX_AI_REQUESTS - clientData.count),
    'X-AI-RateLimit-Reset': new Date(clientData.windowStart + AI_WINDOW_SIZE).toISOString()
  });
  
  next();
};

// Rate limiting for playlist operations
export const playlistLimiter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const PLAYLIST_WINDOW_SIZE = 5 * 60 * 1000; // 5 minutes
  const MAX_PLAYLIST_REQUESTS = 50; // Max playlist operations per 5 minutes
  
  const playlistRequestKey = `playlist_${clientIP}`;
  let clientData = requestCounts.get(playlistRequestKey);
  
  if (!clientData || now - clientData.windowStart > PLAYLIST_WINDOW_SIZE) {
    clientData = {
      count: 0,
      windowStart: now
    };
    requestCounts.set(playlistRequestKey, clientData);
  }
  
  if (clientData.count >= MAX_PLAYLIST_REQUESTS) {
    return res.status(429).json({
      error: true,
      message: 'Playlist operation limit exceeded. Please try again in a few minutes.',
      retryAfter: Math.ceil((clientData.windowStart + PLAYLIST_WINDOW_SIZE - now) / 1000)
    });
  }
  
  clientData.count++;
  
  res.set({
    'X-Playlist-RateLimit-Limit': MAX_PLAYLIST_REQUESTS,
    'X-Playlist-RateLimit-Remaining': Math.max(0, MAX_PLAYLIST_REQUESTS - clientData.count),
    'X-Playlist-RateLimit-Reset': new Date(clientData.windowStart + PLAYLIST_WINDOW_SIZE).toISOString()
  });
  
  next();
};

export default { rateLimiter, aiRateLimiter, playlistLimiter };