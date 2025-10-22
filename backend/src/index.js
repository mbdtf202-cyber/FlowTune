import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Import database
import Database from './config/database.js';

// Import routes
import aiRoutes from './routes/ai.js';
import ipfsRoutes from './routes/ipfs.js';
import uploadRoutes from './routes/upload.js';
import musicRoutes from './routes/music.js';
import authRoutes from './routes/auth.js';
import playlistRoutes from './routes/playlists.js';
import forteActionsRoutes from './routes/forteActions.js';
import quickNodeRoutes from './routes/quicknode.js';
import moonPayRoutes from './routes/moonpay.js';
import analyticsRoutes from './routes/analytics.js';
import audioRoutes from './routes/audio.js';
import socialRoutes from './routes/social.js';
import royaltiesRoutes from './routes/royalties.js';
import nftRoutes from './routes/nft.js';
import userRoutes from './routes/user.js';
import flowProxyRoutes from './routes/flowProxy.js';
import notificationRoutes from './routes/notifications.js';
import activityRoutes from './routes/activity.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import rateLimiterMiddleware from './middleware/rateLimiter.js';
import securityMiddleware from './middleware/security.js';
import { securityMonitorMiddleware } from './middleware/securityMonitor.js';
import logger from './utils/logger.js';
import websocketService from './services/websocketService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Check for local demo mode
const isLocalMode = process.env.LOCAL_DEMO_MODE === 'true' || process.env.DISABLE_NETWORK_CALLS === 'true';

const app = express();
const PORT = process.env.PORT || 3001;

// Log mode
if (isLocalMode) {
  console.log('🏠 Running in LOCAL DEMO MODE - Network calls disabled');
} else {
  console.log('🌐 Running in NETWORK MODE');
}

// Security middleware
app.use(securityMiddleware.securityHeaders);
app.use(securityMonitorMiddleware);
app.use(securityMiddleware.requestLogger);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.sqlInjectionPrevention);

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3002',
    process.env.CORS_ORIGIN || 'http://localhost:5173'
  ].filter(Boolean),
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use(securityMiddleware.rateLimiters.general);

// Root endpoint - API information
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FlowTune Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      ai: '/api/ai',
      ipfs: '/api/ipfs',
      music: '/api/music',
      audio: '/api/audio',
      analytics: '/api/analytics',
      social: '/api/social',
      royalties: '/api/royalties',
      forteActions: '/api/forte-actions',
      quicknode: '/api/quicknode',
      moonpay: '/api/moonpay',
      playlists: '/api/playlists',
      upload: '/api/upload',
      flowProxy: '/api/flow-proxy',
      notifications: '/api/notifications',
      activity: '/api/activity'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FlowTune Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/forte-actions', forteActionsRoutes);
app.use('/api/quicknode', quickNodeRoutes);
app.use('/api/moonpay', moonPayRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/royalties', royaltiesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/flow-proxy', flowProxyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database
    await Database.connect();
    logger.info('Database connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 FlowTune Backend API running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔐 Authentication: http://localhost:${PORT}/api/auth`);
      logger.info(`🎵 AI Music Generation: http://localhost:${PORT}/api/ai`);
      logger.info(`📁 IPFS Service: http://localhost:${PORT}/api/ipfs`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    });

    // Initialize WebSocket service
    websocketService.initialize(server);
    
    // Make websocketService available globally for other modules
    global.websocketService = websocketService;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await Database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await Database.disconnect();
  process.exit(0);
});

startServer();

export default app;